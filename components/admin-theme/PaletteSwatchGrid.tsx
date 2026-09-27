/**
 * Phase 13 Plan 08 — admin theme panel: shared 18-swatch palette grid (THME-03).
 *
 * Renders CURATED_PALETTE as a flex-wrapped grid of 44x44 touch targets with
 * a visible 32x32 color swatch inside each. Selected swatch gets a 3px primary
 * border + check icon. Slot-1-specific filter: only slot1Eligible entries
 * render when `slot === 1` (WCAG AA contrast requirement per UI-SPEC).
 *
 * All hex strings here originate from `constants/theme-palette.ts` and are
 * runtime values (not Literal AST nodes in this file) — ESLint
 * no-restricted-syntax is satisfied. The helper text for slot 1 is hardcoded
 * English per UI-SPEC §Copywriting.
 */

import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CURATED_PALETTE, isSlot1Eligible } from "@/constants/theme-palette";
import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";

export interface PaletteSwatchGridProps {
  selectedHex: string | null;
  slot: 1 | 2 | 3 | 4;
  onSelect: (hex: string) => void;
  testID?: string;
}

export function PaletteSwatchGrid({
  selectedHex,
  slot,
  onSelect,
  testID,
}: PaletteSwatchGridProps) {
  const colors = useColors();
  const rootTestID = testID ?? "palette-swatch-grid";

  const visibleEntries = CURATED_PALETTE.filter((entry) =>
    slot === 1 ? isSlot1Eligible(entry.hex) : true,
  );

  return (
    <View testID={rootTestID}>
      {slot === 1 ? (
        <ThemedText style={[styles.note, { color: colors.textSecondary }]}>
          Only colors with sufficient contrast on white text are shown.
        </ThemedText>
      ) : null}
      <View style={styles.grid}>
        {visibleEntries.map((entry) => {
          const selected =
            !!selectedHex &&
            selectedHex.toLowerCase() === entry.hex.toLowerCase();
          return (
            <TouchableOpacity
              key={entry.hex}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${entry.name} ${entry.hex}`}
              onPress={() => onSelect(entry.hex)}
              activeOpacity={0.7}
              style={styles.cell}
              testID={`palette-swatch-${entry.hex.replace("#", "")}`}
            >
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: entry.hex,
                    borderColor: selected ? colors.primary : colors.border,
                    borderWidth: selected ? 3 : 1,
                  },
                ]}
              >
                {selected ? (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.white}
                  />
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cell: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  note: {
    fontSize: 11,
    fontWeight: "400",
    marginBottom: 8,
  },
});
