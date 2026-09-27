import { useConfigStore } from "@/features/config/stores/config-store";
import { useScanHistory } from "@/features/points/hooks";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart, PieChart } from "react-native-gifted-charts";

import { LEAD_SCORE_COLORS } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
const SCREEN_WIDTH = Dimensions.get("window").width;
// horizontal padding 16*2=32, card padding 16*2=32
const CHART_WIDTH = SCREEN_WIDTH - 64;

const TIER_COLORS = {
  hot: LEAD_SCORE_COLORS.hot.color,
  vip: LEAD_SCORE_COLORS.vip.color,
  followup: LEAD_SCORE_COLORS.followup.color,
  lead: LEAD_SCORE_COLORS.lead.color,
};

function isToday(isoDate: string) {
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function dayLabelShort(daysAgo: number, todayLabel: string, yestLabel: string) {
  if (daysAgo === 0) return todayLabel;
  if (daysAgo === 1) return yestLabel;
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en", { weekday: "short" });
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string | undefined;
  color: string;
  loading?: boolean;
}) {
  const colors = useColors();
  const styles = getStyles(colors);
  return (
    <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: "rgba(255,255,255,0.06)" }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <ThemedText style={[styles.statValue, { color: COLOR_WHITE_ON_ACCENT }]}>{value ?? "—"}</ThemedText>
      )}
      <ThemedText style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</ThemedText>
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const styles = getStyles(colors);
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: "rgba(255,255,255,0.06)" }]}>
      {children}
    </View>
  );
}

function Divider() {
  const colors = useColors();
  const styles = getStyles(colors);
  return <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.07)" }]} />;
}

