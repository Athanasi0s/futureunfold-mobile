import { getMe, login as loginApi } from "@/api/features/auth";
import { deletePushToken } from "@/api/features/notifications";
import type { MeOut } from "@/api/schemas";
import { clearAuthToken, saveAuthToken } from "@/lib/secure-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Alert } from "react-native";
import { useAuthStore } from "../stores/auth";

function isConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    response?: unknown;
    code?: string;
    message?: string;
    request?: unknown;
  };

  return (
    !candidate.response &&
    (candidate.code === "ERR_NETWORK" ||
      candidate.code === "ECONNABORTED" ||
      candidate.message === "Network Error" ||
      Boolean(candidate.request))
  );
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, setUser, clearUser } = useAuthStore();

  const meQueryFn = () => getMe();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: meQueryFn,
    enabled: isAuthenticated,
  });

  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const parsed = await loginApi(email, password);
      await saveAuthToken(parsed.access_token);
      return parsed;
    },
    onSuccess: async () => {
      const userData = await queryClient.fetchQuery({
        queryKey: ["me"],
        queryFn: meQueryFn,
      });
      setUser(userData);
    },
    onError: (e: any) => {
      if (isConnectionError(e)) {
        Alert.alert(
          "Connection issue",
          "We couldn't reach the server. Check your connection and try again.",
        );
        return;
      }

      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Login failed (check backend logs).";
      Alert.alert("Login error", String(msg));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await deletePushToken().catch(() => {}); // best-effort; don't block logout
      await clearAuthToken();
    },
    onSuccess: () => {
      clearUser();
      queryClient.clear();
      router.replace("/login");
    },
  });

  return {
    user: meQuery.data ?? user,
    isAuthenticated,
    isLoadingUser: meQuery.isLoading,
    login: (email: string, password: string) =>
      loginMutation.mutate({ email, password }),
    logout: () => logoutMutation.mutate(),
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    refetchUser: meQuery.refetch,
  };
}
