import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";
import type { BroadcastAudience } from "@/api/schemas";

/**
 * Phase 13 — PUSH-03.
 * Four audience segments per UI-SPEC §Admin Push. The "all" pseudo-value
 * maps to role_filter=null on the wire; the other three map to the
 * matching BroadcastAudience role on the backend.
 *
 * "Coming soon" age segments from the prior implementation have been
 * removed entirely (D-10/D-11 lock to role-only).
 */
export type AudienceValue = "all" | BroadcastAudience;

export const AUDIENCE_OPTIONS: { value: AudienceValue; label: string }[] = [
  { value: "all", label: "All users" },
  { value: "attendee", label: "Attendees" },
  { value: "speaker", label: "Speakers" },
  { value: "exhibitor", label: "Exhibitors" },
];

export function AudienceSegmentRadio({
  value,
  onChange,
}: {
  value: AudienceValue;
  onChange: (v: AudienceValue) => void;
}) {
  const colors = useColors();
  return (
    <View testID="audience-segment-radio">
      {AUDIENCE_OPTIONS.map((opt) => {
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
            testID={`audience-${opt.value}`}
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
