import { useConfigStore } from "@/features/config/stores/config-store";

export type FeatureFlag =
  | "schedule"
  | "map"
  | "digital_id"
  | "networking"
  | "groups"
  | "group_chat"
  | "direct_messages"
  | "rewards"
  | "leaderboard"
  | "certificates"
  | "tickets"
  | "polls"
  | "exhibitors"
  | "exhibitor_chat"
  | "session_chat"
  | "session_qa"
  | "location_sharing"
  | "density"
  | "notifications"
  | "recommendations"
  | "scheduling"
  | "festival_stats";

function getE2EDisabledFeatures(): Set<string> {
  if (!__DEV__) return new Set();

  const raw = process.env.EXPO_PUBLIC_E2E_DISABLED_FEATURES;
  if (!raw) return new Set();

  return new Set(
    raw
      .split(",")
      .map((flag: string) => flag.trim())
      .filter(Boolean),
  );
}

export function useFeatureEnabled(flag: FeatureFlag): boolean {
  const e2eDisabledFeatures = getE2EDisabledFeatures();

  return useConfigStore((s) =>
    e2eDisabledFeatures.has(flag) ? false : (s.featureFlags[flag] ?? true),
  );
}
