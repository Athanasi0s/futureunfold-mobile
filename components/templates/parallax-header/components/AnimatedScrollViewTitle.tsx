import {
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import React from "react";
import type { AnimatedScrollViewTitleProps } from "../types";
import { ThemedText } from "@/components/themed-text";

export const AnimatedScrollViewTitle: React.FC<
  AnimatedScrollViewTitleProps
> = ({ children, size, style }) => {
  const { width } = useWindowDimensions();
  const maxWidth = 0.5 * width;

  return (
    <View style={styles.container}>
      <ThemedText
        numberOfLines={2}
        style={[
          styles.text,
          {
            maxWidth,
            fontSize: size ?? 35,
          },
          style,
        ]}
      >
        {children}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
  },
  text: {
    color: "white",
    fontWeight: "700",
    textAlign: "left",
  },
});
