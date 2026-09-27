import type { LeaderboardStatsOut } from "@/api/schemas";
import React from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useColors } from "@/hooks/use-colors";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
type Props = {
  stats: LeaderboardStatsOut;
  activeCategory: string;
};

const CATEGORY_TO_KEY: Record<string, keyof LeaderboardStatsOut> = {
  points: "points_rank",
  sessions: "sessions_rank",
  groups: "groups_rank",
  scans: "scans_rank",
};

export function LeaderboardStatsCard({ stats, activeCategory }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);

  const STAT_ITEMS: { key: keyof LeaderboardStatsOut; label: string }[] = [
    { key: "points_rank", label: t("leaderboard.statsCard.points") },
    { key: "sessions_rank", label: t("leaderboard.statsCard.sessions") },
    { key: "groups_rank", label: t("leaderboard.statsCard.groups") },
    { key: "scans_rank", label: t("leaderboard.statsCard.scans") },
  ];

  const activeKey = CATEGORY_TO_KEY[activeCategory];

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{t("leaderboard.statsCard.yourRankings")}</ThemedText>
      <View style={styles.row}>
        {STAT_ITEMS.map((item) => {
          const isActive = item.key === activeKey;
          const rank = stats[item.key];
          return (
            <View
              key={item.key}
              style={[styles.statItem, isActive && styles.statItemActive]}
            >
              <ThemedText
                style={[
                  styles.statRank,
                  isActive && styles.statRankActive,
                ]}
              >
                {rank != null ? `#${rank}` : "--"}
              </ThemedText>
              <ThemedText
                style={[
                  styles.statLabel,
                  isActive && styles.statLabelActive,
                ]}
              >
                {item.label}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: "rgba(25, 79, 240, 0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(25, 79, 240, 0.2)",
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 8,
  },
  statItemActive: {
    backgroundColor: "rgba(25, 79, 240, 0.15)",
  },
  statRank: {
    fontSize: 18,
    fontWeight: "800",
    color: COLOR_WHITE_ON_ACCENT,
  },
  statRankActive: {
    color: colors.brand,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textTertiary,
    marginTop: 2,
  },
  statLabelActive: {
    color: colors.brand,
  },
});
