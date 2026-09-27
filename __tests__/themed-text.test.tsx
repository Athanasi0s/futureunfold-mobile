import { render, screen } from "@testing-library/react-native";

import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";

jest.mock("@/hooks/use-colors", () => ({
  useColors: jest.fn(),
}));

const mockUseColors = jest.mocked(useColors);

describe("ThemedText", () => {
  beforeEach(() => {
    mockUseColors.mockReturnValue({
      text: "#101010",
      link: "#202020",
    } as ReturnType<typeof useColors>);
  });

  test("renders children using the default text color", () => {
    render(<ThemedText>Hello festival</ThemedText>);

    expect(screen.getByText("Hello festival")).toHaveStyle({
      color: "#101010",
    });
  });

  test("uses the link color for link text", () => {
    render(<ThemedText type="link">Open details</ThemedText>);

    expect(screen.getByText("Open details")).toHaveStyle({
      color: "#202020",
    });
  });
});
