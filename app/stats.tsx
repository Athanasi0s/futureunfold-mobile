import { FeatureGate } from "@/components/feature-gate";
import { getSpeakers } from "@/api/features/program";
import { getUsers } from "@/api/features/user";
import {
  GROUP_TYPE_COLORS,
  PODIUM_CHART_COLORS,
  ROLE_COLORS,
  STATS_PIE_COLORS,
} from "@/constants/data-colors";
import { useGetGroups } from "@/features/home/hooks/useGetGroups";
import { useGetProgram } from "@/features/home/hooks/useGetProgram";
import { useGetVenues } from "@/features/home/hooks/useGetVenues";
import { useLeaderboard } from "@/features/points/hooks";
import { useColors } from "@/hooks/use-colors";
import { Colors } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { useTranslation } from "react-i18next";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

type AppColors = typeof Colors.light;

const SCREEN_WIDTH = Dimensions.get("window").width;
// Content padding 16 * 2 = 32, card padding 16 * 2 = 32
const CHART_WIDTH = SCREEN_WIDTH - 64;

function rankLabel(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function truncate(str: string, max = 7) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | undefined;
  color: string;
  colors: AppColors;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      {value === undefined ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <ThemedText style={[styles.statValue, { color: colors.textPrimary }]}>
          {value}
        </ThemedText>
      )}
      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </ThemedText>
    </View>
  );
}

function SectionCard({ children, colors }: { children: React.ReactNode; colors: AppColors }) {
  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
      ]}
    >
      {children}
    </View>
  );
}

