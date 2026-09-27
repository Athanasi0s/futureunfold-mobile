import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MapColors } from "../constants/colors";
import { useMapStore } from "../stores/map-store";

export default function CrowdToggle() {
  const showCrowdView = useMapStore((s) => s.showCrowdView);
  const toggleCrowdView = useMapStore((s) => s.toggleCrowdView);

  return (
    <TouchableOpacity
      style={[styles.button, showCrowdView && styles.buttonActive]}
      onPress={toggleCrowdView}
      activeOpacity={0.7}
    >
      <Ionicons
        name="flame"
        size={20}
        color={showCrowdView ? MapColors.text : MapColors.textSecondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(28, 28, 46, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  buttonActive: {
    backgroundColor: "rgba(249, 115, 22, 0.8)",
    borderColor: "rgba(249, 115, 22, 0.5)",
  },
});
