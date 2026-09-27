import { FeatureGate } from "@/components/feature-gate";
import {
  markAllNotificationsSeen,
  markNotificationSeen,
} from "@/api/features/notifications";
import type { NotificationOut } from "@/api/schemas";
import { useColors } from "@/hooks/use-colors";
import { useGetNotifications } from "@/features/notifications/hooks/useGetNotifications";
import { usePendingNavigationStore } from "@/features/notifications/stores/pending-navigation";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

// ─── Types ───────────────────────────────────────────────────────────────────

type UINotification = NotificationOut & {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function iconForType(
  type: string,
  colors: ReturnType<typeof useColors>,
): {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
} {
  switch (type) {
    case "session_starting":
      return {
        icon: "time-outline",
        iconColor: colors.lightBlue,
        iconBg: "rgba(59, 130, 246, 0.2)",
      };
    case "meeting_request":
      return {
        icon: "person-circle-outline",
        iconColor: colors.primary,
        iconBg: "rgba(167, 139, 250, 0.2)",
      };
    case "recommendation":
      return {
        icon: "bulb-outline",
        iconColor: colors.warning,
        iconBg: "rgba(245, 158, 11, 0.2)",
      };
    case "schedule_update":
      return {
        icon: "calendar-outline",
        iconColor: colors.success,
        iconBg: "rgba(34, 197, 94, 0.2)",
      };
    case "session_reminder":
      return {
        icon: "time-outline",
        iconColor: colors.lightBlue,
        iconBg: "rgba(59, 130, 246, 0.2)",
      };
    case "meeting_reminder":
      return {
        icon: "person-circle-outline",
        iconColor: colors.primary,
        iconBg: "rgba(167, 139, 250, 0.2)",
      };
    case "friend_activity":
      return {
        icon: "people-outline",
        iconColor: colors.success,
        iconBg: "rgba(34, 197, 94, 0.2)",
      };
    case "group_suggestion":
      return {
        icon: "chatbubbles-outline",
        iconColor: colors.warning,
        iconBg: "rgba(245, 158, 11, 0.2)",
      };
    case "popular_session":
      return {
        icon: "trending-up-outline",
        iconColor: colors.primary,
        iconBg: "rgba(236, 72, 153, 0.2)",
      };
    case "dm":
    case "message":
      return {
        icon: "chatbubble-outline",
        iconColor: colors.primary,
        iconBg: "rgba(236, 72, 153, 0.2)",
      };
    default:
      return {
        icon: "notifications-outline",
        iconColor: colors.lightBlue,
        iconBg: "rgba(59, 130, 246, 0.2)",
      };
  }
}

function toUINotification(
  n: NotificationOut,
  colors: ReturnType<typeof useColors>,
): UINotification {
  return { ...n, ...iconForType(n.type, colors) };
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Components ──────────────────────────────────────────────────────────────

const TABS_KEYS = ["tabAll", "tabMentionsMessages"] as const;

function NotificationCard({
  item,
  onPress,
}: {
  item: UINotification;
  onPress: (item: UINotification) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={22} color={item.iconColor} />
      </View>
      <View style={styles.cardContent}>
        <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.cardSubtitle}>{item.body}</ThemedText>
        <ThemedText style={styles.cardTime}>{formatTime(item.created_at)}</ThemedText>
      </View>
      {!item.seen && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  return (
    <FeatureGate flag="notifications">
      <NotificationsContent />
    </FeatureGate>
  );
}

function NotificationsContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colors = useColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState(0);
  const { data: notifications = [], isLoading } = useGetNotifications();
  const { setPendingPath } = usePendingNavigationStore();
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const uiNotifications = notifications.map((n) => toUINotification(n, colors));

  const filtered =
    activeTab === 0
      ? uiNotifications
      : uiNotifications.filter(
          (n) => n.type === "message" || n.type === "dm",
        );

  const upcomingTypes = new Set([
    "session_starting",
    "meeting_request",
    "session_reminder",
    "meeting_reminder",
  ]);
  const upcoming = filtered.filter((n) => upcomingTypes.has(n.type));
  const activity = filtered.filter((n) => !upcomingTypes.has(n.type));

  const flatData = [
    ...(upcoming.length > 0
      ? [
          { id: "header-upcoming", type: "header" as const, title: t("notifications.sectionUpcoming") },
          ...upcoming.map((n) => ({ ...n, type: "item" as const })),
        ]
      : []),
    ...(activity.length > 0
      ? [
          {
            id: "header-activity",
            type: "header" as const,
            title: t("notifications.sectionActivity"),
          },
          ...activity.map((n) => ({ ...n, type: "item" as const })),
        ]
      : []),
  ];

  function handlePress(item: UINotification) {
    if (!item.seen) {
      markNotificationSeen(item.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      });
    }
    if (item.deeplink) {
      setPendingPath(item.deeplink);
      router.back();
    }
  }

  function handleMarkAllSeen() {
    markAllNotificationsSeen().then(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("notifications.title")}</ThemedText>
        </View>
        <TouchableOpacity onPress={handleMarkAllSeen}>
          <ThemedText style={styles.markAllSeen}>{t("notifications.markAllSeen")}</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS_KEYS.map((key, index) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === index && styles.tabActive]}
            onPress={() => setActiveTab(index)}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === index && styles.tabTextActive,
              ]}
            >
              {t(`notifications.${key}`)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator
          style={styles.loader}
          color={colors.lightBlue}
        />
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>{t("notifications.empty")}</ThemedText>
          }
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <ThemedText style={styles.sectionHeader}>
                  {(item as { title: string }).title}
                </ThemedText>
              );
            }
            return (
              <NotificationCard
                item={item as UINotification}
                onPress={handlePress}
              />
            );
          }}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.gradientStart,
    },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    backButton: {
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
    },
    tabBar: {
      flexDirection: "row",
      paddingHorizontal: 16,
      gap: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    tab: {
      paddingBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: colors.lightBlue,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.text,
      fontWeight: "600",
    },
    loader: {
      marginTop: 40,
    },
    list: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    emptyText: {
      marginTop: 40,
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: 15,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 1,
      marginTop: 20,
      marginBottom: 10,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      gap: 12,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    cardSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    cardTime: {
      fontSize: 12,
      color: colors.textSubtle,
      marginTop: 4,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.lightBlue,
    },
    markAllSeen: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.lightBlue,
    },
  });
