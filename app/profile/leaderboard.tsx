import { FeatureGate } from "@/components/feature-gate";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { LeaderboardList } from "@/features/points/components/LeaderboardList";
import { LeaderboardPodium } from "@/features/points/components/LeaderboardPodium";
import { LeaderboardStatsCard } from "@/features/points/components/LeaderboardStatsCard";
import { useEnhancedLeaderboard } from "@/features/points/hooks/useEnhancedLeaderboard";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SHADOW_BLACK } from "@/constants/data-colors";
import { useColors } from "@/hooks/use-colors";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

// ============================================
// TYPES & CONSTANTS
// ============================================

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
type CategoryTab = "points" | "sessions" | "groups" | "scans";
type PeriodToggle = "all_time" | "daily";

const CATEGORY_KEYS: {
  key: CategoryTab;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "points", labelKey: "leaderboard.statsCard.points", icon: "star" },
  { key: "sessions", labelKey: "leaderboard.statsCard.sessions", icon: "calendar" },
  { key: "groups", labelKey: "leaderboard.statsCard.groups", icon: "people" },
  { key: "scans", labelKey: "leaderboard.statsCard.scans", icon: "qr-code" },
];

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shiftDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// ============================================
// COMPONENT
// ============================================

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [activeCategory, setActiveCategory] = useState<CategoryTab>("points");
  const [period, setPeriod] = useState<PeriodToggle>("all_time");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const dateParam = period === "daily" ? selectedDate : undefined;
  const { data, isLoading } = useEnhancedLeaderboard(
    activeCategory,
    period,
    dateParam,
  );

  const todayStr = useMemo(() => getTodayString(), []);
  const isToday = selectedDate === todayStr;

  const entries = data?.entries ?? [];
  const podiumEntries = entries.slice(0, 3);
  const listEntries = entries.slice(3);
  const myUserId = user?.id ?? 0;

  // Check if current user is already in visible entries
  const myEntryInList = entries.some((e) => e.user_id === myUserId);
  const showMyFooter = data?.my_entry && !myEntryInList;

  return (
    <FeatureGate flag="leaderboard">
    <View style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackBtn}
          >
            <Ionicons name="arrow-back" size={22} color={COLOR_WHITE_ON_ACCENT} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("points.leaderboardTitle")}</ThemedText>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {/* Category Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBarScroll}
        contentContainerStyle={styles.tabBarContent}
      >
        {CATEGORY_KEYS.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => setActiveCategory(cat.key)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Ionicons
                name={cat.icon}
                size={16}
                color={isActive ? COLOR_WHITE_ON_ACCENT : colors.textTertiary}
              />
              <ThemedText style={[styles.tabText, isActive && styles.tabTextActive]}>
                {t(cat.labelKey)}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Period Toggle */}
      <View style={styles.toggleWrapper}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              period === "all_time" && styles.toggleOptionActive,
            ]}
            onPress={() => setPeriod("all_time")}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[
                styles.toggleText,
                {
                  color: period === "all_time" ? COLOR_WHITE_ON_ACCENT : colors.textTertiary,
                },
              ]}
            >
              {t("points.allTime")}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              period === "daily" && styles.toggleOptionActive,
            ]}
            onPress={() => {
              setPeriod("daily");
              setSelectedDate(getTodayString());
            }}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[
                styles.toggleText,
                {
                  color: period === "daily" ? COLOR_WHITE_ON_ACCENT : colors.textTertiary,
                },
              ]}
            >
              {t("points.today")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Stepper (daily mode only) */}
      {period === "daily" && (
        <View style={styles.dateStepper}>
          <TouchableOpacity
            onPress={() => setSelectedDate((d) => shiftDate(d, -1))}
            style={styles.dateArrow}
          >
            <Ionicons name="chevron-back" size={20} color={COLOR_WHITE_ON_ACCENT} />
          </TouchableOpacity>
          <ThemedText style={styles.dateLabel}>{formatDateLabel(selectedDate)}</ThemedText>
          <TouchableOpacity
            onPress={() => {
              if (!isToday) setSelectedDate((d) => shiftDate(d, 1));
            }}
            style={[styles.dateArrow, isToday && styles.dateArrowDisabled]}
            disabled={isToday}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isToday ? colors.trackBackground : COLOR_WHITE_ON_ACCENT}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="podium-outline" size={48} color={colors.textTertiary} />
          <ThemedText style={styles.emptyText}>{t("points.noData")}</ThemedText>
          {period === "daily" && !isToday && (
            <ThemedText style={styles.emptySubtext}>
              {t("points.noSnapshotForDate")}
            </ThemedText>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Stats Card */}
          {data?.my_stats && (
            <LeaderboardStatsCard
              stats={data.my_stats}
              activeCategory={activeCategory}
            />
          )}

          {/* Podium */}
          <LeaderboardPodium
            entries={podiumEntries}
            category={activeCategory}
          />

          {/* Ranked List (entries after top 3) */}
          <LeaderboardList
            entries={listEntries}
            myUserId={myUserId}
            category={activeCategory}
          />

          {/* My Entry Footer */}
          {showMyFooter && data?.my_entry && (
            <View style={styles.myFooter}>
              <View style={styles.myFooterDivider} />
              <View style={styles.myFooterRow}>
                <View style={styles.myFooterRank}>
                  <ThemedText style={styles.myFooterRankText}>
                    #{data.my_entry.rank}
                  </ThemedText>
                </View>
                <View style={styles.myFooterInfo}>
                  <ThemedText style={styles.myFooterName}>
                    {data.my_entry.full_name ?? "You"} {t("points.you")}
                  </ThemedText>
                </View>
                <ThemedText style={styles.myFooterCount}>{data.my_entry.count}</ThemedText>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
    </FeatureGate>
  );
}

// ============================================
// STYLES
// ============================================

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },

  // Header
  headerSafe: {
    backgroundColor: colors.surfacePrimary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    letterSpacing: -0.3,
    textAlign: "center",
  },

  // Category Tab Bar
  tabBarScroll: {
    flexGrow: 0,
  },
  tabBarContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  tabActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: COLOR_WHITE_ON_ACCENT,
  },

  // Period Toggle
  toggleWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  toggleContainer: {
    flexDirection: "row",
    height: 40,
    borderRadius: 10,
    padding: 3,
    backgroundColor: colors.cardBackground,
  },
  toggleOption: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  toggleOptionActive: {
    backgroundColor: colors.surfacePrimary,
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Date Stepper
  dateStepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 16,
  },
  dateArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateArrowDisabled: {
    opacity: 0.3,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    minWidth: 130,
    textAlign: "center",
  },

  // Content
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textTertiary,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.border,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 8,
  },

  // My Entry Footer
  myFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  myFooterDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 12,
  },
  myFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(25, 79, 240, 0.08)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(25, 79, 240, 0.3)",
  },
  myFooterRank: {
    width: 36,
    alignItems: "center",
  },
  myFooterRankText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.brand,
  },
  myFooterInfo: {
    flex: 1,
    marginLeft: 8,
  },
  myFooterName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.brand,
  },
  myFooterCount: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.warning,
  },
});
