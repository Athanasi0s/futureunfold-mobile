export type ThemePreset = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "future-unfold",
    name: "Future Unfold",
    primary: "#49317c",
    secondary: "#5ea4b2",
    accent: "#5ea4b2",
    background: "#1e0e3e",
  },
  {
    id: "midnight-indigo",
    name: "Midnight Indigo",
    primary: "#4f46e5",
    secondary: "#7c3aed",
    accent: "#06b6d4",
    background: "#151718",
  },
  {
    id: "festival-fire",
    name: "Festival Fire",
    primary: "#ef4444",
    secondary: "#f97316",
    accent: "#fbbf24",
    background: "#1a0a0a",
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    primary: "#0ea5e9",
    secondary: "#06b6d4",
    accent: "#22d3ee",
    background: "#0c1222",
  },
  {
    id: "forest-canopy",
    name: "Forest Canopy",
    primary: "#22c55e",
    secondary: "#16a34a",
    accent: "#84cc16",
    background: "#0a1a0e",
  },
  {
    id: "sunset-glow",
    name: "Sunset Glow",
    primary: "#f97316",
    secondary: "#ef4444",
    accent: "#fbbf24",
    background: "#1a0f0a",
  },
  {
    id: "arctic-frost",
    name: "Arctic Frost",
    primary: "#94a3b8",
    secondary: "#cbd5e1",
    accent: "#38bdf8",
    background: "#0f172a",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    primary: "#a855f7",
    secondary: "#7c3aed",
    accent: "#ec4899",
    background: "#1a0a2e",
  },
  {
    id: "desert-sand",
    name: "Desert Sand",
    primary: "#d97706",
    secondary: "#b45309",
    accent: "#fbbf24",
    background: "#1a150a",
  },
  {
    id: "neon-city",
    name: "Neon City",
    primary: "#f43f5e",
    secondary: "#e879f9",
    accent: "#22d3ee",
    background: "#0a0a1a",
  },
  {
    id: "classic-dark",
    name: "Classic Dark",
    primary: "#6b7280",
    secondary: "#9ca3af",
    accent: "#3b82f6",
    background: "#111827",
  },
  {
    id: "electric-blue",
    name: "Electric Blue",
    primary: "#194ff0",
    secondary: "#e8457c",
    accent: "#e63946",
    background: "#0a0f2e",
  },
  {
    id: "athens-sunrise",
    name: "Athens Sunrise",
    primary: "#f5c518",
    secondary: "#2956f5",
    accent: "#e8457c",
    background: "#1a1500",
  },
  {
    id: "classic-mono",
    name: "Classic Mono",
    primary: "#f5c518",
    secondary: "#d4a90a",
    accent: "#ffffff",
    background: "#0a0a0a",
  },
  // Light-background presets (UAT gap 7a — enabled by luminance-aware helpers)
  {
    id: "paper-daylight",
    name: "Paper Daylight",
    primary: "#4f46e5",    // indigo CTAs — high contrast on white
    secondary: "#7c3aed",  // violet secondary
    accent: "#0ea5e9",     // sky accent
    background: "#fafafa", // paper-white background (Slot 2)
  },
  {
    id: "cool-linen",
    name: "Cool Linen",
    primary: "#0d9488",    // teal CTAs
    secondary: "#06b6d4",  // cyan secondary
    accent: "#f97316",     // orange accent highlights
    background: "#f0f4f8", // cool-white background
  },
];

export const DEFAULT_PRESET_ID = "midnight-indigo";

/**
 * Legacy preset IDs → current preset IDs. Applied by `getPresetById()` so a
 * future rename won't drop already-stored admin/user selections until the
 * paired backend migration has rewritten the affected rows. Empty today —
 * the 2026-04-21 `panathenea-electric` → `electric-blue` rename has aged out
 * its transitional entry.
 */
const PRESET_ID_ALIASES: Record<string, string> = {};

/**
 * Canonical preset lookup. Applies the alias map before hitting
 * `THEME_PRESETS.find()` so legacy ids from before a rename still resolve.
 * Prefer this over `THEME_PRESETS.find()` for values read from the backend
 * (AppConfig) or user-facing storage (user.theme_preference).
 */
export function getPresetById(
  id: string | null | undefined,
): ThemePreset | null {
  if (!id) return null;
  const canonical = PRESET_ID_ALIASES[id] ?? id;
  return THEME_PRESETS.find((p) => p.id === canonical) ?? null;
}
