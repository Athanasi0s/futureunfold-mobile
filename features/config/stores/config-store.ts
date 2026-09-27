import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { create } from "zustand";
import {
  DEFAULT_PRESET_ID,
  getPresetById,
  type ThemePreset,
} from "@/constants/theme-presets";
import type { ThemeOverrides } from "@/constants/theme";
import { api } from "@/api/client";
import { setRuntimeConfigRefresher } from "@/features/config/runtime-config-refresh";

const CONFIG_CACHE_KEY = "app_config_cache";

// Tenant-baked default for app_name, used when backend /config doesn't return
// one (fresh tenant, admin hasn't opened the branding screen yet, or network error).
const TENANT_APP_NAME =
  (Constants.expoConfig?.extra as { appName?: string } | undefined)?.appName ??
  "FestApp";
const TENANT_DEFAULT_THEME_PRESET_ID =
  (Constants.expoConfig?.extra as { defaultThemePresetId?: string } | undefined)
    ?.defaultThemePresetId ?? DEFAULT_PRESET_ID;
const TENANT_DEFAULT_THEME_PRESET =
  getPresetById(TENANT_DEFAULT_THEME_PRESET_ID) ??
  getPresetById(DEFAULT_PRESET_ID)!;
const TENANT_PORTRAIT_URL =
  (Constants.expoConfig?.extra as { portraitUrl?: string } | undefined)
    ?.portraitUrl ?? null;
const LEGACY_APP_NAME_PATTERN = /panath[eē]nea|fest\s*app|festapp/i;

function resolveAppName(appName: string | null | undefined): string {
  const trimmed = appName?.trim();
  if (!trimmed) return TENANT_APP_NAME;
  if (LEGACY_APP_NAME_PATTERN.test(trimmed)) {
    return TENANT_APP_NAME;
  }
  return trimmed;
}

function resolveTenantThemePresetId(id: string | null | undefined): string | null | undefined {
  if (!id || id === DEFAULT_PRESET_ID) {
    return TENANT_DEFAULT_THEME_PRESET_ID;
  }
  return id;
}

type ConfigResponse = {
  app_name: string;
  app_logo_url: string | null;
  theme: string;
  feature_flags: Record<string, boolean>;
  announcement_banner: string | null;
  user_theme_options: string[];
  wifi_ssid: string | null;
  wifi_password: string | null;
  ai_portraits_url?: string | null;
  // Phase 13 Plan 08 — theme customisation (THME-01..03).
  active_theme_preset_id?: string | null;
  theme_color_1?: string | null;
  theme_color_2?: string | null;
  theme_color_3?: string | null;
  theme_color_4?: string | null;
};

type ConfigState = {
  appName: string;
  appLogoUrl: string | null;
  themePreset: ThemePreset;
  /** Phase 13 Plan 08 — per-slot admin overrides overlaid on top of `themePreset`. */
  themeOverrides: ThemeOverrides;
  featureFlags: Record<string, boolean>;
  announcementBanner: string | null;
  userThemeOptions: string[];
  wifiSsid: string | null;
  wifiPassword: string | null;
  aiPortraitsUrl: string | null;
  loadCachedConfig: () => Promise<void>;
  fetchAndCacheConfig: () => Promise<void>;
};

/**
 * Builds a ThemeOverrides payload from a /config response. Null values are
 * stripped (i.e. falls through to preset defaults). The resolved preset for
 * `active_theme_preset_id` is not looked up here — the store writes the id
 * into `themePreset` separately via THEME_PRESETS.find().
 */
function buildOverrides(data: ConfigResponse): ThemeOverrides {
  const out: ThemeOverrides = {};
  if (data.theme_color_1) out.color1 = data.theme_color_1;
  if (data.theme_color_2) out.color2 = data.theme_color_2;
  if (data.theme_color_3) out.color3 = data.theme_color_3;
  if (data.theme_color_4) out.color4 = data.theme_color_4;
  return out;
}

/**
 * Resolves the active preset id from /config: prefers the new
 * `active_theme_preset_id` key (Plan 13-08) and falls back to the legacy
 * `theme` key (pre-Plan-08). Returns the default preset if neither resolves.
 */
function resolvePreset(data: ConfigResponse): ThemePreset | null {
  return getPresetById(
    resolveTenantThemePresetId(data.active_theme_preset_id ?? data.theme),
  );
}

export const useConfigStore = create<ConfigState>((set) => ({
  appName: TENANT_APP_NAME,
  appLogoUrl: null,
  themePreset: TENANT_DEFAULT_THEME_PRESET,
  themeOverrides: {},
  featureFlags: {},
  announcementBanner: null,
  userThemeOptions: [],
  wifiSsid: null,
  wifiPassword: null,
  aiPortraitsUrl: TENANT_PORTRAIT_URL,

  loadCachedConfig: async () => {
    try {
      const cached = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached) as ConfigResponse;
        set({
          appName: resolveAppName(data.app_name),
          appLogoUrl: data.app_logo_url || null,
        });
        const preset = resolvePreset(data);
        if (preset) set({ themePreset: preset });
        set({ themeOverrides: buildOverrides(data) });
        if (data.feature_flags) set({ featureFlags: data.feature_flags });
        if (data.announcement_banner !== undefined)
          set({ announcementBanner: data.announcement_banner });
        if (data.user_theme_options)
          set({ userThemeOptions: data.user_theme_options });
        if (data.wifi_ssid !== undefined) set({ wifiSsid: data.wifi_ssid });
        if (data.wifi_password !== undefined) set({ wifiPassword: data.wifi_password });
        if (data.ai_portraits_url !== undefined)
          set({ aiPortraitsUrl: data.ai_portraits_url || TENANT_PORTRAIT_URL });
      }
    } catch {
      // Silently fail — defaults remain
    }
  },

  fetchAndCacheConfig: async () => {
    try {
      const data = await api.basic<ConfigResponse>({
        url: "/config",
        method: "GET",
      });
      await AsyncStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(data));
      const preset = resolvePreset(data);
      if (preset) set({ themePreset: preset });
      set({
        appName: resolveAppName(data.app_name),
        appLogoUrl: data.app_logo_url || null,
        themeOverrides: buildOverrides(data),
        featureFlags: data.feature_flags || {},
        announcementBanner: data.announcement_banner,
        userThemeOptions: data.user_theme_options || [],
        wifiSsid: data.wifi_ssid ?? null,
        wifiPassword: data.wifi_password ?? null,
        aiPortraitsUrl: data.ai_portraits_url || TENANT_PORTRAIT_URL,
      });
    } catch {
      // Silently fail — cached or default stays
    }
  },
}));

setRuntimeConfigRefresher(() => useConfigStore.getState().fetchAndCacheConfig());
