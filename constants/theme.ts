/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";
import { type ThemePreset } from "@/constants/theme-presets";

// ------------------------------------------------------------------
// Phase 13 Plan 09 — documented safe-list exports (per docs/theme-safelist.md)
// .tsx files import these named constants rather than inlining hex. The
// ESLint rule still forbids raw hex literals in app/**, components/**,
// features/** .tsx files; these constants live in constants/theme.ts which
// is the single exempt source-of-truth for palette values.
// ------------------------------------------------------------------

/**
 * CTA text / icon glyph on a colored (primary / accent) background.
 * Safe-listed in docs/theme-safelist.md — foreground-on-accent readability
 * invariant, not a palette choice.
 */
export const COLOR_WHITE_ON_ACCENT = "#fff";

/**
 * Google Wallet brand blue (#4285F4). Mandated by Google Wallet Brand
 * Guidelines — cannot be themed. Used ONLY inside the Google Wallet button
 * chrome when the official asset image isn't in use. See
 * components/wallet/GoogleWalletButton.tsx.
 *
 * Alias: Google Calendar / Google Sign-In brand CTA. Google's identity
 * mark uses the same blue across Calendar / Gmail / Meet / Wallet brand
 * surfaces. Import as `GOOGLE_BRAND_BLUE` from this module for non-Wallet
 * Google integrations (e.g. onboarding calendar connect button).
 */
export const GOOGLE_WALLET_BRAND = "#4285F4";
export const GOOGLE_BRAND_BLUE = GOOGLE_WALLET_BRAND;

/**
 * LinkedIn brand blue (#0077b5). Mandated by LinkedIn Brand Guidelines when
 * rendering a "View on LinkedIn" CTA — cannot be themed. Used only for the
 * LinkedIn button chrome / icon tint on user profile screens.
 */
export const LINKEDIN_BRAND = "#0077b5";

/**
 * Foreground text/icon color on LIGHT accent backgrounds (e.g. amber/gold
 * CTA buttons where white-on-yellow fails WCAG contrast). Safe-listed
 * contrast invariant, mirror of COLOR_WHITE_ON_ACCENT for the inverse case.
 */
export const COLOR_BLACK_ON_LIGHT_ACCENT = "#000";

/**
 * Future Unfold launch/auth artwork base color. Kept here instead of inline
 * in .tsx files so brand-specific colors remain auditable.
 */
export const FUTURE_UNFOLD_ARTWORK_BACKGROUND = "#19083a";
export const FUTURE_UNFOLD_ARTWORK_OVERLAY = "rgba(25, 8, 58, 0.08)";

/**
 * Inventory of all safe-list constants. Exported for future audit tooling
 * (e.g. a follow-up lint rule that insists on named-import usage rather
 * than allowing literal `"#fff"` even inside CTAs).
 */
export const SAFELIST_CONSTANTS = [
  COLOR_WHITE_ON_ACCENT,
  GOOGLE_WALLET_BRAND,
  LINKEDIN_BRAND,
  COLOR_BLACK_ON_LIGHT_ACCENT,
  FUTURE_UNFOLD_ARTWORK_BACKGROUND,
  FUTURE_UNFOLD_ARTWORK_OVERLAY,
] as const;

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Returns WCAG relative luminance for a hex color in [0, 1].
 * Used by the luminance-aware lightenHex/darkenHex to flip derivation
 * direction when the input is at an extreme (near-white or near-black),
 * so light-palette Slot 2 backgrounds produce readable borders/cards
 * instead of saturating to the same value as the background.
 *
 * Phase 13 gap-7a (Plan 13-12) — Option B per user decision.
 */
export function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const channel = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Threshold: above this luminance, lightenHex flips to darkenHex. */
const LUMINANCE_LIGHTEN_FLIP = 0.6;
/** Threshold: below this luminance, darkenHex flips to lightenHex. */
const LUMINANCE_DARKEN_FLIP = 0.1;

