import type { LeaderboardCategoryEntryOut } from "@/api/schemas";
import React from "react";
import {
  FlatList,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useColors } from "@/hooks/use-colors";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
type Props = {
  entries: LeaderboardCategoryEntryOut[];
  myUserId: number;
  category: string;
};

const CATEGORY_UNITS: Record<string, string> = {
  points: "pts",
  sessions: "",
  groups: "",
  scans: "",
};

function EntryRow({
  entry,
  isMe,
  unit,
}: {
  entry: LeaderboardCategoryEntryOut;
  isMe: boolean;
  unit: string;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const letter = entry.full_name
    ? entry.full_name.charAt(0).toUpperCase()
    : "?";

  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <View style={styles.rankContainer}>
        <ThemedText style={styles.rankText}>{entry.rank}</ThemedText>
      </View>
      <View style={styles.avatarSmall}>
        <ThemedText style={styles.avatarSmallText}>{letter}</ThemedText>
      </View>
      <View style={styles.info}>
        <ThemedText style={[styles.name, isMe && styles.nameMe]} numberOfLines={1}>
          {entry.full_name ?? t("common.unknown")}
          {isMe ? ` ${t("leaderboard.list.youSuffix")}` : ""}
        </ThemedText>
        <ThemedText style={styles.role}>{entry.role}</ThemedText>
      </View>
      <ThemedText style={styles.count}>
        {entry.count}
        {unit ? ` ${unit}` : ""}
      </ThemedText>
    </View>
  );
}

export function LeaderboardList({ entries, myUserId, category }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const unit = CATEGORY_UNITS[category] ?? "";

  if (entries.length === 0) return null;

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => `${item.user_id}`}
      renderItem={({ item }) => (
        <EntryRow
          entry={item}
          isMe={item.user_id === myUserId}
          unit={unit}
        />
      )}
      scrollEnabled={false}
      contentContainerStyle={styles.list}
    />
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  rowMe: {
    borderColor: "rgba(25, 79, 240, 0.3)",
    backgroundColor: "rgba(25, 79, 240, 0.06)",
  },
  rankContainer: {
    width: 28,
    alignItems: "center",
  },
  rankText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textTertiary,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  avatarSmallText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  info: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  nameMe: {
    color: colors.brand,
  },
  role: {
    fontSize: 11,
    color: colors.textTertiary,
    textTransform: "capitalize",
    marginTop: 1,
  },
  count: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.warning,
    marginLeft: 8,
  },
});
