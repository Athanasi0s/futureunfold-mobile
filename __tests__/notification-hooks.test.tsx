import type { PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  getNotificationPreferences,
  getNotifications,
  updateNotificationPreferences,
} from "@/api/features/notifications";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { useGetNotifications } from "@/features/notifications/hooks/useGetNotifications";
import { useNotificationPreferences } from "@/features/notifications/hooks/useNotificationPreferences";

jest.mock("@/api/features/notifications", () => ({
  getNotificationPreferences: jest.fn(),
  getNotifications: jest.fn(),
  updateNotificationPreferences: jest.fn(),
}));

const mockGetNotificationPreferences = jest.mocked(getNotificationPreferences);
const mockGetNotifications = jest.mocked(getNotifications);
const mockUpdateNotificationPreferences = jest.mocked(
  updateNotificationPreferences,
);

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("notification hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isInitializing: false,
    });
  });

  test("does not fetch notifications while signed out", async () => {
    const queryClient = createTestQueryClient();

    renderHook(() => useGetNotifications(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(mockGetNotifications).not.toHaveBeenCalled();
    });
  });

  test("fetches notifications for authenticated users", async () => {
    const queryClient = createTestQueryClient();
    useAuthStore.setState({ isAuthenticated: true });
    mockGetNotifications.mockResolvedValue([
      {
        id: 1,
        title: "Welcome",
        body: "Hello",
        type: "broadcast",
        ref_id: null,
        deeplink: "/notifications",
        seen: false,
        created_at: "2026-01-01T00:00:00Z",
      },
    ]);

    const { result } = renderHook(() => useGetNotifications(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    expect(mockGetNotifications).toHaveBeenCalledTimes(1);
  });

  test("does not fetch notification preferences while signed out", async () => {
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.preferences).toEqual([]);

    await waitFor(() => {
      expect(mockGetNotificationPreferences).not.toHaveBeenCalled();
    });
  });

  test("fetches preferences and toggles a category for authenticated users", async () => {
    const queryClient = createTestQueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    useAuthStore.setState({ isAuthenticated: true });
    mockGetNotificationPreferences.mockResolvedValue([
      { category: "messages", enabled: true },
    ]);
    mockUpdateNotificationPreferences.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.preferences).toEqual([
        { category: "messages", enabled: true },
      ]);
    });

    act(() => {
      result.current.toggle("messages", false);
    });

    await waitFor(() => {
      expect(mockUpdateNotificationPreferences).toHaveBeenCalled();
    });

    expect(mockUpdateNotificationPreferences.mock.calls[0][0]).toEqual([
      { category: "messages", enabled: false },
    ]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["notification-preferences"],
    });
  });
});
