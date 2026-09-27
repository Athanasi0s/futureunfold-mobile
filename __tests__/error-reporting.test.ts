import { reportError } from "@/lib/error-reporting";
import { captureError } from "@/lib/sentry";

jest.mock("@/lib/sentry", () => ({
  captureError: jest.fn(),
}));

const mockCaptureError = jest.mocked(captureError);

describe("error reporting", () => {
  beforeEach(() => {
    mockCaptureError.mockReset();
  });

  test("records errors and their context", () => {
    mockCaptureError.mockReturnValue(false);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("unexpected failure");
    const context = { componentStack: "Component stack" };

    reportError(error, context);

    expect(consoleError).toHaveBeenCalledWith("[App Error]", error, context);
    consoleError.mockRestore();
  });

  test("does not log production errors after Sentry captures them", () => {
    mockCaptureError.mockReturnValue(true);
    const originalDev = (globalThis as any).__DEV__;
    (globalThis as any).__DEV__ = false;
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("captured failure");
    const context = { componentStack: "Component stack" };

    reportError(error, context);

    expect(mockCaptureError).toHaveBeenCalledWith(error, context);
    expect(consoleError).not.toHaveBeenCalled();

    (globalThis as any).__DEV__ = originalDev;
    consoleError.mockRestore();
  });
});
