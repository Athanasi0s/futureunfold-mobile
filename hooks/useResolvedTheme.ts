import { useAuthStore } from "@/features/authentication/stores/auth";
import { useConfigStore } from "@/features/config/stores/config-store";
import { getPresetById, type ThemePreset } from "@/constants/theme-presets";
import type { ThemeOverrides } from "@/constants/theme";

export function useResolvedTheme(): ThemePreset {
  const userTheme = useAuthStore((s) => s.user?.theme_preference);
  const adminPreset = useConfigStore((s) => s.themePreset);

  if (userTheme) {
    const userPreset = getPresetById(userTheme);
    if (userPreset) return userPreset;
  }

  return adminPreset;
}

/**
 * Phase 13 Plan 08 — resolves the admin's per-slot overrides from config-store.
 * User-level theme preferences (`user.theme_preference`) intentionally bypass
 * admin overrides: a user who picks a specific preset sees that preset cleanly,
 * not with admin's slot-1 tweak applied on top. If we want user-prefs to
 * inherit admin overrides later, drop the early-return here.
 */
export function useResolvedThemeOverrides(): ThemeOverrides {
  const userTheme = useAuthStore((s) => s.user?.theme_preference);
  const overrides = useConfigStore((s) => s.themeOverrides);
  if (userTheme) return {};
  return overrides;
}
