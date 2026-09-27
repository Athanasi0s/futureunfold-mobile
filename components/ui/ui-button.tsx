import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  type PressableProps,
} from "react-native";

import { ThemedText } from "../themed-text";

type UIButtonProps = Omit<PressableProps, "children"> & {
  title: string;
  variant?: "basic" | "outlined" | "text";
  icon?: keyof typeof MaterialIcons.glyphMap;
  isLoading?: boolean;
  textStyle?: StyleProp<TextStyle>;
};

export function UIButton({
  title,
  variant = "basic",
  icon,
  isLoading = false,
  disabled,
  style,
  textStyle,
  ...rest
}: UIButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || isLoading;

  const iconColor = {
    basic: colors.white,
    outlined: colors.primary,
    text: colors.primary,
  };

  const variantStyles = {
    basic: { backgroundColor: colors.primary },
    outlined: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.primary },
    text: { backgroundColor: "transparent" },
  };

  const labelStyles = {
    basic: { color: colors.white },
    outlined: { color: colors.primary },
    text: { color: colors.primary },
  };

  return (
    <Pressable
      style={[
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        style as any,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="small" color={iconColor[variant]} />
        ) : (
          <>
            <ThemedText
              style={[
                styles.label,
                labelStyles[variant],
                textStyle,
              ]}
            >
              {title}
            </ThemedText>
            {icon && (
              <MaterialIcons name={icon} size={20} color={iconColor[variant]} />
            )}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});
