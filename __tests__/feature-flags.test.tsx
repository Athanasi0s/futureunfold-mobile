import { renderHook } from "@testing-library/react-native";

import { useFeatureEnabled } from "@/features/config/hooks/useFeatureEnabled";
import { useConfigStore } from "@/features/config/stores/config-store";

describe("feature flags", () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_E2E_DISABLED_FEATURES;
    useConfigStore.setState({ featureFlags: {} });
  });

  test("defaults missing feature flags to enabled", () => {
    const { result } = renderHook(() => useFeatureEnabled("schedule"));

    expect(result.current).toBe(true);
  });

  test("returns false for explicitly disabled features", () => {
    useConfigStore.setState({ featureFlags: { schedule: false } });

    const { result } = renderHook(() => useFeatureEnabled("schedule"));

    expect(result.current).toBe(false);
  });

  test("returns true for explicitly enabled features", () => {
    useConfigStore.setState({ featureFlags: { schedule: true } });

    const { result } = renderHook(() => useFeatureEnabled("schedule"));

    expect(result.current).toBe(true);
  });

  test("allows dev E2E env flags to disable features", () => {
    process.env.EXPO_PUBLIC_E2E_DISABLED_FEATURES = "map, digital_id";
    useConfigStore.setState({ featureFlags: { map: true, digital_id: true } });

    const { result: mapResult } = renderHook(() => useFeatureEnabled("map"));
    const { result: badgeResult } = renderHook(() =>
      useFeatureEnabled("digital_id"),
    );
    const { result: scheduleResult } = renderHook(() =>
      useFeatureEnabled("schedule"),
    );

    expect(mapResult.current).toBe(false);
    expect(badgeResult.current).toBe(false);
    expect(scheduleResult.current).toBe(true);
  });
});
