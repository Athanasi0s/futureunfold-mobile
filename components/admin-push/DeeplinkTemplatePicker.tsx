import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";
import type { DeeplinkTemplate } from "@/api/schemas";

/**
 * Phase 13 — PUSH-01.
 * Eight predefined deeplink templates per UI-SPEC §Admin Push.
 * The order and labels are canonical (do not reorder).
 */
export const TEMPLATE_OPTIONS: { value: DeeplinkTemplate; label: string }[] = [
  { value: "none", label: "No link (open app home)" },
  { value: "trending_group", label: "Trending group (last 7 days)" },
  { value: "trending_session", label: "Trending session (last 7 days)" },
  { value: "biggest_group", label: "Biggest group (most members)" },
  { value: "biggest_group_chat", label: "Most active group chat" },
  { value: "biggest_session", label: "Biggest session (most attendees)" },
  { value: "leaderboard", label: "Leaderboard" },
  { value: "schedule", label: "Schedule" },
];

export function DeeplinkTemplatePicker({
  value,
  onChange,
}: {
  value: DeeplinkTemplate;
  onChange: (v: DeeplinkTemplate) => void;
}) {
  const colors = useColors();
  return (
    <View testID="deeplink-template-picker">
      {TEMPLATE_OPTIONS.map((opt) => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
            style={[
              styles.row,
              {
                backgroundColor: colors.cardBackground,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
            testID={`deeplink-template-${opt.value}`}
          >
            <View
              style={[
                styles.radioOuter,
                { borderColor: selected ? colors.primary : colors.icon },
              ]}
            >
              {selected ? (
                <View
                  style={[styles.radioInner, { backgroundColor: colors.primary }]}
                />
              ) : null}
            </View>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              {opt.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: "400",
    flex: 1,
  },
});
