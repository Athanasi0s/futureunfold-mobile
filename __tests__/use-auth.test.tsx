import type { PropsWithChildren } from "react";
import { Alert } from "react-native";
import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "expo-router";

import { getMe, login as loginApi } from "@/api/features/auth";
import { deletePushToken } from "@/api/features/notifications";
import type { MeOut } from "@/api/schemas";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { clearAuthToken, saveAuthToken } from "@/lib/secure-storage";

jest.mock("@/api/features/auth", () => ({
  getMe: jest.fn(),
  login: jest.fn(),
}));

jest.mock("@/api/features/notifications", () => ({
  deletePushToken: jest.fn(),
}));

jest.mock("@/lib/secure-storage", () => ({
  clearAuthToken: jest.fn(),
  saveAuthToken: jest.fn(),
}));

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

const mockGetMe = jest.mocked(getMe);
const mockLoginApi = jest.mocked(loginApi);
const mockDeletePushToken = jest.mocked(deletePushToken);
const mockClearAuthToken = jest.mocked(clearAuthToken);
const mockSaveAuthToken = jest.mocked(saveAuthToken);
const mockRouterReplace = jest.mocked(router.replace);
const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

const user = {
  id: 42,
  email: "user@example.com",
} as MeOut;

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

describe("useAuth", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockGetMe.mockReset();
    mockLoginApi.mockReset();
    mockDeletePushToken.mockReset().mockResolvedValue(undefined);
    mockClearAuthToken.mockReset().mockResolvedValue(undefined);
    mockSaveAuthToken.mockReset().mockResolvedValue(undefined);
    mockRouterReplace.mockReset();
    mockAlert.mockClear();
    mockGetMe.mockResolvedValue(user);
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isInitializing: false,
    });
  });

  test("logs in, stores the token, fetches the user, and authenticates the session", async () => {
    const queryClient = createTestQueryClient();
    mockLoginApi.mockResolvedValue({
      access_token: "fresh-token",
      token_type: "bearer",
    });
    mockGetMe.mockResolvedValue(user);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.login(" user@example.com ", "password");
    });

    await waitFor(() => {
      expect(useAuthStore.getState()).toMatchObject({
        user,
        isAuthenticated: true,
      });
    });

    expect(mockLoginApi).toHaveBeenCalledWith(
      " user@example.com ",
      "password",
    );
    expect(mockSaveAuthToken).toHaveBeenCalledWith("fresh-token");
    expect(mockGetMe).toHaveBeenCalled();
  });

  test("does not authenticate when saving the login token fails", async () => {
    const queryClient = createTestQueryClient();
    mockLoginApi.mockResolvedValue({
      access_token: "fresh-token",
      token_type: "bearer",
    });
    mockSaveAuthToken.mockRejectedValue(new Error("secure storage unavailable"));

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.login("user@example.com", "password");
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "Login error",
        "secure storage unavailable",
      );
    });

    expect(mockGetMe).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  test("shows the backend login error detail", async () => {
    const queryClient = createTestQueryClient();
    mockLoginApi.mockRejectedValue({
      response: {
        data: {
          detail: "Invalid credentials",
        },
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.login("user@example.com", "wrong-password");
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "Login error",
        "Invalid credentials",
      );
    });

    expect(mockSaveAuthToken).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  test("shows a connection message when the login API is unreachable", async () => {
    const queryClient = createTestQueryClient();
    mockLoginApi.mockRejectedValue({
      code: "ERR_NETWORK",
      message: "Network Error",
      request: {},
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.login("user@example.com", "password");
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "Connection issue",
        "We couldn't reach the server. Check your connection and try again.",
      );
    });

    expect(mockSaveAuthToken).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  test("shows a safe fallback for unstructured login errors", async () => {
    const queryClient = createTestQueryClient();
    mockLoginApi.mockRejectedValue({});

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.login("user@example.com", "password");
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "Login error",
        "Login failed (check backend logs).",
      );
    });
  });

  test("exposes the login loading state while authentication is pending", async () => {
    const queryClient = createTestQueryClient();
    let resolveLogin!: (
      value: Awaited<ReturnType<typeof loginApi>>,
    ) => void;
    mockLoginApi.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.login("user@example.com", "password");
    });

    await waitFor(() => {
      expect(result.current.isLoggingIn).toBe(true);
    });

    await act(async () => {
      resolveLogin({
        access_token: "fresh-token",
        token_type: "bearer",
      });
    });

    await waitFor(() => {
      expect(result.current.isLoggingIn).toBe(false);
    });
  });

  test("logs out, clears cached data, and navigates to login", async () => {
    const queryClient = createTestQueryClient();
    const clearQueryCache = jest.spyOn(queryClient, "clear");
    useAuthStore.getState().setUser(user);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.logout();
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/login");
    });

    expect(mockDeletePushToken).toHaveBeenCalledTimes(1);
    expect(mockClearAuthToken).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
    });
    expect(clearQueryCache).toHaveBeenCalledTimes(1);
  });

  test("continues logout when deleting the push token fails", async () => {
    const queryClient = createTestQueryClient();
    useAuthStore.getState().setUser(user);
    mockDeletePushToken.mockRejectedValue(new Error("push service unavailable"));

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.logout();
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/login");
    });

    expect(mockClearAuthToken).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  test("keeps the session when clearing the auth token fails during logout", async () => {
    const queryClient = createTestQueryClient();
    useAuthStore.getState().setUser(user);
    mockClearAuthToken.mockRejectedValue(new Error("secure storage unavailable"));

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.logout();
    });

    await waitFor(() => {
      expect(mockClearAuthToken).toHaveBeenCalledTimes(1);
    });

    expect(useAuthStore.getState()).toMatchObject({
      user,
      isAuthenticated: true,
    });
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});
