import Constants from "expo-constants";

import { getApiBaseUrl } from "@/api/base-url";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

const mockedConstants = Constants as {
  expoConfig?: { extra?: { apiBaseUrl?: string } };
};

describe("getApiBaseUrl", () => {
  const originalOverride = process.env.EXPO_PUBLIC_API_OVERRIDE;
  const originalLegacy = process.env.EXPO_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_API_OVERRIDE;
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    mockedConstants.expoConfig = { extra: {} };
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_API_OVERRIDE = originalOverride;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalLegacy;
  });

  test("prefers the explicit local development override", () => {
    process.env.EXPO_PUBLIC_API_OVERRIDE = "http://localhost:8000";
    mockedConstants.expoConfig = {
      extra: { apiBaseUrl: "https://tenant.example.com" },
    };
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://legacy.example.com";

    expect(getApiBaseUrl()).toBe("http://localhost:8000");
  });

  test("uses the tenant-baked API URL before the legacy env var", () => {
    mockedConstants.expoConfig = {
      extra: { apiBaseUrl: "https://tenant.example.com" },
    };
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://legacy.example.com";

    expect(getApiBaseUrl()).toBe("https://tenant.example.com");
  });

  test("falls back to the legacy API env var", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://legacy.example.com";

    expect(getApiBaseUrl()).toBe("https://legacy.example.com");
  });

  test("returns an empty string when no API URL is configured", () => {
    expect(getApiBaseUrl()).toBe("");
  });
});
