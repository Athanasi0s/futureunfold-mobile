import { StyleSheet, Text, type TextProps } from "react-native";

import { UIThemeColor } from "@/constants/theme";
import { getTenantFontFamily } from "@/constants/tenant-assets";
import { useColors } from "@/hooks/use-colors";

export type ThemedTextProps = TextProps & {
  color?: UIThemeColor;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

const BOLD_TYPES: ThemedTextProps["type"][] = [
  "title",
  "subtitle",
  "defaultSemiBold",
];

export function ThemedText({
  style,
  color,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const colors = useColors();
  const textColor = color ? colors[color] : colors.text;
  const fontFamily = getTenantFontFamily(
    BOLD_TYPES.includes(type) ? "bold" : "regular",
  );

  return (
    <Text
      style={[
        { color: textColor },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? [styles.link, { color: colors.link }] : undefined,
        fontFamily ? { fontFamily } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
  },
});
