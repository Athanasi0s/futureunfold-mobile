import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { registerForPushNotificationsAsync } from "@/lib/push-notifications";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        eas: { projectId: "expo-project-id" },
      },
    },
    easConfig: undefined,
  },
}));

jest.mock("expo-notifications", () => ({
  AndroidImportance: { MAX: "max" },
  getExpoPushTokenAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

const mockedConstants = Constants as {
  expoConfig?: { extra?: { eas?: { projectId?: string } } };
  easConfig?: { projectId?: string };
};
const mockGetExpoPushTokenAsync = jest.mocked(
  Notifications.getExpoPushTokenAsync,
);
const mockGetPermissionsAsync = jest.mocked(Notifications.getPermissionsAsync);
const mockRequestPermissionsAsync = jest.mocked(
  Notifications.requestPermissionsAsync,
);
const mockSetNotificationChannelAsync = jest.mocked(
  Notifications.setNotificationChannelAsync,
);
const mockSetNotificationHandler = jest.mocked(
  Notifications.setNotificationHandler,
);
const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

function setPlatform(os: typeof Platform.OS) {
  Object.defineProperty(Platform, "OS", {
    configurable: true,
    get: () => os,
  });
}

describe("push notification registration", () => {
  beforeEach(() => {
    mockGetExpoPushTokenAsync.mockClear();
    mockGetPermissionsAsync.mockClear();
    mockRequestPermissionsAsync.mockClear();
    mockSetNotificationChannelAsync.mockClear();
    mockedConstants.expoConfig = {
      extra: { eas: { projectId: "expo-project-id" } },
    };
    mockedConstants.easConfig = undefined;
    setPlatform("ios");
    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" } as any);
    mockRequestPermissionsAsync.mockResolvedValue({ status: "granted" } as any);
    mockGetExpoPushTokenAsync.mockResolvedValue({
      data: "ExponentPushToken[test-token]",
    } as any);
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  test("configures the foreground notification handler at module load", () => {
    expect(mockSetNotificationHandler).toHaveBeenCalledWith({
      handleNotification: expect.any(Function),
    });
  });

  test("returns an Expo push token when permission is already granted", async () => {
    await expect(registerForPushNotificationsAsync()).resolves.toBe(
      "ExponentPushToken[test-token]",
    );

    expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: "expo-project-id",
    });
  });

  test("requests permission when it has not been granted yet", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" } as any);

    await expect(registerForPushNotificationsAsync()).resolves.toBe(
      "ExponentPushToken[test-token]",
    );

    expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  test("rejects when push permission is denied", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" } as any);
    mockRequestPermissionsAsync.mockResolvedValue({ status: "denied" } as any);

    await expect(registerForPushNotificationsAsync()).rejects.toThrow(
      "Push notification permission denied.",
    );

    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  test("configures the Android notification channel before requesting a token", async () => {
    setPlatform("android");

    await registerForPushNotificationsAsync();

    expect(mockSetNotificationChannelAsync).toHaveBeenCalledWith("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  });

  test("uses the EAS config project id when expoConfig does not include one", async () => {
    mockedConstants.expoConfig = { extra: {} };
    mockedConstants.easConfig = { projectId: "eas-project-id" };

    await registerForPushNotificationsAsync();

    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: "eas-project-id",
    });
  });

  test("rejects when no EAS project id is configured", async () => {
    mockedConstants.expoConfig = { extra: {} };
    mockedConstants.easConfig = undefined;

    await expect(registerForPushNotificationsAsync()).rejects.toThrow(
      "EAS projectId not found in app config.",
    );

    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
  });
});
