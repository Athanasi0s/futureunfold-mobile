import { api } from "../client";
import type { NotifPreference, NotificationOut, PushTokenIn, UnseenCountOut } from "../schemas";

export function registerPushToken(data: PushTokenIn): Promise<void> {
  return api.auth<void>({
    url: "/notifications/push-token",
    method: "POST",
    data,
  });
}

export function deletePushToken(): Promise<void> {
  return api.auth<void>({
    url: "/notifications/push-token",
    method: "DELETE",
  });
}

export function getNotifications(): Promise<NotificationOut[]> {
  return api.auth<NotificationOut[]>({
    url: "/notifications",
    method: "GET",
  });
}

export function getUnseenCount(): Promise<UnseenCountOut> {
  return api.auth<UnseenCountOut>({
    url: "/notifications/unseen-count",
    method: "GET",
  });
}

export function markNotificationSeen(id: number): Promise<void> {
  return api.auth<void>({
    url: `/notifications/${id}/seen`,
    method: "PATCH",
  });
}

export function markAllNotificationsSeen(): Promise<void> {
  return api.auth<void>({
    url: "/notifications/mark-all-seen",
    method: "POST",
  });
}

export function getNotificationPreferences(): Promise<NotifPreference[]> {
  return api.auth<NotifPreference[]>({
    url: "/notifications/preferences",
    method: "GET",
  });
}

export function updateNotificationPreferences(
  prefs: { category: string; enabled: boolean }[],
): Promise<{ ok: boolean }> {
  return api.auth<{ ok: boolean }>({
    url: "/notifications/preferences",
    method: "PUT",
    data: prefs,
  });
}
