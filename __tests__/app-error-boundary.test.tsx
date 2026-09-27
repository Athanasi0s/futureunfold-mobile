import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppErrorBoundary } from "@/components/app-error-boundary";
import { reportError } from "@/lib/error-reporting";

jest.mock("@/lib/error-reporting", () => ({
  reportError: jest.fn(),
}));

jest.mock("@/lib/i18n", () => ({
  __esModule: true,
  default: {
    t: (key: string) =>
      ({
        "common.error": "Something went wrong",
        "common.unexpectedError":
          "The app encountered an unexpected error. Please try again.",
        "common.retry": "Try again",
      })[key] ?? key,
  },
}));

const mockReportError = jest.mocked(reportError);

describe("AppErrorBoundary", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    mockReportError.mockClear();
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  test("renders children while the app tree is healthy", () => {
    render(
      <AppErrorBoundary>
        <Text>Healthy app</Text>
      </AppErrorBoundary>,
    );

    expect(screen.getByText("Healthy app")).toBeTruthy();
    expect(screen.queryByTestId("app-error-boundary")).toBeNull();
  });

  test("reports render errors and shows a safe fallback", () => {
    const error = new Error("render failed");
    const CrashingChild = () => {
      throw error;
    };

    render(
      <AppErrorBoundary>
        <CrashingChild />
      </AppErrorBoundary>,
    );

    expect(screen.getByTestId("app-error-boundary")).toBeTruthy();
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(mockReportError).toHaveBeenCalledWith(error, {
      componentStack: expect.any(String),
    });
  });

  test("retries rendering after a recoverable error", () => {
    let shouldCrash = true;
    const RecoverableChild = () => {
      if (shouldCrash) {
        throw new Error("temporary failure");
      }
      return <Text>Recovered app</Text>;
    };

    render(
      <AppErrorBoundary>
        <RecoverableChild />
      </AppErrorBoundary>,
    );

    shouldCrash = false;
    fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("Recovered app")).toBeTruthy();
    expect(screen.queryByTestId("app-error-boundary")).toBeNull();
  });
});
