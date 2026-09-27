import AsyncStorage from "@react-native-async-storage/async-storage";

import { api } from "@/api/client";
import {
  DEFAULT_PRESET_ID,
  getPresetById,
} from "@/constants/theme-presets";
import { useConfigStore } from "@/features/config/stores/config-store";

jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      appName: "Tenant Default",
    },
  },
}));

jest.mock("@/api/client", () => ({
  api: {
    basic: jest.fn(),
  },
}));

const mockApiBasic = jest.mocked(api.basic);
const mockGetItem = jest.mocked(AsyncStorage.getItem);
const mockSetItem = jest.mocked(AsyncStorage.setItem);
const defaultPreset = getPresetById(DEFAULT_PRESET_ID)!;

const fullConfig = {
  app_name: "Runtime Festival",
  app_logo_url: "https://example.com/logo.png",
  theme: "festival-fire",
  active_theme_preset_id: "ocean-breeze",
  theme_color_1: "#111111",
  theme_color_2: null,
  theme_color_3: "#333333",
  theme_color_4: null,
  feature_flags: {
    schedule: true,
    map: false,
  },
  announcement_banner: "Welcome",
  user_theme_options: ["midnight-indigo", "ocean-breeze"],
  wifi_ssid: "Festival WiFi",
  wifi_password: "festival-password",
};

function resetConfigStore() {
  useConfigStore.setState({
    appName: "Tenant Default",
    appLogoUrl: null,
    themePreset: defaultPreset,
    themeOverrides: {},
    featureFlags: {},
    announcementBanner: null,
    userThemeOptions: [],
    wifiSsid: null,
    wifiPassword: null,
  });
}

describe("config store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetConfigStore();
  });

  test("starts with tenant-safe defaults", () => {
    expect(useConfigStore.getState()).toMatchObject({
      appName: "Tenant Default",
      appLogoUrl: null,
      themePreset: defaultPreset,
      themeOverrides: {},
      featureFlags: {},
      announcementBanner: null,
      userThemeOptions: [],
      wifiSsid: null,
      wifiPassword: null,
    });
  });

  test("hydrates runtime configuration from the cache", async () => {
    mockGetItem.mockResolvedValue(JSON.stringify(fullConfig));

    await useConfigStore.getState().loadCachedConfig();

    expect(mockGetItem).toHaveBeenCalledWith("app_config_cache");
    expect(useConfigStore.getState()).toMatchObject({
      appName: "Runtime Festival",
      appLogoUrl: "https://example.com/logo.png",
      themePreset: getPresetById("ocean-breeze"),
      themeOverrides: {
        color1: "#111111",
        color3: "#333333",
      },
      featureFlags: {
        schedule: true,
        map: false,
      },
      announcementBanner: "Welcome",
      userThemeOptions: ["midnight-indigo", "ocean-breeze"],
      wifiSsid: "Festival WiFi",
      wifiPassword: "festival-password",
    });
  });

  test("falls back to the legacy theme field in cached configuration", async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify({
        ...fullConfig,
        active_theme_preset_id: null,
        theme: "festival-fire",
      }),
    );

    await useConfigStore.getState().loadCachedConfig();

    expect(useConfigStore.getState().themePreset).toEqual(
      getPresetById("festival-fire"),
    );
  });

  test("preserves existing state when cached JSON is malformed", async () => {
    useConfigStore.setState({ appName: "Existing Festival" });
    mockGetItem.mockResolvedValue("{invalid-json");

    await expect(
      useConfigStore.getState().loadCachedConfig(),
    ).resolves.toBeUndefined();

    expect(useConfigStore.getState().appName).toBe("Existing Festival");
  });

  test("preserves existing state when no cached config exists", async () => {
    useConfigStore.setState({ appName: "Existing Festival" });
    mockGetItem.mockResolvedValue(null);

    await useConfigStore.getState().loadCachedConfig();

    expect(useConfigStore.getState().appName).toBe("Existing Festival");
  });

  test("preserves the current preset when cached config references an unknown preset", async () => {
    useConfigStore.setState({ themePreset: getPresetById("forest-canopy")! });
    mockGetItem.mockResolvedValue(
      JSON.stringify({
        ...fullConfig,
        active_theme_preset_id: "missing-preset",
      }),
    );

    await useConfigStore.getState().loadCachedConfig();

    expect(useConfigStore.getState().themePreset).toEqual(
      getPresetById("forest-canopy"),
    );
  });

  test("fetches, caches, and applies fresh runtime configuration", async () => {
    mockApiBasic.mockResolvedValue(fullConfig);

    await useConfigStore.getState().fetchAndCacheConfig();

    expect(mockApiBasic).toHaveBeenCalledWith({
      url: "/config",
      method: "GET",
    });
    expect(mockSetItem).toHaveBeenCalledWith(
      "app_config_cache",
      JSON.stringify(fullConfig),
    );
    expect(useConfigStore.getState()).toMatchObject({
      appName: "Runtime Festival",
      themePreset: getPresetById("ocean-breeze"),
      featureFlags: {
        schedule: true,
        map: false,
      },
      wifiSsid: "Festival WiFi",
    });
  });

  test("uses safe fallbacks for missing fresh configuration values", async () => {
    mockApiBasic.mockResolvedValue({
      ...fullConfig,
      app_name: "",
      app_logo_url: null,
      feature_flags: undefined,
      announcement_banner: null,
      user_theme_options: undefined,
      wifi_ssid: undefined,
      wifi_password: undefined,
    });

    await useConfigStore.getState().fetchAndCacheConfig();

    expect(useConfigStore.getState()).toMatchObject({
      appName: "Tenant Default",
      appLogoUrl: null,
      featureFlags: {},
      announcementBanner: null,
      userThemeOptions: [],
      wifiSsid: null,
      wifiPassword: null,
    });
  });

  test("preserves existing state when fetching fresh config fails", async () => {
    useConfigStore.setState({
      appName: "Cached Festival",
      featureFlags: { schedule: false },
    });
    mockApiBasic.mockRejectedValue(new Error("network unavailable"));

    await expect(
      useConfigStore.getState().fetchAndCacheConfig(),
    ).resolves.toBeUndefined();

    expect(mockSetItem).not.toHaveBeenCalled();
    expect(useConfigStore.getState()).toMatchObject({
      appName: "Cached Festival",
      featureFlags: { schedule: false },
    });
  });
});
