import {
  markNotificationSeen,
  registerPushToken,
} from "@/api/features/notifications";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { usePendingNavigationStore } from "@/features/notifications/stores/pending-navigation";
import { registerForPushNotificationsAsync } from "@/lib/push-notifications";
import { queryClient } from "@/lib/query-client";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";

type PushData = {
  notification_id?: number | string;
  deeplink?: string;
  // legacy fallback fields
  screen?: string;
  conversation_id?: unknown;
  session_id?: unknown;
  [key: string]: unknown;
};

/**
 * Whitelist of deeplink path prefixes known to match real Expo Router routes.
 *
 * SOURCE OF TRUTH PAIRING:
 * - Backend RESOLVERS in festapp-backend/app/services/deeplink_resolver.py
 *   MUST emit paths whose prefix appears in this list.
 * - Backend test test_all_resolved_paths_are_in_mobile_allowlist
 *   (festapp-backend/tests/test_deeplink_resolver.py) mirrors this list as
 *   MOBILE_ALLOWLIST and asserts every resolver's output starts with one
 *   of these prefixes. CI fails on drift.
 *
 * If you add a new admin-push deeplink template:
 *   1. Add the route prefix here.
 *   2. Update MOBILE_ALLOWLIST in test_deeplink_resolver.py to match.
 *   3. Confirm the corresponding Expo Router route exists under app/.
 *
 * If an incoming push deeplink does not start with one of these,
 * useNotificationListener navigates to the home tab instead of producing
 * an unmatched-route screen.
 *
 * The lateral safety net also protects against stale pushes sent with the
 * pre-gap-closure resolver (e.g., "/group/<N>" literals) still sitting in
 * Android notification queues after a device reboot.
 */
const KNOWN_DEEPLINK_PREFIXES = [
  "/group-details",
  "/group-chat",
  "/session/",
  "/profile/",
  "/(tabs)/",
  "/dm-chat",
  "/networking",
  "/notifications",
] as const;

const FALLBACK_DEEPLINK = "/(tabs)/(home)" as const;

function isKnownDeeplink(path: string): boolean {
  return KNOWN_DEEPLINK_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function resolvePushDeeplink(data: PushData): string | null {
  if (data.deeplink) {
    if (isKnownDeeplink(data.deeplink)) return data.deeplink;
    // Unknown path — log and fall back to home so the user still lands somewhere sane.
    // If you see this warning frequently, a backend resolver is emitting a path
    // not in KNOWN_DEEPLINK_PREFIXES — sync the allowlist (see comment above).
    console.warn(
      "[Push] Unknown deeplink path; falling back to home:",
      data.deeplink,
    );
    return FALLBACK_DEEPLINK;
  }
  // Legacy fallback: backend used to send screen + params
  switch (data.screen) {
    case "DM":
      return data.conversation_id
        ? `/dm-chat?conversationId=${data.conversation_id}`
        : null;
    case "SESSION":
      return data.session_id ? `/session/${data.session_id}` : null;
    case "MEETING":
      return "/networking";
    default:
      return null;
  }
}

export function handlePushNotificationResponse(
  response: Notifications.NotificationResponse,
) {
  const data = response.notification.request.content.data as PushData;

  const deeplink = resolvePushDeeplink(data);
  if (deeplink) {
    // Use the store so _layout.tsx handles navigation once the router is ready.
    // This is safe for both foreground taps and cold-start.
    usePendingNavigationStore.getState().setPendingPath(deeplink);
  }

  if (data?.notification_id) {
    markNotificationSeen(Number(data.notification_id))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .catch(() => {});
  }
}

export function useNotificationListener() {
  const { isAuthenticated } = useAuthStore();
  const foregroundSub = useRef<Notifications.EventSubscription | null>(null);
  const responseSub = useRef<Notifications.EventSubscription | null>(null);

  // Register push token whenever the user becomes authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        // Phase 13 PUSH-04 — emit platform so the backend device-breakdown
        // (admin push UI Plan 13-07) reports real iOS/Android counts.
        const platform: "ios" | "android" | "web" =
          Platform.OS === "ios" || Platform.OS === "android"
            ? Platform.OS
            : "web";
        await registerPushToken({ token, platform });
        console.log("[Push] Token registered with backend:", token, platform);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);
        console.error("[Push] Token registration failed:", message);
        if (__DEV__) {
          Alert.alert("Push setup failed", message);
        }
      }
    })();
  }, [isAuthenticated]);

  // Foreground notification listener (setNotificationHandler in lib shows the alert)
  useEffect(() => {
    foregroundSub.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[Push] Foreground notification received:", notification);
      },
    );
    return () => foregroundSub.current?.remove();
  }, []);

  // Tap handler — covers foreground, background, and cold-start
  useEffect(() => {
    // Cold start: app was killed, user tapped a notification to open it
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handlePushNotificationResponse(response);
    });

    responseSub.current = Notifications.addNotificationResponseReceivedListener(
      handlePushNotificationResponse,
    );

    return () => responseSub.current?.remove();
  }, []);
}
