import {
  deletePushToken,
  getNotificationPreferences,
  getNotifications,
  getUnseenCount,
  markAllNotificationsSeen,
  markNotificationSeen,
  registerPushToken,
  updateNotificationPreferences,
} from "@/api/features/notifications";
import { api } from "@/api/client";

jest.mock("@/api/client", () => ({
  api: {
    auth: jest.fn(),
  },
}));

const mockAuth = jest.mocked(api.auth);

describe("notifications API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("registers the current device push token", async () => {
    mockAuth.mockResolvedValue(undefined);

    await registerPushToken({
      token: "ExponentPushToken[test]",
      platform: "android",
    });

    expect(mockAuth).toHaveBeenCalledWith({
      url: "/notifications/push-token",
      method: "POST",
      data: {
        token: "ExponentPushToken[test]",
        platform: "android",
      },
    });
  });

  test("deletes the current device push token", async () => {
    mockAuth.mockResolvedValue(undefined);

    await deletePushToken();

    expect(mockAuth).toHaveBeenCalledWith({
      url: "/notifications/push-token",
      method: "DELETE",
    });
  });

  test("fetches notifications and unseen count", async () => {
    mockAuth
      .mockResolvedValueOnce([
        {
          id: 1,
          title: "Hello",
          body: "World",
          type: "broadcast",
          ref_id: null,
          deeplink: "/notifications",
          seen: false,
          created_at: "2026-01-01T00:00:00Z",
        },
      ])
      .mockResolvedValueOnce({ count: 3 });

    await expect(getNotifications()).resolves.toHaveLength(1);
    await expect(getUnseenCount()).resolves.toEqual({ count: 3 });

    expect(mockAuth).toHaveBeenNthCalledWith(1, {
      url: "/notifications",
      method: "GET",
    });
    expect(mockAuth).toHaveBeenNthCalledWith(2, {
      url: "/notifications/unseen-count",
      method: "GET",
    });
  });

  test("marks one or all notifications as seen", async () => {
    mockAuth.mockResolvedValue(undefined);

    await markNotificationSeen(42);
    await markAllNotificationsSeen();

    expect(mockAuth).toHaveBeenNthCalledWith(1, {
      url: "/notifications/42/seen",
      method: "PATCH",
    });
    expect(mockAuth).toHaveBeenNthCalledWith(2, {
      url: "/notifications/mark-all-seen",
      method: "POST",
    });
  });

  test("reads and updates notification preferences", async () => {
    mockAuth
      .mockResolvedValueOnce([{ category: "messages", enabled: true }])
      .mockResolvedValueOnce({ ok: true });
    const prefs = [{ category: "messages", enabled: false }];

    await expect(getNotificationPreferences()).resolves.toEqual([
      { category: "messages", enabled: true },
    ]);
    await expect(updateNotificationPreferences(prefs)).resolves.toEqual({
      ok: true,
    });

    expect(mockAuth).toHaveBeenNthCalledWith(1, {
      url: "/notifications/preferences",
      method: "GET",
    });
    expect(mockAuth).toHaveBeenNthCalledWith(2, {
      url: "/notifications/preferences",
      method: "PUT",
      data: prefs,
    });
  });
});
