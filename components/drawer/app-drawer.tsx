import { ThemedText } from "@/components/themed-text";
import { WifiModal } from "@/components/wifi-modal";
import { SHADOW_BLACK } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { getTenantKey } from "@/constants/tenant-assets";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { useFeatureEnabled } from "@/features/config/hooks/useFeatureEnabled";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDrawerStore } from "./drawer-store";

const DRAWER_WIDTH = 280;
const ANIMATION_DURATION = 300;

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
  badge?: string;
  subtitle?: string;
};

export function AppDrawer() {
  const { isOpen, closeDrawer } = useDrawerStore();
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const [wifiModalVisible, setWifiModalVisible] = useState(false);
  const appName = useConfigStore((s) => s.appName);
  const wifiSsid = useConfigStore((s) => s.wifiSsid);
  const isFutureUnfold = getTenantKey() === "future-unfold";

  const MENU_SECTION_1 = useMemo<MenuItem[]>(
    () => [
      { icon: "home", label: t("drawer.home"), route: "/(tabs)/(home)" },
      ...(isFutureUnfold
        ? [
            {
              icon: "calendar-outline" as keyof typeof Ionicons.glyphMap,
              label: t("futureUnfold.agenda"),
              route: "/agenda",
            },
            {
              icon: "sparkles" as keyof typeof Ionicons.glyphMap,
              label: t("futureUnfold.portraits"),
              route: "/ai-portraits",
            },
          ]
        : []),
      { icon: "mail", label: t("drawer.messages"), route: "/messages" },
      {
        icon: "trophy",
        label: t("drawer.progressRewards"),
        route: "/profile/rewards-dashboard",
      },
      {
        icon: "pricetag-outline",
        label: t("drawer.tickets"),
        route: "/(tabs)/tickets",
      },
    ],
    [isFutureUnfold, t],
  );

  const MENU_SECTION_2 = useMemo<MenuItem[]>(
    () => [
      { icon: "notifications", label: t("drawer.notifications") },
      {
        icon: "stats-chart",
        label: t("drawer.festivalStats"),
        route: "/stats",
      },
    ],
    [t],
  );

  const MENU_SECTION_3 = useMemo<MenuItem[]>(
    () => [
      { icon: "settings", label: t("drawer.settingsPrivacy") },
      {
        icon: "wifi",
        label: t("drawer.wifiSetup"),
        subtitle: wifiSsid
          ? t("drawer.wifiConnectedTo", {
              defaultValue: "Network: {{ssid}}",
              ssid: wifiSsid,
            })
          : t("drawer.wifiNotConfigured", { defaultValue: "Not configured" }),
      },
    ],
    [t, wifiSsid],
  );

  function getRoleBadge(role: string | undefined): string {
    switch (role) {
      case "speaker":
        return t("drawer.roleSpeaker");
      case "exhibitor":
        return t("drawer.roleExhibitor");
      default:
        return t("drawer.rolePlatinum");
    }
  }

  // Feature flag mapping for drawer items (keyed by translated label)
  const DRAWER_FLAG_MAP = useMemo<Record<string, string>>(
    () => ({
      [t("drawer.messages")]: "direct_messages",
      [t("drawer.progressRewards")]: "rewards",
      [t("drawer.tickets")]: "tickets",
      [t("drawer.notifications")]: "notifications",
      [t("drawer.festivalStats")]: "festival_stats",
    }),
    [t],
  );

  // Feature flags for drawer items
  const dmEnabled = useFeatureEnabled("direct_messages");
  const rewardsEnabled = useFeatureEnabled("rewards");
  const ticketsEnabled = useFeatureEnabled("tickets");
  const notificationsEnabled = useFeatureEnabled("notifications");
  const festivalStatsEnabled = useFeatureEnabled("festival_stats");

  const flagValues = useMemo<Record<string, boolean>>(
    () => ({
      direct_messages: dmEnabled,
      rewards: rewardsEnabled,
      tickets: ticketsEnabled,
      notifications: notificationsEnabled,
      festival_stats: festivalStatsEnabled,
    }),
    [
      dmEnabled,
      rewardsEnabled,
      ticketsEnabled,
      notificationsEnabled,
      festivalStatsEnabled,
    ],
  );

  const filterByFlags = useCallback(
    (items: MenuItem[]) =>
      items.filter((item) => {
        const flag = DRAWER_FLAG_MAP[item.label];
        return !flag || flagValues[flag];
      }),
    [DRAWER_FLAG_MAP, flagValues],
  );

  const filteredSection1 = useMemo(
    () => filterByFlags(MENU_SECTION_1),
    [filterByFlags, MENU_SECTION_1],
  );
  const filteredSection2 = useMemo(
    () => filterByFlags(MENU_SECTION_2),
    [filterByFlags, MENU_SECTION_2],
  );

  useEffect(() => {
    progress.value = withTiming(isOpen ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isOpen, progress]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-DRAWER_WIDTH, 0]),
      },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.5]),
    pointerEvents: progress.value > 0 ? "auto" : "none",
  }));

  const handleMenuPress = useCallback(
    (item: MenuItem) => {
      if (item.label === t("drawer.wifiSetup")) {
        closeDrawer();
        setTimeout(() => setWifiModalVisible(true), 300);
        return;
      }
      closeDrawer();
      if (item.route) {
        setTimeout(() => {
          try {
            router.push(item.route as any);
          } catch {
            // navigation error
          }
        }, 300);
      } else if (item.label === t("drawer.notifications")) {
        setTimeout(() => router.push("/notifications"), 100);
      } else if (item.label === t("drawer.settingsPrivacy")) {
        setTimeout(() => router.push("/settings"), 100);
      } else {
        Alert.alert(item.label, `"${item.label}" tapped`);
      }
    },
    [closeDrawer, router, t],
  );

  const handleLogout = useCallback(() => {
    Alert.alert(t("drawer.alertSignOut"), t("drawer.alertSignOutMsg"), [
      { text: t("drawer.alertCancel"), style: "cancel" },
      {
        text: t("drawer.alertSignOutBtn"),
        style: "destructive",
        onPress: () => {
          closeDrawer();
          logout();
        },
      },
    ]);
  }, [closeDrawer, logout, t]);

  const renderMenuItem = (item: MenuItem, index: number, isActive = false) => (
    <TouchableOpacity
      key={`${item.icon}-${index}`}
      style={[styles.menuItem, isActive && styles.menuItemActive]}
      onPress={() => handleMenuPress(item)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={item.icon}
        size={22}
        color={isActive ? COLOR_WHITE_ON_ACCENT : colors.textSecondary}
      />
      <View style={styles.menuItemContent}>
        <ThemedText
          style={[styles.menuItemLabel, isActive && styles.menuItemLabelActive]}
        >
          {item.label}
        </ThemedText>
        {item.subtitle && (
          <ThemedText style={styles.menuItemSubtitle}>
            {item.subtitle}
          </ThemedText>
        )}
      </View>
      {item.badge && (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{item.badge}</ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <WifiModal
        visible={wifiModalVisible}
        onClose={() => setWifiModalVisible(false)}
      />

      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
      </Animated.View>

      <Animated.View testID="app-drawer" style={[styles.drawer, drawerStyle]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.avatarContainer}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons
                  name="person"
                  size={28}
                  color={colors.textSecondary}
                />
              </View>
            )}
          </View>
          <ThemedText style={styles.userName}>
            {user?.full_name ?? t("drawer.userFallback")}
          </ThemedText>
          <View style={styles.roleBadge}>
            <ThemedText style={styles.roleBadgeText}>
              {getRoleBadge(user?.role)}
            </ThemedText>
          </View>
        </View>

        {/* Menu Sections */}
        <ScrollView
          style={styles.menuContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.menuSection}>
            {filteredSection1.map((item, i) =>
              renderMenuItem(item, i, item.label === t("drawer.home")),
            )}
          </View>

          {filteredSection2.length > 0 && (
            <>
              <View style={styles.separator} />
              <View style={styles.menuSection}>
                {filteredSection2.map((item, i) => renderMenuItem(item, i))}
              </View>
            </>
          )}

          <View style={styles.separator} />

          <View style={styles.menuSection}>
            {MENU_SECTION_3.map((item, i) => renderMenuItem(item, i))}
          </View>

          {(user?.role === "admin" || user?.role === "moderator") && (
            <>
              <View style={styles.separator} />
              <View style={styles.menuSection}>
                {[
                  {
                    icon: "shield-checkmark" as keyof typeof Ionicons.glyphMap,
                    label: t("drawer.adminPanel"),
                    route: "/admin-dashboard",
                  },
                ].map((item, i) => renderMenuItem(item, i))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            testID="drawer-sign-out-button"
            style={styles.signOutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <ThemedText style={styles.signOutText}>
              {t("drawer.signOut")}
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.versionText}>
            {t("drawer.version", { appName })}
          </ThemedText>
        </View>
      </Animated.View>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: SHADOW_BLACK,
      zIndex: 100,
    },
    drawer: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: DRAWER_WIDTH,
      backgroundColor: colors.gradientStart,
      zIndex: 101,
      borderRightWidth: 1,
      borderRightColor: colors.cardBorder,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    avatarContainer: {
      marginBottom: 12,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: colors.error,
    },
    avatarPlaceholder: {
      backgroundColor: colors.cardBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    userName: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 6,
    },
    roleBadge: {
      alignSelf: "flex-start",
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    roleBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    menuContainer: {
      flex: 1,
      paddingTop: 8,
    },
    menuSection: {
      paddingVertical: 4,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginHorizontal: 8,
      borderRadius: 10,
      gap: 14,
    },
    menuItemActive: {
      backgroundColor: colors.primary,
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemLabel: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    menuItemLabelActive: {
      color: COLOR_WHITE_ON_ACCENT,
      fontWeight: "600",
    },
    menuItemSubtitle: {
      fontSize: 12,
      color: colors.textSubtle,
      marginTop: 2,
    },
    badge: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 6,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
    separator: {
      height: 1,
      backgroundColor: colors.cardBorder,
      marginHorizontal: 20,
      marginVertical: 4,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    signOutButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
    },
    signOutText: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.error,
    },
    versionText: {
      fontSize: 11,
      color: colors.textSubtle,
      letterSpacing: 1,
      marginTop: 8,
    },
  });
