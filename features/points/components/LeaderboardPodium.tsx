import type { LeaderboardCategoryEntryOut } from "@/api/schemas";
import React from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { MEDAL_COLORS } from "@/constants/data-colors";
// MEDAL_COLORS used below for the three podium slots. Kept in data-colors
// because medal hues are semantic constants (gold/silver/bronze) and not
// theme-driven.
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
type Props = {
  entries: LeaderboardCategoryEntryOut[];
  category: string;
};

const CATEGORY_UNITS: Record<string, string> = {
  points: "pts",
  sessions: "",
  groups: "",
  scans: "",
};

const PODIUM_COLORS = {
  first: MEDAL_COLORS.gold,
  second: MEDAL_COLORS.silver,
  third: MEDAL_COLORS.bronze,
};

function AvatarCircle({
  name,
  size,
  color,
}: {
  name: string | null;
  size: number;
  color: string;
}) {
  const letter = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${color}30`,
          borderColor: color,
        },
      ]}
    >
      <ThemedText style={[styles.avatarText, { fontSize: size * 0.4, color }]}>
        {letter}
      </ThemedText>
    </View>
  );
}

export function LeaderboardPodium({ entries, category }: Props) {
  const { t } = useTranslation();
  if (entries.length === 0) return null;

  const unit = CATEGORY_UNITS[category] ?? "";

  // Order for display: index 1 (#2), index 0 (#1), index 2 (#3)
  const first = entries[0] ?? null;
  const second = entries[1] ?? null;
  const third = entries[2] ?? null;

  const renderSlot = (
    entry: LeaderboardCategoryEntryOut | null,
    rank: number,
    height: number,
    avatarSize: number,
    color: string,
  ) => {
    if (!entry) return <View style={{ flex: 1 }} />;
    const displayName =
      entry.full_name && entry.full_name.length > 12
        ? entry.full_name.substring(0, 11) + "..."
        : entry.full_name ?? t("common.unknown");

    return (
      <View style={[styles.podiumSlot, { flex: 1 }]}>
        <AvatarCircle name={entry.full_name} size={avatarSize} color={color} />
        <ThemedText style={styles.podiumName} numberOfLines={1}>
          {displayName}
        </ThemedText>
        <ThemedText style={[styles.podiumCount, { color }]}>
          {entry.count}
          {unit ? ` ${unit}` : ""}
        </ThemedText>
        <View style={[styles.podiumBar, { height, backgroundColor: `${color}25`, borderColor: `${color}60` }]}>
          <ThemedText style={[styles.podiumRank, { color }]}>#{rank}</ThemedText>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderSlot(second, 2, 60, 44, PODIUM_COLORS.second)}
      {renderSlot(first, 1, 80, 56, PODIUM_COLORS.first)}
      {renderSlot(third, 3, 48, 40, PODIUM_COLORS.third)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  podiumSlot: {
    alignItems: "center",
    gap: 4,
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarText: {
    fontWeight: "800",
  },
  podiumName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
    textAlign: "center",
    maxWidth: 90,
  },
  podiumCount: {
    fontSize: 13,
    fontWeight: "800",
  },
  podiumBar: {
    width: "80%",
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  podiumRank: {
    fontSize: 16,
    fontWeight: "900",
    paddingVertical: 6,
  },
});
