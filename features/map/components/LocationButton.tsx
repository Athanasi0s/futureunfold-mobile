import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { SHADOW_BLACK } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
interface LocationButtonProps {
  onPress: () => void;
}

export default function LocationButton({ onPress }: LocationButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <MaterialCommunityIcons name="crosshairs-gps" size={22} color={COLOR_WHITE_ON_ACCENT} />
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
