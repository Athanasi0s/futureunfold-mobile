import { View, StyleSheet } from "react-native";
import React from "react";
import type { AnimatedScrollViewTitleProps } from "../../types";

export const AnimatedScrollViewTitleWrapper: React.FC<
  AnimatedScrollViewTitleProps
> = ({ children }) => {
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
  },
});