function SectionTitle({ label }: { label: string }) {
  const colors = useColors();
  const styles = getStyles(colors);
  return <ThemedText style={styles.sectionTitle}>{label}</ThemedText>;
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function ReportScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const appName = useConfigStore((s) => s.appName);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data: scanHistory = [], refetch, isLoading } = useScanHistory("scanned_by_me");

  // ─── Derived stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = scanHistory.length;
    const totalPoints = scanHistory.reduce((s, l) => s + l.points_awarded, 0);
    const hot = scanHistory.filter((l) => l.points_awarded >= 20).length;
    const todayCount = scanHistory.filter((l) => isToday(l.created_at)).length;
    return { total, totalPoints, hot, todayCount };
  }, [scanHistory]);

  const tierPieData = useMemo(() => {
    const hot = scanHistory.filter((l) => l.points_awarded >= 20).length;
    const vip = scanHistory.filter((l) => l.points_awarded >= 10 && l.points_awarded < 20).length;
    const followup = scanHistory.filter((l) => l.points_awarded >= 5 && l.points_awarded < 10).length;
    const lead = scanHistory.filter((l) => l.points_awarded < 5).length;

    const slices = [
      { value: hot, color: TIER_COLORS.hot, label: t("exhibitor.report.tierHot") },
      { value: vip, color: TIER_COLORS.vip, label: t("exhibitor.report.tierVip") },
      { value: followup, color: TIER_COLORS.followup, label: t("exhibitor.report.tierFollowUp") },
      { value: lead, color: TIER_COLORS.lead, label: t("exhibitor.report.tierLead") },
    ].filter((s) => s.value > 0);

    return slices;
  }, [scanHistory, t]);

  // Scans per day — last 7 days
  const dailyBarData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const daysAgo = 6 - i;
      const target = new Date();
      target.setDate(target.getDate() - daysAgo);
      const count = scanHistory.filter((l) => {
        const d = new Date(l.created_at);
        return (
          d.getFullYear() === target.getFullYear() &&
          d.getMonth() === target.getMonth() &&
          d.getDate() === target.getDate()
        );
      }).length;
      return {
        value: count,
        label: dayLabelShort(daysAgo, t("exhibitor.report.today"), t("exhibitor.report.chartYest")),
        frontColor: daysAgo === 0 ? colors.brand : (colors.brand + "66"),
        topLabelComponent: () =>
          count > 0 ? (
            <ThemedText style={{ color: colors.textTertiary, fontSize: 10, marginBottom: 2 }}>{count}</ThemedText>
          ) : null,
      };
    });
  }, [scanHistory, colors.brand, colors.textTertiary, t]);

  const topLeads = useMemo(
    () => [...scanHistory].sort((a, b) => b.points_awarded - a.points_awarded).slice(0, 5),
    [scanHistory],
  );

  const recentScans = useMemo(
    () => [...scanHistory].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
    [scanHistory],
  );

  // ─── Refresh ──────────────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ─── Shared chart props ───────────────────────────────────────────────────

  const barChartBaseProps = {
    barBorderRadius: 5,
    yAxisColor: "transparent",
    xAxisColor: "transparent",
    yAxisTextStyle: { color: colors.textTertiary, fontSize: 10 },
    xAxisLabelTextStyle: { color: colors.textTertiary, fontSize: 10 },
    noOfSections: 3,
    isAnimated: true,
    hideRules: true,
    width: CHART_WIDTH,
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
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
          <View>
            <ThemedText style={styles.headerTitle}>{t("exhibitor.report.title")}</ThemedText>
            <ThemedText style={styles.headerSubtitle}>{t("exhibitor.report.subtitle", { appName })}</ThemedText>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        }
      >
        {/* ── Overview cards ─────────────────────────────────────────── */}
        <SectionTitle label={t("exhibitor.report.overview")} />
        <View style={styles.overviewGrid}>
          <StatCard
            icon="people-outline"
            label={t("exhibitor.report.totalLeads")}
            value={stats.total}
            color={colors.brand}
            loading={isLoading}
          />
          <StatCard
            icon="star-outline"
            label={t("exhibitor.report.ptsAwarded")}
            value={stats.totalPoints}
            color={colors.warning}
            loading={isLoading}
          />
          <StatCard
            icon="flame-outline"
            label={t("exhibitor.report.hotLeads")}
            value={stats.hot}
            color={colors.error}
            loading={isLoading}
          />
          <StatCard
            icon="today-outline"
            label={t("exhibitor.report.today")}
            value={stats.todayCount}
            color={colors.followUp}
            loading={isLoading}
          />
        </View>

        {/* ── Lead Tier Breakdown ─────────────────────────────────────── */}
        {tierPieData.length > 0 && (
          <>
            <SectionTitle label={t("exhibitor.report.tierBreakdown")} />
            <SectionCard>
              <View style={styles.pieWrapper}>
                <PieChart
                  data={tierPieData}
                  donut
                  radius={90}
                  innerRadius={60}
                  isAnimated
                  animationDuration={600}
                  centerLabelComponent={() => (
                    <View style={styles.pieCenterLabel}>
                      <ThemedText style={[styles.pieCenterValue, { color: COLOR_WHITE_ON_ACCENT }]}>
                        {stats.total}
                      </ThemedText>
                      <ThemedText style={[styles.pieCenterSub, { color: colors.textTertiary }]}>{t("exhibitor.report.leadsUnit")}</ThemedText>
                    </View>
                  )}
                />
                <View style={styles.pieLegend}>
                  {tierPieData.map((d) => (
                    <View key={d.label} style={styles.pieLegendItem}>
                      <View style={[styles.pieLegendDot, { backgroundColor: d.color }]} />
                      <ThemedText style={[styles.pieLegendLabel, { color: colors.textSecondary }]}>{d.label}</ThemedText>
                      <ThemedText style={[styles.pieLegendValue, { color: COLOR_WHITE_ON_ACCENT }]}>{d.value}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </SectionCard>
          </>
        )}

        {/* ── Scans Over Time ─────────────────────────────────────────── */}
        <SectionTitle label={t("exhibitor.report.scansChart")} />
        <SectionCard>
          <View style={styles.chartPad}>
            <BarChart
              data={dailyBarData}
              barWidth={CHART_WIDTH / (dailyBarData.length * 2 + 1)}
              {...barChartBaseProps}
            />
          </View>
        </SectionCard>

        {/* ── Top Leads ───────────────────────────────────────────────── */}
        <SectionTitle label={t("exhibitor.report.topLeads")} />
        <SectionCard>
          {topLeads.length === 0 ? (
            <ThemedText style={styles.emptyText}>{t("exhibitor.report.emptyLeads")}</ThemedText>
          ) : (
            topLeads.map((lead, index) => {
              const tierColor =
                lead.points_awarded >= 20
                  ? TIER_COLORS.hot
                  : lead.points_awarded >= 10
                  ? TIER_COLORS.vip
                  : lead.points_awarded >= 5
                  ? TIER_COLORS.followup
                  : TIER_COLORS.lead;
              return (
                <View key={lead.id}>
                  {index > 0 && <Divider />}
                  <View style={styles.leadRow}>
                    <ThemedText style={[styles.leadRank, { color: colors.brand }]}>#{index + 1}</ThemedText>
                    <View style={styles.leadAvatar}>
                      <Ionicons name="person" size={16} color={colors.brand} />
                    </View>
                    <ThemedText style={styles.leadName} numberOfLines={1}>
                      {lead.scanned_name}
                    </ThemedText>
                    <View style={[styles.ptsBadge, { backgroundColor: tierColor + "22" }]}>
                      <ThemedText style={[styles.ptsBadgeText, { color: tierColor }]}>
                        +{lead.points_awarded} pts
                      </ThemedText>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </SectionCard>

        {/* ── Recent Activity ─────────────────────────────────────────── */}
        {recentScans.length > 0 && (
          <>
            <SectionTitle label={t("exhibitor.report.recentActivity")} />
            <SectionCard>
              {recentScans.map((scan, index) => (
                <View key={scan.id}>
                  {index > 0 && <Divider />}
                  <View style={styles.activityRow}>
                    <View style={[styles.activityDot, { backgroundColor: colors.brand + "44" }]}>
                      <Ionicons name="qr-code-outline" size={14} color={colors.brand} />
                    </View>
                    <View style={styles.activityInfo}>
                      <ThemedText style={styles.activityName} numberOfLines={1}>
                        {scan.scanned_name}
                      </ThemedText>
                      <ThemedText style={styles.activityTime}>{(() => {
                        const diff = Date.now() - new Date(scan.created_at).getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 1) return t("exhibitor.report.timeJustNow");
                        if (mins < 60) return `${mins}${t("exhibitor.report.timeMago")}`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `${hrs}${t("exhibitor.report.timeHago")}`;
                        return `${Math.floor(hrs / 24)}${t("exhibitor.report.timeDago")}`;
                      })()}</ThemedText>
                    </View>
                    <ThemedText style={[styles.activityPts, { color: colors.warning }]}>
                      +{scan.points_awarded}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </SectionCard>
          </>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfacePrimary },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },
  headerSafe: {
    backgroundColor: colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: COLOR_WHITE_ON_ACCENT },
  headerSubtitle: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },

  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 10 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textTertiary,
    marginTop: 4,
  },

  // Stat grid
  overviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: (SCREEN_WIDTH - 32 - 10) / 2,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    gap: 6,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 24, fontWeight: "700" },
  statLabel: { fontSize: 12, textAlign: "center" },

  // Section card
  sectionCard: { borderRadius: 14, paddingHorizontal: 16, borderWidth: 1 },
  divider: { height: StyleSheet.hairlineWidth },
  emptyText: {
    color: colors.textTertiary,
    textAlign: "center",
    paddingVertical: 20,
    fontSize: 14,
  },

  // Chart
  chartPad: { paddingVertical: 16, paddingRight: 8 },

  // Pie chart
  pieWrapper: { paddingVertical: 20, alignItems: "center", gap: 20 },
  pieCenterLabel: { alignItems: "center" },
  pieCenterValue: { fontSize: 26, fontWeight: "700" },
  pieCenterSub: { fontSize: 12, marginTop: 2 },
  pieLegend: { gap: 8, width: "100%" },
  pieLegendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  pieLegendDot: { width: 10, height: 10, borderRadius: 5 },
  pieLegendLabel: { flex: 1, fontSize: 14 },
  pieLegendValue: { fontSize: 14, fontWeight: "600" },

  // Top leads
  leadRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10 },
  leadRank: { width: 26, fontSize: 13, fontWeight: "700" },
  leadAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(25,79,240,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  leadName: { flex: 1, fontSize: 14, fontWeight: "600", color: COLOR_WHITE_ON_ACCENT },
  ptsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ptsBadgeText: { fontSize: 12, fontWeight: "700" },

  // Recent activity
  activityRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  activityDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 14, fontWeight: "600", color: COLOR_WHITE_ON_ACCENT },
  activityTime: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  activityPts: { fontSize: 14, fontWeight: "700" },

  bottomPad: { height: 20 },
});
