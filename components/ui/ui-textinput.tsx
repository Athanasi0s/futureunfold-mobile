import { UIThemeColor } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { ComponentProps, ReactNode, useState } from "react";
import { Control, Controller } from "react-hook-form";
import { StyleSheet, TextInput, View } from "react-native";
import Animated, {
  FadeInUp,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";
import { ThemedText } from "../themed-text";
import { UIVerticalSpacer } from "./UIVerticalSpacer";

type UITextInputProps = ComponentProps<typeof TextInput> & {
  control: Control<any>;
  name: string;
  label?: string;
  labelColor?: UIThemeColor;
  placeholder: string;
  backroundColor?: UIThemeColor;
  placeholderTextColor?: UIThemeColor;
  borderColor?: UIThemeColor;
  hasError?: boolean;
  errorMessage?: string;
  rightElement?: ReactNode;
};

export function UITextInput(props: UITextInputProps) {
  const {
    control,
    name,
    label,
    labelColor = "primary",
    placeholder,
    backroundColor = "white",
    placeholderTextColor = "placeholder",
    borderColor = "primary",
    hasError = false,
    errorMessage,
    keyboardType = "default",
    rightElement,
    ...rest
  } = props;
  const [isFocused, setIsFocused] = useState(false);
  const colors = useColors();

  return (
    <Animated.View layout={LinearTransition}>
      {label && (
        <ThemedText
          color={labelColor}
          style={{ fontSize: 14, textAlign: "left" }}
        >
          {label}
        </ThemedText>
      )}
      <UIVerticalSpacer height={4} />
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors[backroundColor],
                borderColor: hasError
                  ? colors.error
                  : isFocused
                  ? colors[borderColor]
                  : colors[backroundColor],
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                },
              ]}
              keyboardType={keyboardType}
              placeholder={placeholder}
              placeholderTextColor={colors[placeholderTextColor]}
              cursorColor={colors[placeholderTextColor]}
              onFocus={(e) => {
                setIsFocused(true);
                rest.onFocus?.(e);
              }}
              onBlur={(e) => {
                onBlur();
                setIsFocused(false);
                rest.onBlur?.(e);
              }}
              value={value}
              onChangeText={(text) =>
                onChange(keyboardType === "numeric" ? Number(text) : text)
              }
              {...rest}
            />
            {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
          </View>
        )}
      />
      {hasError && (
        <Animated.View entering={FadeInUp} exiting={FadeOutUp}>
          <ThemedText
            color="error"
            style={{
              fontSize: 14,
              paddingLeft: 12,
              textAlign: "left",
              color: colors.error,
            }}
          >
            {errorMessage}
          </ThemedText>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    height: 42,
    width: "100%",
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  rightElement: {
    marginLeft: 8,
  },
});
