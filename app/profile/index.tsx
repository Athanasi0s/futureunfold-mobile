import type { PointTransactionOut } from "@/api/schemas";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { useProfileWrapup } from "@/features/points/hooks";
import { useGetConnections } from "@/features/scheduling/hooks";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
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
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

// ACTION_LABELS are now resolved via i18n inside the component

// ============================================
// COMPONENT
// ============================================

import { AVATAR_PALETTE } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
export default function FestivalWrapupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: wrapup, refetch: refetchWrapup } = useProfileWrapup();
  const { data: connectionsData, refetch: refetchConnections } = useGetConnections();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refetchWrapup(), refetchConnections()]).finally(() =>
      setRefreshing(false),
    );
  }, [refetchWrapup, refetchConnections]);

  const percentile = wrapup?.percentile_rank ?? 0;
  const topPct = Math.max(1, Math.round(100 - percentile));
  const sessionsAttended = wrapup?.sessions_attended ?? 0;
  const totalHours = wrapup?.total_hours ?? 0;
  const groupsJoined = wrapup?.groups_joined ?? 0;
  const totalScans = wrapup?.total_scans ?? 0;
  const timeline = wrapup?.milestone_timeline ?? [];
  const certificateEligible = wrapup?.certificate_eligible ?? false;

  const sessionsTarget = 15; // target for progress bar display
  const sessionsProgress = Math.min(sessionsAttended / sessionsTarget, 1);

  const formatTimelineLabel = (txn: PointTransactionOut) => {
    const key = `points.actionLabels.${txn.action_type}`;
    const translated = t(key as any);
    return translated !== key ? translated : txn.action_type.replace(/_/g, " ");
  };

  const formatTimelineDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}

      {/* Header */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackBtn}
          >
            <Ionicons name="chevron-back" size={24} color={COLOR_WHITE_ON_ACCENT} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("profile.wrapupTitle")}</ThemedText>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() =>
              Alert.alert(t("profile.share"), t("profile.shareComingSoon"))
            }
          >
            <Ionicons name="share-outline" size={22} color={COLOR_WHITE_ON_ACCENT} />
          </TouchableOpacity>
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
        {/* Profile Hero */}
        <View style={styles.heroSection}>
          {/* Avatar */}
          <View style={styles.avatarGlow}>
            <View style={styles.avatarCircle}>
              <ThemedText style={styles.avatarText}>
                {(user?.full_name ?? "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </ThemedText>
            </View>
          </View>

          {/* Greeting */}
          <ThemedText style={styles.heroGreeting}>
            {t("profile.heroGreeting", { firstName: user?.full_name?.split(" ")[0] ?? "Explorer" })}
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            {t("profile.heroSubtitle", { topPct })}
          </ThemedText>

          {/* Badge pill */}
          <View style={styles.heroBadge}>
            <Ionicons name="star" size={14} color={colors.brand} />
            <ThemedText style={styles.heroBadgeText}>
              {topPct <= 5
                ? t("profile.heroBadgeTechVisionary")
                : topPct <= 20
                  ? t("profile.heroBadgeInnovator")
                  : t("profile.heroBadgeExplorer")}
            </ThemedText>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>{t("profile.statExhibitorsVisited")}</ThemedText>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>{totalScans}</ThemedText>
            </View>
            <Ionicons
              name="storefront-outline"
              size={20}
              color={colors.brand}
              style={styles.statIcon}
            />
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>{t("profile.statTotalHours")}</ThemedText>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>{totalHours}h</ThemedText>
            </View>
            <Ionicons
              name="timer-outline"
              size={20}
              color={colors.brand}
              style={styles.statIcon}
            />
          </View>
        </View>

        {/* Sessions Attended Progress */}
        <View style={styles.sessionsCard}>
          <View style={styles.sessionsHeader}>
            <View>
              <ThemedText style={styles.sessionsTitle}>{t("profile.sessionsAttended")}</ThemedText>
              <ThemedText style={styles.sessionsSubtitle}>
                {sessionsAttended >= sessionsTarget
                  ? t("profile.sessionsGoldReached")
                  : t("profile.sessionsAlmostGold")}
              </ThemedText>
            </View>
            <ThemedText style={styles.sessionsCount}>
              {sessionsAttended}/{sessionsTarget}
            </ThemedText>
          </View>
          <View style={styles.sessionsBarBg}>
            <View
              style={[
                styles.sessionsBarFill,
                { width: `${sessionsProgress * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* New Connections */}
        <ThemedText style={styles.sectionTitle}>{t("profile.sectionNewConnections")}</ThemedText>
        <View style={styles.connectionsRow}>
          <View style={styles.avatarStack}>
            {(connectionsData?.users ?? []).slice(0, 5).map((c, i) => {
              const initials = c.user_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const COLORS = [colors.brand, ...AVATAR_PALETTE.slice(0, 4)];
              return (
                <View
                  key={c.user_id}
                  style={[
                    styles.connectionAvatar,
                    { backgroundColor: COLORS[i % COLORS.length], marginLeft: i === 0 ? 0 : -16 },
                  ]}
                >
                  <ThemedText style={styles.connectionInitials}>{initials}</ThemedText>
                </View>
              );
            })}
            {(connectionsData?.total ?? 0) > 5 && (
              <View
                style={[
                  styles.connectionAvatar,
                  { backgroundColor: colors.brand, marginLeft: -16 },
                ]}
              >
                <ThemedText style={styles.connectionInitials}>
                  +{(connectionsData?.total ?? 0) - 5}
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={styles.connectionsText}>
            {t("profile.totalContactsSynced", { count: connectionsData?.total ?? 0 })}
          </ThemedText>
        </View>

        {/* Key Milestones Timeline */}
        <ThemedText style={styles.sectionTitle}>{t("profile.sectionKeyMilestones")}</ThemedText>
        <View style={styles.timeline}>
          {/* Timeline line */}
          {timeline.length > 0 && <View style={styles.timelineLine} />}

          {timeline.map((txn) => (
            <View key={txn.id} style={styles.timelineItem}>
              {/* Dot */}
              <View style={styles.timelineDot} />
              {/* Content */}
              <View style={styles.timelineContent}>
                <ThemedText style={styles.timelineLabel}>
                  {formatTimelineLabel(txn)}
                  {txn.source_ref ? `: ${txn.source_ref}` : ""}
                </ThemedText>
                <ThemedText style={styles.timelineDate}>
                  {formatTimelineDate(txn.created_at)}
                </ThemedText>
                <ThemedText style={styles.timelinePoints}>
                  +{txn.points_amount} pts
                </ThemedText>
              </View>
            </View>
          ))}

          {timeline.length === 0 && (
            <View style={styles.emptyTimeline}>
              <Ionicons name="flag-outline" size={40} color={colors.textTertiary} />
              <ThemedText style={styles.emptyText}>
                {t("profile.milestonesEmpty")}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Extra stats row */}
        <View style={styles.extraStats}>
          <View style={styles.extraStatItem}>
            <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
            <ThemedText style={styles.extraStatValue}>{groupsJoined}</ThemedText>
            <ThemedText style={styles.extraStatLabel}>{t("profile.extraGroupsJoined")}</ThemedText>
          </View>
          <View style={styles.extraStatDivider} />
          <View style={styles.extraStatItem}>
            <Ionicons name="qr-code-outline" size={20} color={colors.textSecondary} />
            <ThemedText style={styles.extraStatValue}>{totalScans}</ThemedText>
            <ThemedText style={styles.extraStatLabel}>{t("profile.extraTotalScans")}</ThemedText>
          </View>
        </View>

        {/* Spacer for sticky footer */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Sticky Footer CTA */}
      <View style={[styles.footerSection, { paddingBottom: insets.bottom + 32 }]}>
        <TouchableOpacity
          style={styles.rewardsBtn}
          onPress={() => router.push("/profile/rewards-dashboard" as any)}
        >
          <Ionicons name="star-outline" size={20} color={colors.brand} />
          <ThemedText style={styles.rewardsBtnText}>{t("profile.progressRewards")}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.certificateBtn,
            !certificateEligible && styles.certificateBtnDisabled,
          ]}
          onPress={() => {
            if (certificateEligible) {
              router.push("/certificate" as never);
            } else {
              Alert.alert(
                t("profile.notEligibleTitle"),
                t("profile.notEligibleMessage"),
              );
            }
          }}
        >
          <Ionicons
            name="download-outline"
            size={20}
            color={certificateEligible ? COLOR_WHITE_ON_ACCENT : colors.textTertiary}
          />
          <ThemedText
            style={[
              styles.certificateBtnText,
              !certificateEligible && styles.certificateBtnTextDisabled,
            ]}
          >
            {t("profile.downloadCertificate")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingVertical: 6,
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

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Hero
  heroSection: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  avatarGlow: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.brand,
    borderWidth: 4,
    borderColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "800",
    color: COLOR_WHITE_ON_ACCENT,
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: "800",
    color: COLOR_WHITE_ON_ACCENT,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(25, 79, 240, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.brand,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  statValue: {
    fontSize: 30,
    fontWeight: "800",
    color: COLOR_WHITE_ON_ACCENT,
    letterSpacing: -0.5,
  },
  statIcon: {
    marginTop: 8,
  },

  // Sessions progress
  sessionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "rgba(25, 79, 240, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(25, 79, 240, 0.2)",
  },
  sessionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sessionsTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  sessionsSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.textSecondary,
    marginTop: 2,
  },
  sessionsCount: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.brand,
  },
  sessionsBarBg: {
    height: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 6,
    overflow: "hidden",
  },
  sessionsBarFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: colors.brand,
  },

  // Section titles
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },

  // Connections
  connectionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 8,
  },
  avatarStack: {
    flexDirection: "row",
  },
  connectionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.surfacePrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  connectionInitials: {
    fontSize: 13,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  connectionsText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    flex: 1,
  },

  // Timeline
  timeline: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    left: 31,
    top: 24,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  timelineItem: {
    flexDirection: "row",
    gap: 20,
    paddingBottom: 28,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.brand,
    marginTop: 4,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  timelineDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timelinePoints: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
    marginTop: 4,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignSelf: "flex-start",
    overflow: "hidden",
  },

  // Empty timeline
  emptyTimeline: {
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

  // Extra stats
  extraStats: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  extraStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  extraStatValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLOR_WHITE_ON_ACCENT,
  },
  extraStatLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textTertiary,
  },
  extraStatDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  // Footer
  footerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  certificateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  certificateBtnDisabled: {
    backgroundColor: colors.cardBackground,
    shadowOpacity: 0,
    elevation: 0,
  },
  certificateBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  certificateBtnTextDisabled: {
    color: colors.textTertiary,
  },

  rewardsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(25, 79, 240, 0.08)",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(25, 79, 240, 0.2)",
    marginBottom: 10,
  },
  rewardsBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.brand,
  },
});
