/**
 * Phase 13 Plan 08 — admin theme panel: a single labeled slot card.
 *
 * Shows the slot's semantic label (e.g. "Color 1 — Primary & CTAs"), a helper
 * description, and the current color as a 40x40 swatch. Tapping the card
 * activates the slot — the parent renders the shared PaletteSwatchGrid below
 * the active slot.
 *
 * The `props.currentHex` prop flows in as a runtime string from parent state.
 * The `backgroundColor: props.currentHex` style is a runtime value (not a
 * Literal AST node), so the ESLint `no-restricted-syntax` rule does NOT flag
 * it — by design. See `docs/theme-safelist.md` for the convention.
 */

import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";

export interface ColorSlotCardProps {
  label: string;
  helper: string;
  currentHex: string;
  isActive: boolean;
  onPress: () => void;
  testID?: string;
}

export function ColorSlotCard(props: ColorSlotCardProps) {
  const colors = useColors();
  const borderColor = props.isActive ? colors.primary : colors.cardBorder;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${props.label}, current color ${props.currentHex}`}
      accessibilityState={{ selected: props.isActive }}
      onPress={props.onPress}
      activeOpacity={0.7}
      testID={props.testID ?? "color-slot-card"}
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor,
          borderWidth: props.isActive ? 2 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.swatch,
            { backgroundColor: props.currentHex, borderColor: colors.border },
          ]}
          testID={`${props.testID ?? "color-slot-card"}-swatch`}
        />
        <View style={styles.text}>
          <ThemedText style={[styles.label, { color: colors.text }]}>
            {props.label}
          </ThemedText>
          <ThemedText
            style={[styles.helper, { color: colors.textSecondary }]}
          >
            {props.helper}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    minHeight: 72,
  },
  row: { flexDirection: "row", alignItems: "center" },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  text: { flex: 1 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  helper: { fontSize: 11, fontWeight: "400" },
});
