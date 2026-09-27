import { FeatureGate } from "@/components/feature-gate";
import type { PointTransactionOut } from "@/api/schemas";
import { MEDAL_COLORS, TIER_COLORS } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import {
  useLeaderboard,
  useMilestones,
  useMyRewards,
  useScanHistory,
} from "@/features/points/hooks";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

// ============================================
// TIER & MILESTONE STYLING CONFIG
// ============================================

const TIER_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  Explorer: { icon: "compass", color: TIER_COLORS.Explorer },
  Innovator: { icon: "bulb", color: TIER_COLORS.Innovator },
  Master: { icon: "trophy", color: TIER_COLORS.Master },
};

/** Map milestone feature_key → display icon */
const MILESTONE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  view_slides: "eye-outline",
  download_slides: "download-outline",
  smart_matches: "people-outline",
  premium_groups: "chatbubbles-outline",
  certificate: "ribbon-outline",
  vip_lounge: "diamond-outline",
};

/** Map action_type from PointTransactionOut → icon only (labels resolved via i18n) */
const ACTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  ATTEND_SESSION: "calendar-outline",
  ONBOARDING: "checkmark-circle-outline",
  RATE_SESSION: "star-outline",
  JOIN_GROUP: "people-outline",
  POLL_VOTE: "chatbox-ellipses-outline",
  NETWORKING: "git-network-outline",
  GROUP_CHAT: "chatbubbles-outline",
  MAP_CHECKIN: "map-outline",
  QR_SCAN: "qr-code-outline",
};

// ============================================
// COMPONENT
// ============================================