function _shiftLighter(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function _shiftDarker(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Shift each RGB channel up by `amount` (0-255), clamped to 255.
 * Luminance-aware: inputs above LUMINANCE_LIGHTEN_FLIP (~0.6) are
 * darkened instead so derived tokens on light backgrounds stay visible.
 * This is the v2 helper per UAT gap 7a (Option B).
 *
 * Phase 13 gap-7a (Plan 13-12) — replaces the naive `Math.min(255, r+amount)` approach.
 */
export function lightenHex(hex: string, amount: number): string {
  if (relativeLuminance(hex) > LUMINANCE_LIGHTEN_FLIP) {
    return _shiftDarker(hex, amount);
  }
  return _shiftLighter(hex, amount);
}

/**
 * Shift each RGB channel down by `amount` (0-255), clamped to 0.
 * Luminance-aware mirror of lightenHex: inputs below LUMINANCE_DARKEN_FLIP
 * are lightened instead so CTA and border tokens stay visible on very
 * dark backgrounds (e.g. #000000 would otherwise produce identical black).
 *
 * Phase 13 gap-7a (Plan 13-12) — new helper.
 */
export function darkenHex(hex: string, amount: number): string {
  if (relativeLuminance(hex) < LUMINANCE_DARKEN_FLIP) {
    return _shiftLighter(hex, amount);
  }
  return _shiftDarker(hex, amount);
}

/**
 * Phase 13 Plan 08 — per-slot override payload for `applyThemePreset`.
 *
 * UI-SPEC slot mapping (§3 Admin Theme):
 *   color1 → Primary & CTAs  (overlays `primary`, `brand` and derivatives)
 *   color2 → Background       (overlays `background` and all bg-derived tokens)
 *   color3 → Accent & highlights (overlays `accent`, `tint`, `link`, selected icons)
 *   color4 → Surface          (overlays `cardBackground`, `inputBackground`,
 *                              `surfaceSecondary`)
 *
 * Values come from the admin panel's 4-slot palette picker and from
 * `AppConfig.theme_color_1..4` on launch (see `features/config/stores/config-store.ts`).
 * Omitted fields fall through to the preset's default values.
 *
 * Caveat (RESEARCH §Pitfall 7 — resolved in gap-7a): lightenHex / darkenHex
 * are luminance-aware (flip direction on near-white / near-black inputs),
 * so light-background presets produce readable tokens. CURATED_PALETTE now
 * includes light-band swatches (#ffffff, #fafafa, #f5f5f4, #f0f4f8).
 */
export interface ThemeOverrides {
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
}

/**
 * Applies a theme preset's colors onto the base color palette.
 * Maps preset.primary/secondary/accent/background to the relevant tokens
 * and derives semi-transparent variants automatically.
 *
 * Phase 13 Plan 08: accepts an optional `overrides` object that overlays
 * admin-picked per-slot colors on top of the preset defaults. Overrides are
 * applied AFTER the preset merge so derived tokens (hexToRgba, lightenHex)
 * reflect the final slot values, not the preset's.
 */
export function applyThemePreset(
  base: typeof Colors.dark,
  preset: ThemePreset,
  overrides?: ThemeOverrides
): typeof Colors.dark {
  // Overlay per-slot picks on top of the preset's slot values before
  // deriving any lightened / alpha'd variants.
  const primary = overrides?.color1 ?? preset.primary;
  const secondary = preset.secondary;
  const accent = overrides?.color3 ?? preset.accent;
  const bg = overrides?.color2 ?? preset.background;
  const bgLighter = lightenHex(bg, 15);
  const bgLighter2 = lightenHex(bg, 25);
  const bgLighter3 = lightenHex(bg, 35);
  // Slot 4 (Surface) defaults to derived bgLighter2 but can be overridden
  // explicitly by the admin.
  const surface = overrides?.color4 ?? bgLighter2;

  return {
    ...base,
    // Primary / brand (Slot 1)
    primary,
    primaryLight: hexToRgba(primary, 0.15),
    brand: primary,
    brandLight: hexToRgba(primary, 0.1),
    brandBorder: hexToRgba(primary, 0.2),

    // Secondary
    lightBlue: secondary,
    selectedBackground: hexToRgba(secondary, 0.15),
    recommendationLabel: hexToRgba(secondary, 0.8),
    techTrailChipActive: secondary,
    matchBadgeBackground: hexToRgba(secondary, 0.85),

    // Accent (Slot 3)
    tint: accent,
    tabIconSelected: accent,
    link: accent,

    // Backgrounds — derived from (overridden) preset.background (Slot 2)
    background: bg,
    gradientStart: bg,
    gradientMiddle: bgLighter,
    gradientEnd: bg,
    surfacePrimary: bg,
    surfaceSecondary: surface,

    // Card / surface backgrounds (Slot 4 drives these)
    cardBackground: hexToRgba(surface, 0.8),
    chipBackground: hexToRgba(bgLighter3, 0.8),
    inputBackground: surface,
    dropdownBackground: hexToRgba(surface, 0.95),
    searchBackground: hexToRgba(surface, 0.8),
    exhibitorCardBackground: hexToRgba(surface, 0.6),
    techTrailChipInactive: hexToRgba(bgLighter3, 0.8),
    slotThemOnlyBackground: hexToRgba(bgLighter, 0.1),
    slotConflictBackground: hexToRgba(bgLighter, 0.2),
    trackBackground: bgLighter3,

    // Borders
    border: lightenHex(bg, 50),
    cardBorder: hexToRgba(lightenHex(bg, 80), 0.3),
    searchBorder: hexToRgba(lightenHex(bg, 80), 0.3),
    glassBorder: "rgba(255, 255, 255, 0.1)",

    // Glass / overlay
    glassBackground: "rgba(255, 255, 255, 0.1)",
    sessionCardOverlay: "rgba(0, 0, 0, 0.4)",
    switchTrackOff: "rgba(255, 255, 255, 0.2)",
  };
}

export const Colors = {
  light: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    inputBackground: "#1f2937",
    lightBlue: "#3b82f6",
    primary: "#4f46e5",
    primaryLight: "rgba(79, 70, 229, 0.15)",
    placeholder: "#6b7280",
    textSecondary: "#9ca3af",
    label: "#d1d5db",
    error: "#ef4444",
    border: "#4b5563",
    textPrimary: "#ffffff",
    success: "#22c55e",
    white: "#ffffff",
    trackBackground: "#374151",
    link: "#0a7ea4",
    warning: "#f59e0b",
    cardBackground: "rgba(30, 41, 59, 0.8)",
    cardBorder: "rgba(100, 116, 139, 0.3)",
    chipBackground: "rgba(51, 65, 85, 0.8)",
    textMuted: "rgba(255, 255, 255, 0.7)",
    textDisabled: "rgba(155, 161, 166, 0.5)",
    slotThemOnlyBackground: "rgba(155, 161, 166, 0.1)",
    slotConflictBackground: "rgba(100, 100, 100, 0.2)",
    dropdownBackground: "rgba(30, 41, 59, 0.95)",
    selectedBackground: "rgba(59, 130, 246, 0.15)",
    gradientStart: "#1a1a2e",
    gradientMiddle: "#16213e",
    gradientEnd: "#0f0f23",
    glassBackground: "rgba(255, 255, 255, 0.1)",
    glassBorder: "rgba(255, 255, 255, 0.1)",
    switchTrackOff: "rgba(255, 255, 255, 0.2)",
    textSubtle: "rgba(255, 255, 255, 0.6)",
    searchBackground: "rgba(30, 41, 59, 0.8)",
    searchBorder: "rgba(100, 116, 139, 0.3)",
    recommendationLabel: "rgba(59, 130, 246, 0.8)",
    sessionCardOverlay: "rgba(0, 0, 0, 0.4)",
    exhibitorCardBackground: "rgba(30, 41, 59, 0.6)",
    techTrailChipActive: "#3b82f6",
    techTrailChipInactive: "rgba(51, 65, 85, 0.8)",
    matchBadgeBackground: "rgba(16, 185, 129, 0.85)",
    brand: "#194ff0",
    brandLight: "rgba(25, 79, 240, 0.1)",
    brandBorder: "rgba(25, 79, 240, 0.2)",
    surfacePrimary: "#101522",
    surfaceSecondary: "#161d30",
    textTertiary: "#64748b",
    followUp: "#0d9488",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    inputBackground: "#1f2937",
    lightBlue: "#3b82f6",
    primary: "#4f46e5",
    primaryLight: "rgba(79, 70, 229, 0.15)",
    placeholder: "#6b7280",
    textSecondary: "#9ca3af",
    label: "#d1d5db",
    error: "#ef4444",
    border: "#4b5563",
    textPrimary: "#ffffff",
    success: "#22c55e",
    white: "#ffffff",
    trackBackground: "#374151",
    link: "#0a7ea4",
    warning: "#f59e0b",
    cardBackground: "rgba(30, 41, 59, 0.8)",
    cardBorder: "rgba(100, 116, 139, 0.3)",
    chipBackground: "rgba(51, 65, 85, 0.8)",
    textMuted: "rgba(255, 255, 255, 0.7)",
    textDisabled: "rgba(155, 161, 166, 0.5)",
    slotThemOnlyBackground: "rgba(155, 161, 166, 0.1)",
    slotConflictBackground: "rgba(100, 100, 100, 0.2)",
    dropdownBackground: "rgba(30, 41, 59, 0.95)",
    selectedBackground: "rgba(59, 130, 246, 0.15)",
    gradientStart: "#1a1a2e",
    gradientMiddle: "#16213e",
    gradientEnd: "#0f0f23",
    glassBackground: "rgba(255, 255, 255, 0.1)",
    glassBorder: "rgba(255, 255, 255, 0.1)",
    switchTrackOff: "rgba(255, 255, 255, 0.2)",
    textSubtle: "rgba(255, 255, 255, 0.6)",
    searchBackground: "rgba(30, 41, 59, 0.8)",
    searchBorder: "rgba(100, 116, 139, 0.3)",
    recommendationLabel: "rgba(59, 130, 246, 0.8)",
    sessionCardOverlay: "rgba(0, 0, 0, 0.4)",
    exhibitorCardBackground: "rgba(30, 41, 59, 0.6)",
    techTrailChipActive: "#3b82f6",
    techTrailChipInactive: "rgba(51, 65, 85, 0.8)",
    matchBadgeBackground: "rgba(16, 185, 129, 0.85)",
    brand: "#194ff0",
    brandLight: "rgba(25, 79, 240, 0.1)",
    brandBorder: "rgba(25, 79, 240, 0.2)",
    surfacePrimary: "#101522",
    surfaceSecondary: "#161d30",
    textTertiary: "#64748b",
    followUp: "#0d9488",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export type UIThemeColor = keyof typeof Colors.light;
