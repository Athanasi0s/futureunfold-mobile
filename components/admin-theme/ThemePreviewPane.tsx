/**
 * Phase 13 Plan 08 — admin theme panel: live preview pane.
 *
 * Renders 3 sample UI fragments — primary CTA button, card with title+body,
 * and an accent chip — using the in-progress (not yet persisted) slot values.
 * The admin sees the combination live as they tap swatches in PaletteSwatchGrid.
 *
 * Uses slot values as runtime string props (not Literal AST nodes), so the
 * ESLint no-restricted-syntax rule does not flag the inline `backgroundColor`
 * expressions. Other tokens come from `useColors()`.
 */

import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";

export interface ThemePreviewPaneProps {
  /** Preview uses the live-editing state, not the persisted config. */
  color1: string; // Primary & CTAs
  color2: string; // Background
  color3: string; // Accent & highlights
  color4: string; // Surface
  testID?: string;
}

export function ThemePreviewPane({
  color1,
  color2,
  color3,
  color4,
  testID,
}: ThemePreviewPaneProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.pane,
        { backgroundColor: color2, borderColor: colors.cardBorder },
      ]}
      testID={testID ?? "theme-preview-pane"}
    >
      <View style={[styles.cta, { backgroundColor: color1 }]}>
        <ThemedText style={[styles.ctaText, { color: colors.white }]}>
          Primary button
        </ThemedText>
      </View>
      <View style={[styles.card, { backgroundColor: color4 }]}>
        <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
          Card title
        </ThemedText>
        <ThemedText
          style={[styles.cardBody, { color: colors.textSecondary }]}
        >
          Body text on a surface.
        </ThemedText>
      </View>
      <View style={styles.chipRow}>
        <View style={[styles.chip, { backgroundColor: color3 }]}>
          <ThemedText style={[styles.chipText, { color: colors.white }]}>
            Accent chip
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pane: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  cta: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  ctaText: { fontSize: 14, fontWeight: "700" },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  cardBody: { fontSize: 13, fontWeight: "400" },
  chipRow: { flexDirection: "row" },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  chipText: { fontSize: 11, fontWeight: "700" },
});
