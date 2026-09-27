import type * as Notifications from "expo-notifications";

import {
  handlePushNotificationResponse,
  resolvePushDeeplink,
} from "@/features/notifications/hooks/useNotificationListener";
import { usePendingNavigationStore } from "@/features/notifications/stores/pending-navigation";
import { markNotificationSeen } from "@/api/features/notifications";
import { queryClient } from "@/lib/query-client";

jest.mock("@/api/features/notifications", () => ({
  markNotificationSeen: jest.fn(),
  registerPushToken: jest.fn(),
}));

jest.mock("@/features/authentication/stores/auth", () => ({
  useAuthStore: jest.fn(() => ({ isAuthenticated: false })),
}));

jest.mock("@/lib/push-notifications", () => ({
  registerForPushNotificationsAsync: jest.fn(),
}));

jest.mock("@/lib/query-client", () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
}));

jest.mock("expo-notifications", () => ({
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
}));

const mockMarkNotificationSeen = jest.mocked(markNotificationSeen);
const mockInvalidateQueries = jest.mocked(queryClient.invalidateQueries);
const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

function createNotificationResponse(
  data: Record<string, unknown>,
): Notifications.NotificationResponse {
  return {
    notification: {
      request: {
        content: { data },
      },
    },
  } as Notifications.NotificationResponse;
}

describe("notification listener helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePendingNavigationStore.setState({ pendingPath: null });
    mockMarkNotificationSeen.mockResolvedValue(undefined);
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  test("allows known push deeplinks", () => {
    expect(resolvePushDeeplink({ deeplink: "/session/42" })).toBe(
      "/session/42",
    );
    expect(resolvePushDeeplink({ deeplink: "/group-chat?id=7" })).toBe(
      "/group-chat?id=7",
    );
  });

  test("falls back to home for unknown push deeplinks", () => {
    expect(resolvePushDeeplink({ deeplink: "/unknown-route/42" })).toBe(
      "/(tabs)/(home)",
    );
    expect(warnSpy).toHaveBeenCalledWith(
      "[Push] Unknown deeplink path; falling back to home:",
      "/unknown-route/42",
    );
  });

  test("resolves legacy push payloads", () => {
    expect(
      resolvePushDeeplink({ screen: "DM", conversation_id: "abc" }),
    ).toBe("/dm-chat?conversationId=abc");
    expect(resolvePushDeeplink({ screen: "SESSION", session_id: 42 })).toBe(
      "/session/42",
    );
    expect(resolvePushDeeplink({ screen: "MEETING" })).toBe("/networking");
  });

  test("ignores incomplete legacy push payloads", () => {
    expect(resolvePushDeeplink({ screen: "DM" })).toBeNull();
    expect(resolvePushDeeplink({ screen: "SESSION" })).toBeNull();
    expect(resolvePushDeeplink({ screen: "UNKNOWN" })).toBeNull();
  });

  test("stores pending navigation and marks the notification as seen", async () => {
    handlePushNotificationResponse(
      createNotificationResponse({
        deeplink: "/notifications",
        notification_id: "123",
      }),
    );

    expect(usePendingNavigationStore.getState().pendingPath).toBe(
      "/notifications",
    );
    expect(mockMarkNotificationSeen).toHaveBeenCalledWith(123);

    await Promise.resolve();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["notifications"],
    });
  });

  test("does not navigate or mark seen when push data is empty", () => {
    handlePushNotificationResponse(createNotificationResponse({}));

    expect(usePendingNavigationStore.getState().pendingPath).toBeNull();
    expect(mockMarkNotificationSeen).not.toHaveBeenCalled();
  });

  test("ignores mark-seen failures after storing pending navigation", async () => {
    mockMarkNotificationSeen.mockRejectedValue(new Error("network down"));

    handlePushNotificationResponse(
      createNotificationResponse({
        deeplink: "/session/42",
        notification_id: 99,
      }),
    );

    expect(usePendingNavigationStore.getState().pendingPath).toBe(
      "/session/42",
    );

    await Promise.resolve();

    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });
});
