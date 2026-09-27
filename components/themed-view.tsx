import { View, type ViewProps } from "react-native";

import { UIThemeColor } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";

export type ThemedViewProps = ViewProps & {
  color?: UIThemeColor;
};

export function ThemedView({ style, color, ...otherProps }: ThemedViewProps) {
  const colors = useColors();
  const bgColor = color ? colors[color] : colors.background;

  return <View style={[{ backgroundColor: bgColor }, style]} {...otherProps} />;
}