function Divider({ colors }: { colors: AppColors }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StatsScreen() {
  return (
    <FeatureGate flag="festival_stats">
      <StatsContent />
    </FeatureGate>
  );
}

function StatsContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const {
    data: sessions = [],
    refetch: refetchProgram,
    isLoading: loadingSessions,
  } = useGetProgram();
  const {
    data: groups = [],
    refetch: refetchGroups,
    isLoading: loadingGroups,
  } = useGetGroups();
  const { data: venues = [], refetch: refetchVenues } = useGetVenues();
  const { data: leaderboard = [], refetch: refetchLeaderboard } = useLeaderboard(10);

  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ["stats-users-total"],
    queryFn: () => getUsers({ page: 1, page_size: 1 }),
  });

  const { data: onlineData, refetch: refetchOnline } = useQuery({
    queryKey: ["stats-users-online"],
    queryFn: () => getUsers({ available_now: true, page: 1, page_size: 1 }),
  });

  const { data: speakers = [], refetch: refetchSpeakers } = useQuery({
    queryKey: ["stats-speakers"],
    queryFn: getSpeakers,
  });

  // ─── Derived data ────────────────────────────────────────────────────────

  const topGroups = useMemo(
    () => [...groups].sort((a, b) => b.member_count - a.member_count).slice(0, 5),
    [groups],
  );

  // PieChart data — topic groups: top 5 individually + "Rest"
  const topicGroupPieData = useMemo(() => {
    // Merge groups with the same title by summing their member counts
    const merged = groups
      .filter((g) => g.group_type === "topic")
      .reduce<Record<string, number>>((acc, g) => {
        acc[g.title] = (acc[g.title] ?? 0) + g.member_count;
        return acc;
      }, {});

    const topicGroups = Object.entries(merged)
      .map(([title, count]) => ({ title, member_count: count }))
      .sort((a, b) => b.member_count - a.member_count);

    const top5 = topicGroups.slice(0, 5);
    const rest = topicGroups.slice(5);
    const restTotal = rest.reduce((sum, g) => sum + g.member_count, 0);

    const slices = top5.map((g, i) => ({
      value: g.member_count,
      color: STATS_PIE_COLORS[i],
      label: g.title,
    }));

    if (restTotal > 0) {
      slices.push({ value: restTotal, color: STATS_PIE_COLORS[5], label: "Rest" });
    }

    return slices;
  }, [groups]);

  // BarChart data — sessions by topic (top 7)
  const topicBarData = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach((s) => {
      s.topic_tags?.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([topic, count]) => ({
        value: count,
        label: truncate(topic),
        frontColor: colors.primary,
        topLabelComponent: () => (
          <ThemedText style={{ color: colors.textSecondary, fontSize: 10, marginBottom: 2 }}>
            {count}
          </ThemedText>
        ),
      }));
  }, [sessions, colors.primary, colors.textSecondary]);

  // BarChart data — leaderboard top 5
  const leaderBarData = useMemo(
    () =>
      leaderboard.slice(0, 6).map((entry, i) => ({
        value: entry.points,
        label: truncate((entry.full_name || "?").split(" ")[0], 6),
        frontColor:
          i === 0
            ? PODIUM_CHART_COLORS.first
            : i === 1
              ? PODIUM_CHART_COLORS.second
              : i === 2
                ? PODIUM_CHART_COLORS.third
                : colors.primary,
        topLabelComponent: () => (
          <ThemedText style={{ color: colors.textSecondary, fontSize: 10, marginBottom: 2 }}>
            {entry.points}
          </ThemedText>
        ),
      })),
    [leaderboard, colors.primary, colors.textSecondary],
  );

  // ─── Refresh ─────────────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchProgram(),
      refetchGroups(),
      refetchVenues(),
      refetchLeaderboard(),
      refetchUsers(),
      refetchOnline(),
      refetchSpeakers(),
    ]);
    setRefreshing(false);
  }, [
    refetchProgram,
    refetchGroups,
    refetchVenues,
    refetchLeaderboard,
    refetchUsers,
    refetchOnline,
    refetchSpeakers,
  ]);

  // ─── Chart shared props ───────────────────────────────────────────────────

  const barChartBaseProps = {
    barBorderRadius: 5,
    yAxisColor: "transparent",
    xAxisColor: "transparent",
    yAxisTextStyle: { color: colors.textSecondary, fontSize: 10 },
    xAxisLabelTextStyle: { color: colors.textSecondary, fontSize: 10 },
    noOfSections: 3,
    isAnimated: true,
    hideRules: true,
    width: CHART_WIDTH,
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.cardBackground }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t("festival.stats.title")}
        </ThemedText>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Overview cards ─────────────────────────────────────────── */}
        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t("festival.stats.overview")}
        </ThemedText>
        <View style={styles.overviewGrid}>
          <StatCard
            icon="calendar-outline"
            label={t("festival.stats.sessions")}
            value={loadingSessions ? undefined : sessions.length}
            color={colors.lightBlue}
            colors={colors}
          />
          <StatCard
            icon="people-outline"
            label={t("festival.stats.groups")}
            value={loadingGroups ? undefined : groups.length}
            color={colors.success}
            colors={colors}
          />
          <StatCard
            icon="mic-outline"
            label={t("festival.stats.speakers")}
            value={speakers.length}
            color={colors.primary}
            colors={colors}
          />
          <StatCard
            icon="location-outline"
            label={t("festival.stats.venues")}
            value={venues.length}
            color={colors.warning}
            colors={colors}
          />
        </View>

        {/* ── Users ──────────────────────────────────────────────────── */}
        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t("festival.stats.users")}
        </ThemedText>
        <SectionCard colors={colors}>
          <View style={styles.userRow}>
            <View style={[styles.userIconWrap, { backgroundColor: colors.lightBlue + "22" }]}>
              <Ionicons name="person-outline" size={16} color={colors.lightBlue} />
            </View>
            <ThemedText style={[styles.userLabel, { color: colors.text }]}>
              {t("festival.stats.totalRegistered")}
            </ThemedText>
            <ThemedText style={[styles.userValue, { color: colors.textPrimary }]}>
              {usersData?.total ?? "—"}
            </ThemedText>
          </View>
          <Divider colors={colors} />
          <View style={styles.userRow}>
            <View style={[styles.userIconWrap, { backgroundColor: colors.success + "22" }]}>
              <Ionicons name="radio-button-on-outline" size={16} color={colors.success} />
            </View>
            <ThemedText style={[styles.userLabel, { color: colors.text }]}>
              {t("festival.stats.availableNow")}
            </ThemedText>
            <ThemedText style={[styles.userValue, { color: colors.textPrimary }]}>
              {onlineData?.total ?? "—"}
            </ThemedText>
          </View>
        </SectionCard>

        {/* ── Top Groups list ─────────────────────────────────────────── */}
        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t("festival.stats.topGroups")}
        </ThemedText>
        <SectionCard colors={colors}>
          {topGroups.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t("festival.stats.noGroups")}
            </ThemedText>
          ) : (
            topGroups.map((group, index) => (
              <View key={group.id}>
                {index > 0 && <Divider colors={colors} />}
                <View style={styles.groupRow}>
                  <ThemedText style={[styles.groupRank, { color: colors.primary }]}>
                    #{index + 1}
                  </ThemedText>
                  <View style={styles.groupInfo}>
                    <ThemedText
                      style={[styles.groupName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {group.title}
                    </ThemedText>
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor:
                            (GROUP_TYPE_COLORS[group.group_type] ?? colors.textTertiary) +
                            "22",
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.typeBadgeText,
                          {
                            color:
                              GROUP_TYPE_COLORS[group.group_type] ??
                              colors.textTertiary,
                          },
                        ]}
                      >
                        {group.group_type}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.memberBadge}>
                    <Ionicons name="people" size={13} color={colors.textSecondary} />
                    <ThemedText style={[styles.memberCount, { color: colors.textSecondary }]}>
                      {group.member_count}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))
          )}
        </SectionCard>

        {/* ── Groups by Topic — PieChart ──────────────────────────────── */}
        {topicGroupPieData.length > 0 && (
          <>
            <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t("festival.stats.groupsByTopic")}
            </ThemedText>
            <SectionCard colors={colors}>
              <View style={styles.pieWrapper}>
                <PieChart
                  data={topicGroupPieData}
                  donut
                  radius={90}
                  innerRadius={60}
                  isAnimated
                  animationDuration={600}
                  centerLabelComponent={() => (
                    <View style={styles.pieCenterLabel}>
                      <ThemedText style={[styles.pieCenterValue, { color: colors.textPrimary }]}>
                        {topicGroupPieData.reduce((s, d) => s + d.value, 0)}
                      </ThemedText>
                      <ThemedText style={[styles.pieCenterSub, { color: colors.textSecondary }]}>
                        {t("festival.stats.membersUnit")}
                      </ThemedText>
                    </View>
                  )}
                />
                <View style={styles.pieLegend}>
                  {topicGroupPieData.map((d) => (
                    <View key={d.label} style={styles.pieLegendItem}>
                      <View style={[styles.pieLegendDot, { backgroundColor: d.color }]} />
                      <ThemedText
                        style={[styles.pieLegendLabel, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {d.label}
                      </ThemedText>
                      <ThemedText style={[styles.pieLegendValue, { color: colors.textPrimary }]}>
                        {d.value}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </SectionCard>
          </>
        )}

        {/* ── Sessions by Topic — BarChart ────────────────────────────── */}
        {topicBarData.length > 0 && (
          <>
            <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t("festival.stats.sessionsByTopic")}
            </ThemedText>
            <SectionCard colors={colors}>
              <View style={styles.chartPad}>
                <BarChart
                  data={topicBarData}
                  barWidth={CHART_WIDTH / (topicBarData.length * 2 + 1)}
                  {...barChartBaseProps}
                />
              </View>
            </SectionCard>
          </>
        )}

        {/* ── Points Leaderboard — BarChart + list ────────────────────── */}
        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t("festival.stats.leaderboard")}
        </ThemedText>

        {leaderBarData.length > 0 && (
          <SectionCard colors={colors}>
            <View style={styles.chartPad}>
              <BarChart
                data={leaderBarData}
                barWidth={CHART_WIDTH / (leaderBarData.length * 2 + 1)}
                {...barChartBaseProps}
              />
            </View>
          </SectionCard>
        )}

        <SectionCard colors={colors}>
          {leaderboard.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t("festival.stats.noData")}
            </ThemedText>
          ) : (
            leaderboard.map((entry, index) => (
              <View key={entry.user_id}>
                {index > 0 && <Divider colors={colors} />}
                <View style={styles.leaderRow}>
                  <ThemedText style={styles.medal}>{rankLabel(entry.rank)}</ThemedText>
                  <View style={styles.leaderInfo}>
                    <ThemedText
                      style={[styles.leaderName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {entry.full_name}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.leaderRole,
                        { color: ROLE_COLORS[entry.role] ?? colors.textSecondary },
                      ]}
                    >
                      {entry.role}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.leaderPoints, { color: colors.primary }]}>
                    {entry.points} {t("festival.stats.ptsUnit")}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </SectionCard>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
  backBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  content: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 6,
  },

  // Stat grid
  overviewGrid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    gap: 6,
  },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 11, textAlign: "center" },

  // Section card
  sectionCard: { borderRadius: 14, paddingHorizontal: 16, borderWidth: 1 },
  divider: { height: StyleSheet.hairlineWidth, opacity: 0.5 },
  emptyText: { textAlign: "center", paddingVertical: 20, fontSize: 14 },

  // Chart padding
  chartPad: { paddingVertical: 16, paddingRight: 8 },

  // Users
  userRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  userIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  userLabel: { flex: 1, fontSize: 15 },
  userValue: { fontSize: 20, fontWeight: "700" },

  // Groups list
  groupRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10 },
  groupRank: { width: 28, fontSize: 13, fontWeight: "700" },
  groupInfo: { flex: 1, gap: 4 },
  groupName: { fontSize: 14, fontWeight: "600" },
  typeBadge: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  memberBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  memberCount: { fontSize: 13 },

  // Pie chart
  pieWrapper: { paddingVertical: 20, alignItems: "center", gap: 20 },
  pieCenterLabel: { alignItems: "center" },
  pieCenterValue: { fontSize: 24, fontWeight: "700" },
  pieCenterSub: { fontSize: 12, marginTop: 2 },
  pieLegend: { gap: 8, width: "100%" },
  pieLegendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  pieLegendDot: { width: 10, height: 10, borderRadius: 5 },
  pieLegendLabel: { flex: 1, fontSize: 14 },
  pieLegendValue: { fontSize: 14, fontWeight: "600" },

  // Leaderboard
  leaderRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  medal: { fontSize: 20, width: 36, textAlign: "center" },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 14, fontWeight: "600" },
  leaderRole: { fontSize: 12, textTransform: "capitalize", marginTop: 2 },
  leaderPoints: { fontSize: 14, fontWeight: "700" },

  bottomPad: { height: 20 },
});