export default function PointsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const router = useRouter();
  const { user } = useAuth();
  const { data: rewards, refetch: refetchRewards } = useMyRewards();
  const { data: milestones = [], refetch: refetchMilestones } = useMilestones();
  const { data: history = [], refetch: refetchHistory } = useScanHistory();
  const { data: leaderboard = [], refetch: refetchLeaderboard } =
    useLeaderboard(10);
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const points = rewards?.total_points ?? 0;
  const tier = rewards?.current_tier ?? "Explorer";
  const tierStyle = TIER_CONFIG[tier] ?? TIER_CONFIG.Explorer;
  const recentTxns = rewards?.recent_transactions ?? [];

  // Milestone progress
  const achievedMilestones = milestones.filter((m) => m.achieved);
  const nextMilestone = milestones.find((m) => !m.achieved);
  const progressPercent = nextMilestone
    ? Math.min(points / nextMilestone.threshold, 1)
    : 1;

  // Current rank on leaderboard
  const myRank = leaderboard.find((e) => e.user_id === user?.id)?.rank ?? null;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      refetchRewards(),
      refetchMilestones(),
      refetchHistory(),
      refetchLeaderboard(),
    ]).finally(() => setRefreshing(false));
  }, [refetchRewards, refetchMilestones, refetchHistory, refetchLeaderboard]);

  const formatActionLabel = (txn: PointTransactionOut) => {
    const key = `points.actionLabels.${txn.action_type}`;
    const translated = t(key as any);
    return translated !== key ? translated : txn.action_type.replace(/_/g, " ");
  };

  const getActionIcon = (
    txn: PointTransactionOut,
  ): keyof typeof Ionicons.glyphMap => {
    return ACTION_ICONS[txn.action_type] ?? "ellipse-outline";
  };

  return (
    <FeatureGate flag="rewards">
      <View style={styles.container}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackBtn}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("points.screenTitle")}</ThemedText>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
          />
        }
      >
        {/* Points Hero */}
        <View style={styles.heroCard}>
          <View
            style={[styles.heroIconWrap, { backgroundColor: tierStyle.color }]}
          >
            <Ionicons name={tierStyle.icon} size={32} color={COLOR_WHITE_ON_ACCENT} />
          </View>
          <ThemedText style={styles.heroPoints}>{points}</ThemedText>
          <ThemedText style={styles.heroLabel}>{t("points.totalPoints")}</ThemedText>

          {/* Tier badge */}
          <View
            style={[
              styles.tierBadge,
              { backgroundColor: `${tierStyle.color}20` },
            ]}
          >
            <Ionicons name={tierStyle.icon} size={14} color={tierStyle.color} />
            <ThemedText style={[styles.tierBadgeText, { color: tierStyle.color }]}>
              {tier}
            </ThemedText>
          </View>

          {/* Progress bar to next milestone */}
          {nextMilestone && (
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <ThemedText style={styles.progressLabel}>
                  Next: {nextMilestone.label}
                </ThemedText>
                <ThemedText style={styles.progressValue}>
                  {points}/{nextMilestone.threshold}
                </ThemedText>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(progressPercent * 100, 100)}%`,
                      backgroundColor: tierStyle.color,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Quick stats row */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <ThemedText style={styles.quickStatValue}>{history.length}</ThemedText>
              <ThemedText style={styles.quickStatLabel}>{t("points.scans")}</ThemedText>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <ThemedText style={styles.quickStatValue}>
                {achievedMilestones.length}
              </ThemedText>
              <ThemedText style={styles.quickStatLabel}>{t("points.unlocks")}</ThemedText>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <ThemedText style={styles.quickStatValue}>
                {myRank ? `#${myRank}` : "--"}
              </ThemedText>
              <ThemedText style={styles.quickStatLabel}>{t("points.rank")}</ThemedText>
            </View>
          </View>
        </View>

        {/* Milestones Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>{t("points.sectionMilestones")}</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              {achievedMilestones.length}/{milestones.length}
            </ThemedText>
          </View>

          {milestones.map((milestone) => {
            const icon =
              MILESTONE_ICONS[milestone.feature_key] ?? "flag-outline";
            const isUnlocked = milestone.achieved;

            return (
              <View
                key={milestone.feature_key}
                style={[
                  styles.milestoneCard,
                  isUnlocked && styles.milestoneCardUnlocked,
                ]}
              >
                <View
                  style={[
                    styles.milestoneIcon,
                    {
                      backgroundColor: isUnlocked
                        ? "rgba(16, 185, 129, 0.15)"
                        : "rgba(25, 79, 240, 0.08)",
                    },
                  ]}
                >
                  <Ionicons
                    name={isUnlocked ? "checkmark-circle" : icon}
                    size={24}
                    color={isUnlocked ? colors.success : colors.brand}
                  />
                </View>

                <View style={styles.milestoneInfo}>
                  <ThemedText
                    style={[
                      styles.milestoneTitle,
                      isUnlocked && styles.milestoneTitleUnlocked,
                    ]}
                  >
                    {milestone.label}
                  </ThemedText>
                  <ThemedText style={styles.milestoneSubtitle}>
                    {isUnlocked
                      ? t("points.unlocked")
                      : t("points.pointsRequired", { threshold: milestone.threshold })}
                  </ThemedText>

                  {/* Milestone progress bar */}
                  <View style={styles.milestoneProgressBg}>
                    <View
                      style={[
                        styles.milestoneProgressFill,
                        {
                          width: `${Math.min((points / milestone.threshold) * 100, 100)}%`,
                          backgroundColor: isUnlocked ? colors.success : colors.brand,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.milestoneReward}>
                  <ThemedText style={styles.milestoneThreshold}>
                    {milestone.threshold}
                  </ThemedText>
                  <ThemedText style={styles.milestonePts}>pts</ThemedText>
                </View>
              </View>
            );
          })}
        </View>

        {/* Recent Activity Section */}
        {recentTxns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>{t("points.sectionRecentActivity")}</ThemedText>
              <ThemedText style={styles.sectionSubtitle}>
                {t("points.lastCount", { count: recentTxns.length })}
              </ThemedText>
            </View>

            {recentTxns.slice(0, 8).map((txn) => (
              <View key={txn.id} style={styles.activityRow}>
                <View style={styles.activityIcon}>
                  <Ionicons
                    name={getActionIcon(txn)}
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
                <View style={styles.activityInfo}>
                  <ThemedText style={styles.activityLabel}>
                    {formatActionLabel(txn)}
                  </ThemedText>
                  <ThemedText style={styles.activityDate}>
                    {new Date(txn.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </ThemedText>
                </View>
                <ThemedText style={styles.activityPoints}>+{txn.points_amount}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Leaderboard Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>{t("points.sectionLeaderboard")}</ThemedText>
            <TouchableOpacity onPress={() => router.push("/profile/leaderboard")}>
              <ThemedText style={{ color: colors.lightBlue, fontSize: 14, fontWeight: "600" }}>{t("points.viewAll")}</ThemedText>
            </TouchableOpacity>
          </View>

          {leaderboard.length === 0 && (
            <View style={styles.emptyLeaderboard}>
              <Ionicons name="podium-outline" size={40} color={colors.textTertiary} />
              <ThemedText style={styles.emptyText}>
                {t("points.leaderboardEmpty")}
              </ThemedText>
            </View>
          )}

          {leaderboard.map((entry, index) => {
            const isMe = entry.user_id === user?.id;
            const rankColors = [MEDAL_COLORS.gold, MEDAL_COLORS.silver, MEDAL_COLORS.bronze];

            return (
              <TouchableOpacity
                key={entry.user_id}
                style={[styles.leaderRow, isMe && styles.leaderRowMe]}
                onPress={() =>
                  router.push({
                    pathname: "/user/[id]",
                    params: { id: entry.user_id.toString() },
                  })
                }
              >
                <View
                  style={[
                    styles.rankBadge,
                    {
                      backgroundColor:
                        index < 3
                          ? `${rankColors[index]}20`
                          : "rgba(100, 116, 139, 0.1)",
                    },
                  ]}
                >
                  {index < 3 ? (
                    <Ionicons
                      name="trophy"
                      size={14}
                      color={rankColors[index]}
                    />
                  ) : (
                    <ThemedText style={styles.rankNumber}>{entry.rank}</ThemedText>
                  )}
                </View>

                <View style={styles.leaderInfo}>
                  <ThemedText
                    style={[styles.leaderName, isMe && styles.leaderNameMe]}
                  >
                    {entry.full_name}
                    {isMe ? " (You)" : ""}
                  </ThemedText>
                  <ThemedText style={styles.leaderRole}>{entry.role}</ThemedText>
                </View>

                <ThemedText style={styles.leaderPoints}>{entry.points} pts</ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
        </ScrollView>
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
    color: colors.text,
    letterSpacing: -0.3,
    textAlign: "center",
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero Card
  heroCard: {
    margin: 16,
    padding: 24,
    backgroundColor: "rgba(25, 79, 240, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(25, 79, 240, 0.2)",
    alignItems: "center",
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  heroPoints: {
    fontSize: 44,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -1,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },

  // Tier badge
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 20,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Progress bar
  progressSection: {
    width: "100%",
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },

  // Quick stats
  quickStats: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  quickStat: {
    flex: 1,
    alignItems: "center",
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textTertiary,
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  // Sections
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textTertiary,
  },

  // Milestones
  milestoneCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  milestoneCardUnlocked: {
    borderColor: "rgba(16, 185, 129, 0.2)",
    backgroundColor: "rgba(16, 185, 129, 0.04)",
  },
  milestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneInfo: {
    flex: 1,
    marginLeft: 12,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  milestoneTitleUnlocked: {
    color: colors.success,
  },
  milestoneSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  milestoneProgressBg: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  milestoneProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  milestoneReward: {
    alignItems: "center",
    marginLeft: 12,
  },
  milestoneThreshold: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.warning,
  },
  milestonePts: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textTertiary,
    textTransform: "uppercase",
  },

  // Recent activity
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(25, 79, 240, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  activityDate: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 1,
  },
  activityPoints: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.success,
  },

  // Leaderboard
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  leaderRowMe: {
    borderColor: "rgba(25, 79, 240, 0.3)",
    backgroundColor: "rgba(25, 79, 240, 0.06)",
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textTertiary,
  },
  leaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leaderName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  leaderNameMe: {
    color: colors.brand,
  },
  leaderRole: {
    fontSize: 11,
    color: colors.textTertiary,
    textTransform: "capitalize",
  },
  leaderPoints: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.warning,
  },

  // Empty states
  emptyLeaderboard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: "center",
  },

  // CTA
  ctaSection: {
    padding: 16,
    paddingTop: 24,
    gap: 10,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  ctaButtonSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(25, 79, 240, 0.08)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(25, 79, 240, 0.2)",
  },
  ctaTextSecondary: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.brand,
  },
});
