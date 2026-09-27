import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";
import type { BroadcastAgeBand } from "@/api/schemas";

/**
 * Phase 13 gap closure (gap 6c) — age-band targeting.
 *
 * Five fixed bands matching the backend BroadcastPushIn.age_band Literal
 * and the admin demographics dashboard buckets (admin.py:297-304):
 *   18-24 = age <25, 25-34 = age <35, 35-44 = age <45, 45+ = else.
 *
 * "All ages" is the no-op default; selecting any other band restricts the
 * broadcast fan-out to users whose age falls inside that band. Users with
 * NULL date_of_birth are excluded server-side for every banded send
 * (documented in the BroadcastPushIn Pydantic model docstring).
 *
 * UI mirrors AudienceSegmentRadio for consistency — same spacing,
 * radio-circle treatment, accessibility roles, and testID scheme.
 */
export type AgeBandValue = BroadcastAgeBand;

export const AGE_BAND_OPTIONS: { value: AgeBandValue; label: string }[] = [
  { value: "all", label: "All ages" },
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45+", label: "45+" },
];

export function AudienceAgeBandRadio({
  value,
  onChange,
}: {
  value: AgeBandValue;
  onChange: (v: AgeBandValue) => void;
}) {
  const colors = useColors();
  return (
    <View testID="audience-age-band-radio">
      {AGE_BAND_OPTIONS.map((opt) => {
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
            testID={`age-band-${opt.value}`}
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
