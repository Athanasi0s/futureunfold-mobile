import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { DensityColors } from "../constants/colors";

const BARS = [
  { color: DensityColors.red },    // top
  { color: DensityColors.orange },
  { color: DensityColors.yellow },
  { color: DensityColors.green },  // bottom
];

export default function CrowdLegend() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Reset opacity on mount (re-show when toggled on)
    opacity.setValue(1);
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 3000);
    return () => clearTimeout(timer);
  }, [opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      {BARS.map((bar, i) => (
        <View
          key={i}
          style={[styles.bar, { backgroundColor: bar.color }]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    bottom: 156, // above the crowd toggle (which is at bottom: 100)
    alignItems: "center",
    gap: 2,
  },
  bar: {
    width: 8,
    height: 18,
    borderRadius: 4,
  },
});
