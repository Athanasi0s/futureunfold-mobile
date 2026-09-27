/**
 * Phase 13 Plan 08 — admin theme panel: horizontal preset shortcut row.
 *
 * Tapping a preset card fills all 4 slots (Primary / Background / Accent /
 * Surface) with that preset's defaults and marks the panel dirty. Existing
 * preset THEME_PRESETS (from Plan 5) drive the cards; no new data.
 *
 * Per UI-SPEC §3: 140pt wide × 80pt tall cards, 4-swatch preview + preset
 * name below. The `backgroundColor` values are runtime strings sourced from
 * `constants/theme-presets.ts` — not Literal AST nodes in this file, so the
 * ESLint no-restricted-syntax rule does not flag them.
 */

import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { THEME_PRESETS, type ThemePreset } from "@/constants/theme-presets";
import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";

export interface PresetShortcutRowProps {
  activePresetId: string | null;
  onApply: (preset: ThemePreset) => void;
  testID?: string;
}

export function PresetShortcutRow({
  activePresetId,
  onApply,
  testID,
}: PresetShortcutRowProps) {
  const colors = useColors();
  return (
    <FlatList
      testID={testID ?? "preset-shortcut-row"}
      horizontal
      showsHorizontalScrollIndicator={false}
      data={THEME_PRESETS}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.row}
      renderItem={({ item }) => {
        const active = activePresetId === item.id;
        return (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Apply preset ${item.name}`}
            accessibilityState={{ selected: active }}
            onPress={() => onApply(item)}
            activeOpacity={0.7}
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                borderColor: active ? colors.primary : colors.cardBorder,
                borderWidth: active ? 2 : 1,
              },
            ]}
            testID={`preset-${item.id}`}
          >
            <View style={styles.swatchRow}>
              <View
                style={[styles.swatch, { backgroundColor: item.primary }]}
              />
              <View
                style={[styles.swatch, { backgroundColor: item.background }]}
              />
              <View
                style={[styles.swatch, { backgroundColor: item.accent }]}
              />
              <View
                style={[styles.swatch, { backgroundColor: item.secondary }]}
              />
            </View>
            <ThemedText
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </ThemedText>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { gap: 12, paddingVertical: 4 },
  card: {
    width: 140,
    height: 80,
    borderRadius: 12,
    padding: 8,
    justifyContent: "space-between",
  },
  swatchRow: { flexDirection: "row", gap: 4 },
  swatch: { width: 24, height: 24, borderRadius: 6 },
  name: { fontSize: 13, fontWeight: "700" },
});
