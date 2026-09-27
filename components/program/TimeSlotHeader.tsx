import { useColors } from "@/hooks/use-colors";
import React from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";

interface TimeSlotHeaderProps {
  time: string; // Formatted time string like "09:00 AM"
  isFirst?: boolean;
}

export function TimeSlotHeader({ time, isFirst = false }: TimeSlotHeaderProps) {
  const colors = useColors();
  const backgroundColor = colors.surfacePrimary;
  const secondaryColor = colors.textTertiary;
  const textColor = isFirst ? colors.brand : secondaryColor;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ThemedText style={[styles.time, { color: textColor }]}>{time}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  time: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
