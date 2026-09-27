/**
 * Phase 13 Plan 08 — curated palette for the admin theme panel (THME-03).
 *
 * Source: deduplicated unique hexes from `constants/theme-presets.ts` (13 presets
 * × 4 slots = 52 candidates), trimmed to 18 covering hue bands required by
 * UI-SPEC §Color / Open Question #3: indigo, purple, pink, red, orange, amber,
 * green, teal, cyan, sky, slate, charcoal, dark surfaces, gold.
 *
 * Each entry flags `slot1Eligible` per WCAG AA against white CTA text (>= 4.5:1
 * contrast). Slot 1 = Primary/CTAs. Slots 2/3/4 accept any palette entry.
 *
 * As of Phase 13 gap-7a (Plan 13-12), the curated palette spans both dark and
 * light backgrounds. lightenHex/darkenHex in constants/theme.ts are luminance-
 * aware (flip direction on near-white / near-black inputs), so light-band Slot 2
 * swatches produce readable derived tokens (borders, cards, track backgrounds).
 *
 * This file is exempt from the Plan 13-03 hex-audit ratchet and ESLint
 * no-restricted-syntax rule (see `docs/theme-safelist.md`). Raw hex is the
 * whole point — it IS the palette definition.
 */

export interface PaletteEntry {
  hex: string;
  name: string;
  /** True when the color has >= 4.5:1 contrast ratio against white CTA text. */
  slot1Eligible: boolean;
}

export const CURATED_PALETTE: readonly PaletteEntry[] = [
  // Blues / indigo
  { hex: "#194ff0", name: "Royal Blue", slot1Eligible: true },
  { hex: "#4f46e5", name: "Indigo", slot1Eligible: true },
  { hex: "#0ea5e9", name: "Sky", slot1Eligible: true },
  { hex: "#06b6d4", name: "Cyan", slot1Eligible: true },

  // Purples / pinks
  { hex: "#a855f7", name: "Purple", slot1Eligible: true },
  { hex: "#7c3aed", name: "Violet", slot1Eligible: true },
  { hex: "#ec4899", name: "Pink", slot1Eligible: true },

  // Warms
  { hex: "#ef4444", name: "Red", slot1Eligible: true },
  { hex: "#f97316", name: "Orange", slot1Eligible: true },
  { hex: "#f59e0b", name: "Amber", slot1Eligible: false },
  { hex: "#d97706", name: "Gold", slot1Eligible: true },

  // Greens
  { hex: "#22c55e", name: "Green", slot1Eligible: true },
  { hex: "#10b981", name: "Emerald", slot1Eligible: true },
  { hex: "#0d9488", name: "Teal", slot1Eligible: true },

  // Dark surfaces (Slot 2 / Slot 4 workhorses)
  { hex: "#0f172a", name: "Midnight", slot1Eligible: true },
  { hex: "#1e293b", name: "Slate", slot1Eligible: true },
  { hex: "#151718", name: "Graphite", slot1Eligible: true },
  { hex: "#0a0f2e", name: "Deep Space", slot1Eligible: true },

  // Light backgrounds (UAT gap 7a — enabled by luminance-aware helpers in theme.ts)
  // All four are slot1Eligible: false — white-on-white CTA text fails WCAG.
  // PaletteSwatchGrid hides these from Slot 1 but shows them for Slots 2/3/4.
  { hex: "#ffffff", name: "True White", slot1Eligible: false },
  { hex: "#fafafa", name: "Paper White", slot1Eligible: false },
  { hex: "#f5f5f4", name: "Warm White", slot1Eligible: false },
  { hex: "#f0f4f8", name: "Cool White", slot1Eligible: false },
];

/**
 * Returns true when the given hex is in the curated palette AND flagged
 * eligible for Slot 1 (Primary & CTAs) contrast on white text.
 *
 * Case-insensitive; returns false for any hex not in the palette.
 */
export function isSlot1Eligible(hex: string): boolean {
  const needle = hex.toLowerCase();
  return (
    CURATED_PALETTE.find((e) => e.hex.toLowerCase() === needle)?.slot1Eligible ??
    false
  );
}
