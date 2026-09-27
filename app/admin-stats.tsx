import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { useAdminStats } from "@/features/admin/hooks/useAdminStats";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart } from "react-native-gifted-charts";
import type { RoleBreakdown, InterestStat } from "@/features/admin/api";
import type { GroupRankingItem } from "@/api/schemas";
import { ADMIN_BAR_COLORS } from "@/constants/data-colors";

// ─── Color palette for role / chart bars ───
const BAR_COLORS = ADMIN_BAR_COLORS;

export default function AdminStatsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data, isLoading } = useAdminStats();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedBar, setSelectedBar] = useState<{ date: string; count: number } | null>(null);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{ headerShown: true, title: t("admin.stats.title") }}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  const maxInterestCount =
    data?.top_interests?.length ? data.top_interests[0].count : 1;

  const maxDailyCount =
    data?.daily_registrations?.length
      ? Math.max(...data.daily_registrations.map((d) => d.count))
      : 1;

  // Registration bar chart data for gifted-charts
  const regBarData = (data?.daily_registrations ?? []).map((d) => ({
    value: d.count,
    label: formatShortDate(d.date),
    frontColor: selectedBar?.date === d.date ? colors.primary : colors.primary + "99",
    onPress: () => setSelectedBar({ date: d.date, count: d.count }),
  }));

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: t("admin.stats.title") }}
      />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          {/* ── Overview Cards ── */}
          <SectionTitle text="Overview" styles={styles} />
          <View style={styles.row}>
            <StatCard
              icon="people"
              label={t("admin.stats.totalUsers")}
              value={data?.total_users ?? 0}
              color={colors.primary}
              styles={styles}
            />
            <StatCard
              icon="albums"
              label={t("admin.stats.totalGroups")}
              value={data?.total_groups ?? 0}
              color={colors.success}
              styles={styles}
            />
          </View>
          <View style={styles.row}>
            <StatCard
              icon="calendar"
              label={t("admin.stats.totalSessions")}
              value={data?.total_sessions ?? 0}
              color={colors.warning}
              styles={styles}
            />
            <StatCard
              icon="bar-chart"
              label="Polls"
              value={data?.total_polls ?? 0}
              color={colors.primary}
              styles={styles}
            />
          </View>

          {/* ── Demographics ── */}
          <SectionTitle text="Demographics" styles={styles} />
          <View style={styles.card}>
            {data?.demographics ? (
              <>
                {/* Age groups */}
                <ThemedText style={styles.demographicsSubTitle}>Age Groups</ThemedText>
                {data.demographics.age_groups.length > 0 ? (
                  <>
                    {(() => {
                      const maxCount = Math.max(...data.demographics!.age_groups.map((g) => g.count), 1);
                      return data.demographics!.age_groups.map((item, idx) => (
                        <DemographicsBar
                          key={item.group}
                          label={item.group}
                          count={item.count}
                          percentage={item.percentage}
                          maxCount={maxCount}
                          color={BAR_COLORS[idx % 4]}
                          styles={styles}
                        />
                      ));
                    })()}
                    <ThemedText style={styles.sampleSizeLabel}>
                      Based on {data.demographics.sample_size_dob}/{data.demographics.total_users} users
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText style={styles.emptyStateText}>
                    No demographic data yet. Percentages will appear once users provide this information.
                  </ThemedText>
                )}

                <View style={styles.demographicsDivider} />

                {/* Gender breakdown */}
                <ThemedText style={styles.demographicsSubTitle}>Gender Breakdown</ThemedText>
                {data.demographics.gender_breakdown.length > 0 ? (
                  <>
                    {(() => {
                      const maxCount = Math.max(...data.demographics!.gender_breakdown.map((g) => g.count), 1);
                      const genderLabels: Record<string, string> = {
                        male: "Male",
                        female: "Female",
                        prefer_not_to_say: "Prefer not to say",
                      };
                      return data.demographics!.gender_breakdown.map((item, idx) => (
                        <DemographicsBar
                          key={item.gender}
                          label={genderLabels[item.gender] ?? item.gender}
                          count={item.count}
                          percentage={item.percentage}
                          maxCount={maxCount}
                          color={BAR_COLORS[4 + (idx % 3)]}
                          styles={styles}
                        />
                      ));
                    })()}
                    <ThemedText style={styles.sampleSizeLabel}>
                      Based on {data.demographics.sample_size_gender}/{data.demographics.total_users} users
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText style={styles.emptyStateText}>
                    No demographic data yet. Percentages will appear once users provide this information.
                  </ThemedText>
                )}
              </>
            ) : (
              <ThemedText style={styles.emptyStateText}>
                No demographic data yet. Percentages will appear once users provide this information.
              </ThemedText>
            )}
          </View>

          {/* ── Role Distribution ── */}
          {data?.role_breakdown && data.role_breakdown.length > 0 && (
            <>
              <SectionTitle text="Role Distribution" styles={styles} />
              <View style={styles.card}>
                {data.role_breakdown.map((item, idx) => (
                  <RoleBar
                    key={item.role}
                    item={item}
                    color={BAR_COLORS[idx % BAR_COLORS.length]}
                    styles={styles}
                  />
                ))}
              </View>
            </>
          )}

          {/* ── Engagement Stats ── */}
          <SectionTitle text="Engagement" styles={styles} />
          <View style={styles.row}>
            <StatCard
              icon="chatbubbles"
              label="DMs Sent"
              value={data?.total_dms ?? 0}
              color={colors.lightBlue}
              styles={styles}
            />
            <StatCard
              icon="people-circle"
              label="Meetings"
              value={data?.total_meetings ?? 0}
              color={colors.followUp}
              styles={styles}
            />
          </View>
          <View style={styles.row}>
            <StatCard
              icon="qr-code"
              label="QR Scans"
              value={data?.total_qr_scans ?? 0}
              color={colors.primary}
              styles={styles}
            />
            <StatCard
              icon="bookmark"
              label="Agenda Saves"
              value={data?.total_agenda_saves ?? 0}
              color={colors.warning}
              styles={styles}
            />
          </View>

          {/* ── Points Stats ── */}
          <SectionTitle text="Points" styles={styles} />
          <View style={styles.row}>
            <StatCard
              icon="trophy"
              label="Avg Points"
              value={data?.avg_points ?? 0}
              color={colors.warning}
              styles={styles}
            />
            <StatCard
              icon="star"
              label="Max Points"
              value={data?.max_points ?? 0}
              color={colors.error}
              styles={styles}
            />
          </View>
          <View style={styles.row}>
            <StatCard
              icon="flame"
              label="Users w/ Points"
              value={data?.users_with_points ?? 0}
              color={colors.success}
              styles={styles}
            />
          </View>

          {/* ── Content Stats ── */}
          <SectionTitle text="Content" styles={styles} />
          <View style={styles.card}>
            <InfoRow
              label="Groups"
              value={String(data?.total_groups ?? 0)}
              styles={styles}
            />
            <InfoRow
              label="Avg Members / Group"
              value={String(data?.avg_members_per_group ?? 0)}
              styles={styles}
            />
            <InfoRow
              label="Total Memberships"
              value={String(data?.total_group_memberships ?? 0)}
              styles={styles}
            />
            <InfoRow
              label="Sessions"
              value={String(data?.total_sessions ?? 0)}
              styles={styles}
              isLast
            />
          </View>

          {/* ── Ticket Overview ── */}
          {(data?.total_tickets ?? 0) > 0 && (
            <>
              <SectionTitle text="Tickets" styles={styles} />
              <View style={styles.row}>
                <StatCard
                  icon="ticket"
                  label="Total"
                  value={data?.total_tickets ?? 0}
                  color={colors.primary}
                  styles={styles}
                />
                <StatCard
                  icon="checkmark-circle"
                  label="Used"
                  value={data?.used_tickets ?? 0}
                  color={colors.success}
                  styles={styles}
                />
              </View>
              <View style={styles.row}>
                <StatCard
                  icon="time"
                  label="Active"
                  value={data?.active_tickets ?? 0}
                  color={colors.warning}
                  styles={styles}
                />
              </View>
            </>
          )}

          {/* ── Reports ── */}
          <SectionTitle text="Reports" styles={styles} />
          <Pressable
            onPress={() => router.push("/admin-reports" as any)}
            style={styles.card}
          >
            <View style={styles.reportsRow}>
              <View>
                <ThemedText style={styles.reportsLabel}>
                  Pending Reports
                </ThemedText>
                <ThemedText style={styles.reportsValue}>
                  {data?.pending_reports ?? 0}
                </ThemedText>
              </View>
              <View>
                <ThemedText style={styles.reportsLabel}>
                  Total Reports
                </ThemedText>
                <ThemedText style={styles.reportsValue}>
                  {data?.total_reports ?? 0}
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </Pressable>

          {/* ── Top Interests ── */}
          {data?.top_interests && data.top_interests.length > 0 && (
            <>
              <SectionTitle text="Top Interests" styles={styles} />
              <View style={styles.card}>
                {data.top_interests.map((item, idx) => (
                  <InterestBar
                    key={item.name}
                    item={item}
                    maxCount={maxInterestCount}
                    color={BAR_COLORS[idx % BAR_COLORS.length]}
                    styles={styles}
                    isLast={idx === data.top_interests.length - 1}
                  />
                ))}
              </View>
            </>
          )}

          {/* ── Registration Graph (gifted-charts BarChart) ── */}
          <SectionTitle text="Registrations (All Time)" styles={styles} />
          <View style={styles.card}>
            {data?.daily_registrations && data.daily_registrations.length > 0 ? (
              <>
                <View
                  accessibilityLabel={`Registration graph showing ${data.daily_registrations.length} days of data`}
                >
                  <BarChart
                    data={regBarData}
                    barWidth={20}
                    spacing={8}
                    scrollToEnd={true}
                    scrollAnimation={false}
                    isAnimated
                    hideRules
                    yAxisColor="transparent"
                    xAxisColor="transparent"
                    yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
                    noOfSections={4}
                    maxValue={maxDailyCount}
                  />
                </View>
                <View accessibilityLiveRegion="polite">
                  <ThemedText style={styles.selectedBarLabel}>
                    {selectedBar
                      ? `${selectedBar.count} registrations on ${selectedBar.date}`
                      : "Tap a bar to see daily count"}
                  </ThemedText>
                </View>
              </>
            ) : (
              <ThemedText style={styles.emptyStateCentered}>
                No registration data available
              </ThemedText>
            )}
          </View>

          {/* ── Group Rankings ── */}
          {data?.group_rankings && (
            <>
              <SectionTitle text="Group Rankings" styles={styles} />

              {/* Top 5 Groups by Members */}
              <View style={[styles.card, styles.rankingCard]}>
                <ThemedText style={styles.rankingCardTitle}>Top 5 Groups by Members</ThemedText>
                {data.group_rankings.top_by_members.length > 0 ? (
                  (() => {
                    const maxCount = Math.max(...data.group_rankings!.top_by_members.map((g) => g.count), 1);
                    return data.group_rankings!.top_by_members.map((item, idx) => (
                      <GroupRankingBar
                        key={item.group_id}
                        item={item}
                        maxCount={maxCount}
                        color={BAR_COLORS[idx % BAR_COLORS.length]}
                        showRank={false}
                        styles={styles}
                      />
                    ));
                  })()
                ) : (
                  <ThemedText style={styles.emptyStateCentered}>No group data available</ThemedText>
                )}
              </View>

              {/* Top 5 Trending Groups */}
              <View style={[styles.card, styles.rankingCard]}>
                <ThemedText style={styles.rankingCardTitle}>Top 5 Trending Groups</ThemedText>
                {data.group_rankings.trending_members.length > 0 ? (
                  (() => {
                    const maxCount = Math.max(...data.group_rankings!.trending_members.map((g) => g.count), 1);
                    return data.group_rankings!.trending_members.map((item, idx) => (
                      <GroupRankingBar
                        key={item.group_id}
                        item={item}
                        maxCount={maxCount}
                        color={BAR_COLORS[idx % BAR_COLORS.length]}
                        showRank={false}
                        styles={styles}
                      />
                    ));
                  })()
                ) : (
                  <ThemedText style={styles.emptyStateCentered}>No group data available</ThemedText>
                )}
              </View>

              {/* Full Group Ranking */}
              <View style={[styles.card, styles.rankingCard]}>
                <ThemedText style={styles.rankingCardTitle}>Full Group Ranking</ThemedText>
                {data.group_rankings.full_ranking.length > 0 ? (
                  <ScrollView style={styles.rankingScroll} nestedScrollEnabled>
                    {(() => {
                      const maxCount = Math.max(...data.group_rankings!.full_ranking.map((g) => g.count), 1);
                      return data.group_rankings!.full_ranking.map((item, idx) => (
                        <GroupRankingBar
                          key={item.group_id}
                          item={item}
                          maxCount={maxCount}
                          color={BAR_COLORS[idx % BAR_COLORS.length]}
                          showRank={true}
                          rank={idx + 1}
                          styles={styles}
                        />
                      ));
                    })()}
                  </ScrollView>
                ) : (
                  <ThemedText style={styles.emptyStateCentered}>No group data available</ThemedText>
                )}
              </View>

              {/* Chat Ranking */}
              <View style={[styles.card, styles.rankingCard]}>
                <ThemedText style={styles.rankingCardTitle}>Chat Ranking</ThemedText>
                {data.group_rankings.chat_ranking.length > 0 ? (
                  <ScrollView style={styles.rankingScroll} nestedScrollEnabled>
                    {(() => {
                      const maxCount = Math.max(...data.group_rankings!.chat_ranking.map((g) => g.count), 1);
                      return data.group_rankings!.chat_ranking.map((item, idx) => (
                        <GroupRankingBar
                          key={item.group_id}
                          item={item}
                          maxCount={maxCount}
                          color={BAR_COLORS[idx % BAR_COLORS.length]}
                          showRank={true}
                          rank={idx + 1}
                          styles={styles}
                        />
                      ));
                    })()}
                  </ScrollView>
                ) : (
                  <ThemedText style={styles.emptyStateCentered}>No group data available</ThemedText>
                )}
              </View>

              {/* Trending Chats */}
              <View style={[styles.card, styles.rankingCard]}>
                <ThemedText style={styles.rankingCardTitle}>Trending Chats</ThemedText>
                {data.group_rankings.trending_chats.length > 0 ? (
                  (() => {
                    const maxCount = Math.max(...data.group_rankings!.trending_chats.map((g) => g.count), 1);
                    return data.group_rankings!.trending_chats.map((item, idx) => (
                      <GroupRankingBar
                        key={item.group_id}
                        item={item}
                        maxCount={maxCount}
                        color={BAR_COLORS[idx % BAR_COLORS.length]}
                        showRank={false}
                        styles={styles}
                      />
                    ));
                  })()
                ) : (
                  <ThemedText style={styles.emptyStateCentered}>No group data available</ThemedText>
                )}
              </View>
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ─── Helper Components ───

function SectionTitle({
  text,
  styles,
}: {
  text: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <ThemedText style={styles.sectionTitle}>{text}</ThemedText>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <ThemedText style={styles.statValue}>
        {typeof value === "number" && !Number.isInteger(value)
          ? value.toFixed(1)
          : value}
      </ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

function RoleBar({
  item,
  color,
  styles,
}: {
  item: RoleBreakdown;
  color: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.roleBarContainer}>
      <View style={styles.roleBarHeader}>
        <ThemedText style={[styles.roleBarLabel, { textTransform: "capitalize" }]}>
          {item.role}
        </ThemedText>
        <ThemedText style={styles.roleBarCount}>
          {item.count} ({item.percentage}%)
        </ThemedText>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.max(item.percentage, 2)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function DemographicsBar({
  label,
  count,
  percentage,
  maxCount,
  color,
  styles,
}: {
  label: string;
  count: number;
  percentage: number;
  maxCount: number;
  color: string;
  styles: ReturnType<typeof createStyles>;
}) {
  const widthPct = Math.max((count / Math.max(maxCount, 1)) * 100, 2);
  return (
    <View style={styles.roleBarContainer}>
      <View style={styles.roleBarHeader}>
        <ThemedText style={styles.demoBarLabel}>{label}</ThemedText>
        <ThemedText style={styles.roleBarCount}>
          {count} ({percentage}%)
        </ThemedText>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${widthPct}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function GroupRankingBar({
  item,
  maxCount,
  color,
  showRank,
  rank,
  styles,
}: {
  item: GroupRankingItem;
  maxCount: number;
  color: string;
  showRank: boolean;
  rank?: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const widthPct = Math.max((item.count / Math.max(maxCount, 1)) * 100, 2);
  return (
    <View style={styles.roleBarContainer}>
      <View style={styles.roleBarHeader}>
        <ThemedText style={styles.demoBarLabel} numberOfLines={1}>
          {showRank && rank ? `${rank}. ` : ""}{item.group_name}
        </ThemedText>
        <ThemedText style={styles.roleBarCount}>{item.count}</ThemedText>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${widthPct}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function InterestBar({
  item,
  maxCount,
  color,
  styles,
  isLast,
}: {
  item: InterestStat;
  maxCount: number;
  color: string;
  styles: ReturnType<typeof createStyles>;
  isLast: boolean;
}) {
  const pct = Math.round((item.count / Math.max(maxCount, 1)) * 100);
  return (
    <View
      style={[styles.interestBarContainer, !isLast && styles.interestBarBorder]}
    >
      <View style={styles.interestBarHeader}>
        <ThemedText style={styles.interestBarLabel} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <ThemedText style={styles.interestBarCount}>{item.count}</ThemedText>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.max(pct, 3)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  styles,
  isLast = false,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <ThemedText style={styles.infoRowLabel}>{label}</ThemedText>
      <ThemedText style={styles.infoRowValue}>{value}</ThemedText>
    </View>
  );
}

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}`;
  }
  return dateStr;
}

// ─── Styles ───

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginTop: 16,
      marginBottom: 10,
    },
    row: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
      alignItems: "center",
    },
    statIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    statValue: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
      marginBottom: 4,
    },
    // Role bars
    roleBarContainer: {
      marginBottom: 12,
    },
    roleBarHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    roleBarLabel: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "600",
    },
    roleBarCount: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    barTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.cardBorder,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 4,
    },
    // Interest bars
    interestBarContainer: {
      paddingVertical: 8,
    },
    interestBarBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    interestBarHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    interestBarLabel: {
      fontSize: 13,
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    interestBarCount: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    // Reports row
    reportsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    reportsLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    reportsValue: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.text,
    },
    // Info rows
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
    },
    infoRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    infoRowLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    infoRowValue: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    // Demographics
    demographicsSubTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 10,
    },
    demographicsDivider: {
      height: 1,
      backgroundColor: colors.cardBorder,
      marginVertical: 14,
    },
    demoBarLabel: {
      fontSize: 13,
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    sampleSizeLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: "italic",
      marginTop: 4,
    },
    emptyStateText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: 8,
    },
    emptyStateCentered: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: 12,
    },
    // Registration BarChart
    selectedBarLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
    },
    // Group Rankings
    rankingCard: {
      marginBottom: 12,
    },
    rankingCardTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 10,
    },
    rankingScroll: {
      maxHeight: 300,
    },
  });
