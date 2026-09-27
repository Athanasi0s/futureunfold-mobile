import { SHADOW_BLACK } from "@/constants/data-colors";
import { useColors } from "@/hooks/use-colors";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";

export type ProgramView = "full" | "agenda";

interface ProgramToggleProps {
  value: ProgramView;
  onChange: (value: ProgramView) => void;
}

export function ProgramToggle({ value, onChange }: ProgramToggleProps) {
  const colors = useColors();
  const containerBg = colors.chipBackground;
  const activeBg = colors.surfacePrimary;
  const activeText = colors.brand;
  const inactiveText = colors.textSecondary;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: containerBg }]}>
        <TouchableOpacity
          style={[
            styles.option,
            value === "full" && [
              styles.optionActive,
              { backgroundColor: activeBg },
            ],
          ]}
          onPress={() => onChange("full")}
          activeOpacity={0.7}
        >
          <ThemedText
            style={[
              styles.optionText,
              { color: value === "full" ? activeText : inactiveText },
            ]}
          >
            Full Program
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            value === "agenda" && [
              styles.optionActive,
              { backgroundColor: activeBg },
            ],
          ]}
          onPress={() => onChange("agenda")}
          activeOpacity={0.7}
        >
          <ThemedText
            style={[
              styles.optionText,
              { color: value === "agenda" ? activeText : inactiveText },
            ]}
          >
            My Agenda
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  container: {
    flexDirection: "row",
    height: 44,
    borderRadius: 12,
    padding: 4,
  },
  option: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  optionActive: {
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
