import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

import { SHADOW_BLACK } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
interface CompassButtonProps {
  heading: number;
  onResetNorth: () => void;
}

export default function CompassButton({
  heading,
  onResetNorth,
}: CompassButtonProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: -heading,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [heading]);

  const rotate = rotateAnim.interpolate({
    inputRange: [-360, 360],
    outputRange: ["-360deg", "360deg"],
  });

  return (
    <Pressable onPress={onResetNorth} style={styles.button}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <MaterialCommunityIcons name="navigation" size={20} color={COLOR_WHITE_ON_ACCENT} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(26, 26, 46, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
