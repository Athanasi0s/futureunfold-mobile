import { FeatureGate } from "@/components/feature-gate";
import type { EarnActionOut } from "@/api/schemas";
import { TIER_COLORS } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import {
  useEarningActions,
  useMilestones,
  useMyRewards,
} from "@/features/points/hooks";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

// ============================================
// TIER CONFIG
// ============================================

const TIER_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  Explorer: { label: "Explorer", icon: "compass", color: TIER_COLORS.Explorer },
  Innovator: { label: "Tech Trailblazer", icon: "bulb", color: TIER_COLORS.Innovator },
  Master: { label: "Master", icon: "trophy", color: TIER_COLORS.Master },
};

// Map icon names from the backend to Ionicons glyph names
const EARN_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  event_available: "calendar-outline",
  groups: "people-outline",
  qr_code_scanner: "qr-code-outline",
  star_rate: "star-outline",
  chat: "chatbubbles-outline",
  hub: "git-network-outline",
  map: "map-outline",
  school: "school-outline",
  campaign: "megaphone-outline",
};

// ============================================
// MILESTONE REWARD CARDS (static / mock)
// ============================================

type RewardCard = {
  id: string;
  title: string;
  threshold: number;
  unlocked: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

// ============================================
// PROGRESS RING CONSTANTS
// ============================================

const RING_SIZE = 192;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ============================================
// COMPONENT
// ============================================

export default function RewardsDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const router = useRouter();
  const { t } = useTranslation();

  const {
    data: rewards,
    isLoading: loadingRewards,
    refetch: refetchRewards,
  } = useMyRewards();
  const {
    data: milestones = [],
    isLoading: loadingMilestones,
    refetch: refetchMilestones,
  } = useMilestones();
  const {
    data: earnActions = [],
    isLoading: loadingActions,
    refetch: refetchActions,
  } = useEarningActions();

  const isLoading = loadingRewards || loadingMilestones || loadingActions;

  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const points = rewards?.total_points ?? 0;
  const tier = rewards?.current_tier ?? "Explorer";
  const tierStyle = TIER_CONFIG[tier] ?? TIER_CONFIG.Explorer;

  // Milestone progress
  const achievedMilestones = milestones.filter((m) => m.achieved);
  const nextMilestone = milestones.find((m) => !m.achieved);
  const ptsToNext = nextMilestone
    ? Math.max(nextMilestone.threshold - points, 0)
    : 0;
  const progressPercent = nextMilestone
    ? Math.min(points / nextMilestone.threshold, 1)
    : 1;
  const completionPct = Math.round(progressPercent * 100);

  // Current stage index (1-based)
  const currentStageIndex = achievedMilestones.length + 1;

  // SVG ring offset
  const ringOffset = RING_CIRCUMFERENCE * (1 - progressPercent);

  // Build reward cards from milestones
  const rewardCards: RewardCard[] = milestones.map((m) => ({
    id: m.feature_key,
    title: m.label,
    threshold: m.threshold,
    unlocked: m.achieved,
    icon: m.achieved ? "checkmark-circle" : "lock-closed",
    color: m.achieved ? colors.success : colors.textTertiary,
  }));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      refetchRewards(),
      refetchMilestones(),
      refetchActions(),
    ]).finally(() => setRefreshing(false));
  }, [refetchRewards, refetchMilestones, refetchActions]);

  const resolveEarnIcon = (
    action: EarnActionOut,
  ): keyof typeof Ionicons.glyphMap => {
    return EARN_ICON_MAP[action.icon] ?? "ellipse-outline";
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
          <ThemedText style={styles.headerTitle}>{t("points.rewardsDashboardTitle")}</ThemedText>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : null}

      <ScrollView
        style={isLoading ? styles.hidden : styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
          />
        }
      >
        {/* ── Hero Progress Ring ── */}
        <View style={styles.heroSection}>
          <View style={styles.ringContainer}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
              {/* Background circle */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={RING_STROKE}
                fill="transparent"
              />
              {/* Progress arc */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={colors.brand}
                strokeWidth={RING_STROKE}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
                rotation={-90}
                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              />
            </Svg>

            {/* Center text overlay */}
            <View style={styles.ringCenter}>
              <ThemedText style={styles.ringPoints}>{points.toLocaleString()}</ThemedText>
              <ThemedText style={styles.ringLabel}>{t("points.ringLabel")}</ThemedText>
            </View>
          </View>

          {/* Tier info */}
          <View style={styles.tierInfo}>
            <ThemedText style={styles.tierName}>{tierStyle.label}</ThemedText>
            {nextMilestone ? (
              <ThemedText style={styles.tierSubtext}>
                {t("points.ptsToReach", { count: ptsToNext.toLocaleString(), label: nextMilestone.label })}
              </ThemedText>
            ) : (
              <ThemedText style={styles.tierSubtext}>
                {t("points.highestTierReached")}
              </ThemedText>
            )}
          </View>
        </View>

        {/* ── Quick Stats Card ── */}
        <View style={styles.statsCardWrap}>
          <View style={styles.statsCard}>
            <View style={styles.statsCardLeft}>
              <View style={styles.statsCardIcon}>
                <Ionicons name="ribbon" size={22} color={colors.brand} />
              </View>
              <View>
                <ThemedText style={styles.statsCardLabel}>{t("points.statsCardCurrentMilestone")}</ThemedText>
                <ThemedText style={styles.statsCardValue}>
                  {t("points.statsCardStage", { stage: currentStageIndex, tier })}
                </ThemedText>
              </View>
            </View>
            <View style={styles.statsCardRight}>
              <ThemedText style={styles.statsCardLabel}>{t("points.statsCardCompletion")}</ThemedText>
              <ThemedText style={styles.statsCardPct}>{completionPct}%</ThemedText>
            </View>
          </View>
        </View>

        {/* ── Milestone Rewards Carousel ── */}
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionTitle}>{t("points.milestoneRewards")}</ThemedText>
          <TouchableOpacity
            onPress={() => router.push("/profile/points" as any)}
          >
            <ThemedText style={styles.viewAllBtn}>{t("points.viewAll")}</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          style={styles.carousel}
        >
          {rewardCards.map((card) => (
            <View
              key={card.id}
              style={[
                styles.rewardCard,
                !card.unlocked && styles.rewardCardLocked,
              ]}
            >
              <View
                style={[
                  styles.rewardCardImage,
                  !card.unlocked && styles.rewardCardImageLocked,
                ]}
              >
                <Ionicons
                  name={card.unlocked ? "gift" : "lock-closed"}
                  size={40}
                  color={card.unlocked ? colors.brand : colors.textTertiary}
                />
                {card.unlocked && (
                  <View style={styles.rewardUnlockedBadge}>
                    <Ionicons name="checkmark" size={12} color={COLOR_WHITE_ON_ACCENT} />
                  </View>
                )}
              </View>
              <ThemedText style={styles.rewardCardTitle} numberOfLines={2}>
                {card.title}
              </ThemedText>
              {card.unlocked ? (
                <ThemedText style={styles.rewardCardUnlocked}>{t("points.rewardUnlocked")}</ThemedText>
              ) : (
                <ThemedText style={styles.rewardCardThreshold}>
                  {t("points.reachPoints", { count: card.threshold.toLocaleString() })}
                </ThemedText>
              )}
            </View>
          ))}

          {rewardCards.length === 0 && (
            <View style={styles.rewardCardEmpty}>
              <Ionicons name="gift-outline" size={32} color={colors.textTertiary} />
              <ThemedText style={styles.emptyText}>{t("points.rewardsEmpty")}</ThemedText>
            </View>
          )}
        </ScrollView>

        {/* ── How to Earn Section ── */}
        <View style={styles.earnSection}>
          <ThemedText style={styles.sectionTitle}>{t("points.howToEarn")}</ThemedText>

          <View style={styles.earnList}>
            {earnActions.map((action: EarnActionOut) => (
              <View key={action.action_type} style={styles.earnRow}>
                <View style={styles.earnRowLeft}>
                  <View style={styles.earnIcon}>
                    <Ionicons
                      name={resolveEarnIcon(action)}
                      size={22}
                      color={colors.brand}
                    />
                  </View>
                  <View style={styles.earnInfo}>
                    <ThemedText style={styles.earnLabel}>{action.label}</ThemedText>
                    <ThemedText style={styles.earnDesc}>{action.description}</ThemedText>
                  </View>
                </View>
                <View style={styles.earnPointsBadge}>
                  <ThemedText style={styles.earnPointsText}>
                    +{action.points} pts
                  </ThemedText>
                </View>
              </View>
            ))}

            {earnActions.length === 0 && (
              <View style={styles.emptyEarn}>
                <Ionicons name="sparkles-outline" size={32} color={colors.textTertiary} />
                <ThemedText style={styles.emptyText}>{t("points.loadingEarnActions")}</ThemedText>
              </View>
            )}
          </View>
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

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hidden: {
    display: "none",
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ── Hero Progress Ring ──
  heroSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 8,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ringSvg: {
    position: "absolute",
  },
  ringCenter: {
    alignItems: "center",
  },
  ringPoints: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -1,
  },
  ringLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 2,
  },
  tierInfo: {
    alignItems: "center",
    marginTop: 20,
  },
  tierName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  tierSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 4,
  },

  // ── Quick Stats Card ──
  statsCardWrap: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  statsCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statsCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(25, 79, 240, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsCardLabel: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  statsCardValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: 2,
  },
  statsCardRight: {
    alignItems: "flex-end",
  },
  statsCardPct: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.brand,
    marginTop: 2,
  },

  // ── Section header row ──
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  viewAllBtn: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brand,
  },

  // ── Milestone Rewards Carousel ──
  carousel: {
    marginBottom: 32,
  },
  carouselContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  rewardCard: {
    width: 160,
    gap: 10,
  },
  rewardCardLocked: {
    opacity: 0.5,
  },
  rewardCardImage: {
    width: 160,
    height: 160,
    borderRadius: 16,
    backgroundColor: "rgba(25, 79, 240, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(25, 79, 240, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardCardImageLocked: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  rewardUnlockedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 18,
  },
  rewardCardUnlocked: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.success,
  },
  rewardCardThreshold: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  rewardCardEmpty: {
    width: 200,
    height: 160,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  // ── How to Earn ──
  earnSection: {
    paddingHorizontal: 16,
  },
  earnList: {
    marginTop: 14,
    gap: 12,
  },
  earnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  earnRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  earnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(25, 79, 240, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  earnInfo: {
    flex: 1,
  },
  earnLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  earnDesc: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  earnPointsBadge: {
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  earnPointsText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },

  // Empty state
  emptyEarn: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: "center",
  },
});
