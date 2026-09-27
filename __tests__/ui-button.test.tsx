import { fireEvent, render, screen } from "@testing-library/react-native";

import { UIButton } from "@/components/ui/ui-button";
import { useColors } from "@/hooks/use-colors";

jest.mock("@/hooks/use-colors", () => ({
  useColors: jest.fn(),
}));

const mockUseColors = jest.mocked(useColors);

describe("UIButton", () => {
  beforeEach(() => {
    mockUseColors.mockReturnValue({
      primary: "#111111",
      white: "#ffffff",
      text: "#222222",
    } as ReturnType<typeof useColors>);
  });

  test("calls onPress when enabled", () => {
    const onPress = jest.fn();
    render(<UIButton title="Submit" onPress={onPress} />);

    fireEvent.press(screen.getByText("Submit"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("blocks presses when explicitly disabled", () => {
    const onPress = jest.fn();
    render(<UIButton title="Submit" disabled onPress={onPress} />);

    fireEvent.press(screen.getByText("Submit"));

    expect(onPress).not.toHaveBeenCalled();
  });

  test("shows a loading indicator and blocks presses while loading", () => {
    const onPress = jest.fn();
    render(
      <UIButton
        title="Submit"
        testID="loading-submit"
        isLoading
        onPress={onPress}
      />,
    );

    expect(screen.queryByText("Submit")).toBeNull();
    fireEvent.press(screen.getByTestId("loading-submit"));

    expect(onPress).not.toHaveBeenCalled();
  });
});
