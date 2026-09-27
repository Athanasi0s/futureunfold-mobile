import { getMe } from "@/api/features/auth";
import { UserRole } from "@/api/schemas";
import { getDefaultScreenOptions } from "@/constants/navigationOptions";
import { BrandSplash } from "@/components/brand-splash";
import { hasTenantBrandAssets } from "@/constants/tenant-assets";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { useEventoraMagicLink } from "@/features/authentication/hooks/useEventoraMagicLink";
import { useNotificationListener } from "@/features/notifications/hooks/useNotificationListener";
import { usePendingNavigationStore } from "@/features/notifications/stores/pending-navigation";
import { useGetOnboardingQuestions } from "@/features/onboarding/hooks/useGetOnboardingQuestions";
import { useGetOnboardingStatus } from "@/features/onboarding/hooks/useGetOnboardingStatus";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding";
import { useColors } from "@/hooks/use-colors";
import { queryClient } from "@/lib/query-client";
import { clearAuthToken, getAuthToken } from "@/lib/secure-storage";
// Import for side-effect: sets up Notifications.setNotificationHandler at module load time
import { useConfigStore } from "@/features/config/stores/config-store";
import "@/lib/push-notifications";
import "@/lib/sentry";
import "@/lib/i18n";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as Location from "expo-location";
import { Stack, router, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppErrorBoundary } from "@/components/app-error-boundary";

const MIN_BRAND_SPLASH_DURATION_MS = 1200;

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

function AppContent() {
  const [hasShownMinimumSplash, setHasShownMinimumSplash] = useState(false);
  const {
    setUser,
    clearUser,
    isAuthenticated,
    isInitializing,
    setInitialized,
    user,
  } = useAuthStore();
  const { shouldOpenOnboarding } = useOnboardingStore();
  const segments = useSegments();
  const { pendingPath, setPendingPath } = usePendingNavigationStore();
  const colors = useColors();
  const hasBrandSplash = hasTenantBrandAssets();
  const [fontsLoaded] = useFonts({
    "GTWalsheimPro-Regular": require("@/assets/fonts/future-unfold/GT-Walsheim-Pro-Regular.otf"),
    "GTWalsheimPro-Bold": require("@/assets/fonts/future-unfold/GT-Walsheim-Pro-Bold.otf"),
  });

  useNotificationListener();
  useEventoraMagicLink();

  useEffect(() => {
    const timer = setTimeout(
      () => setHasShownMinimumSplash(true),
      MIN_BRAND_SPLASH_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, []);

  // Navigate to deeplink once the notifications screen is dismissed
  useEffect(() => {
    if (!pendingPath) return;
    if ((segments as string[]).includes("notifications")) return;
    router.navigate(pendingPath as any);
    setPendingPath(null);
  }, [segments, pendingPath, setPendingPath]);

  useGetOnboardingQuestions();

  const { data: onboardingStatus, isLoading: isLoadingOnboarding } =
    useGetOnboardingStatus(isAuthenticated);
  const hasCompletedOrSkippedOnboarding =
    onboardingStatus?.status !== "pending";

  const shouldShowOnboarding =
    !hasCompletedOrSkippedOnboarding || shouldOpenOnboarding;

  const isExhibitor = user?.role === UserRole.exhibitor;
  const isReady = isAuthenticated && !shouldShowOnboarding;

  useEffect(() => {
    (async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          // Fetch user data (auth interceptor will add token automatically)
          const userData = await getMe();
          setUser(userData);
        }
      } catch {
        // Token is invalid or expired, clear auth state
        await clearAuthToken();
        clearUser();
      }

      // Load config from cache, then refresh in background
      const { loadCachedConfig, fetchAndCacheConfig } =
        useConfigStore.getState();
      await loadCachedConfig();
      fetchAndCacheConfig();

      setInitialized();
    })();
  }, [setUser, clearUser, setInitialized]);

  // Request location permissions at app launch
  useEffect(() => {
    Location.requestForegroundPermissionsAsync();
  }, []);

  const isAppPreparing = isInitializing || (isAuthenticated && isLoadingOnboarding);

  if (!fontsLoaded) {
    return null;
  }

  if (hasBrandSplash && (!hasShownMinimumSplash || isAppPreparing)) {
    return <BrandSplash />;
  }

  if (!hasBrandSplash && isAppPreparing) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" backgroundColor={colors.background} />
      <KeyboardProvider>
        <Stack
          screenOptions={{
            ...getDefaultScreenOptions(colors),
            headerShown: false,
          }}
        >
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={isAuthenticated && shouldShowOnboarding}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>
          <Stack.Protected guard={isReady && !isExhibitor}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
          <Stack.Protected guard={isReady && isExhibitor}>
            <Stack.Screen name="(exhibitor-tabs)" />
          </Stack.Protected>
          <Stack.Protected guard={isReady}>
            <Stack.Screen name="discovery" />
            <Stack.Screen name="session/[id]" />
            <Stack.Screen name="user/[id]" />
            <Stack.Screen name="exhibitor-programme" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="scan" />
            <Stack.Screen name="festival-wrapup" />
            <Stack.Screen name="my-polls" />
            <Stack.Screen name="session-qa" />
            <Stack.Screen name="session-qa-public" />
            <Stack.Screen name="map-entity/[id]" />
            <Stack.Screen name="messages" />
            <Stack.Screen name="messages-compose" />
            <Stack.Screen name="dm-chat" />
            <Stack.Screen name="session-chat" />
            <Stack.Screen name="stats" />
            <Stack.Screen name="create-session" />
            <Stack.Screen name="settings-theme" />
            <Stack.Screen name="blocked-users" />
            <Stack.Screen name="agenda" />
            <Stack.Screen name="ai-portraits" />
          </Stack.Protected>
          <Stack.Protected guard={isReady && user?.role === UserRole.admin}>
            <Stack.Screen name="admin-dashboard" />
            <Stack.Screen name="admin-users" />
            <Stack.Screen name="admin-theme" />
            <Stack.Screen name="admin-stats" />
            <Stack.Screen name="admin-ticket-packages" />
            <Stack.Screen name="admin-audit-log" />
            <Stack.Screen name="admin-venues" />
            <Stack.Screen name="admin-groups" />
            <Stack.Screen name="admin-interests" />
            <Stack.Screen name="admin-branding" />
            <Stack.Screen name="admin-config" />
            <Stack.Screen name="admin-push" />
            <Stack.Screen name="admin-reports" />
            <Stack.Screen name="admin-features" />
          </Stack.Protected>
        </Stack>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function LoadingScreen() {
  const colors = useColors();

  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
