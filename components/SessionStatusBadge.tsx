import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import type { SessionOut } from "@/api/schemas";
import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";

type SessionStatusBadgeProps = {
  session: Pick<SessionOut, "start_time" | "end_time" | "is_cancelled">;
  size?: "sm" | "md";
  withIcon?: boolean;
};

type StatusKey = "cancelled" | "upcoming" | "live" | "past";

function resolveStatus(
  session: SessionStatusBadgeProps["session"],
  now: number,
): StatusKey {
  // Precedence: cancelled overrides all time-based states
  if (session.is_cancelled === true) return "cancelled";
  const start = new Date(session.start_time).getTime();
  const end = new Date(session.end_time).getTime();
  if (Number.isFinite(start) && now < start) return "upcoming";
  if (Number.isFinite(end) && now > end) return "past";
  return "live";
}

export function SessionStatusBadge({
  session,
  size = "sm",
  withIcon = false,
}: SessionStatusBadgeProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const status = resolveStatus(session, Date.now());

  const tokenMap: Record<StatusKey, string> = {
    cancelled: colors.error,
    upcoming: colors.primary,
    live: colors.success,
    past: colors.textSecondary,
  };
  const labelKey: Record<StatusKey, string> = {
    cancelled: "admin.sessions.status.cancelled",
    upcoming: "admin.sessions.status.upcoming",
    live: "admin.sessions.status.live",
    past: "admin.sessions.status.past",
  };
  const iconMap: Record<StatusKey, keyof typeof Ionicons.glyphMap> = {
    cancelled: "close-circle",
    upcoming: "time-outline",
    live: "radio",
    past: "checkmark-circle-outline",
  };

  const token = tokenMap[status];

  const paddingHorizontal = size === "md" ? 10 : 6;
  const paddingVertical = size === "md" ? 2 : 1;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: token + "20",
          paddingHorizontal,
          paddingVertical,
        },
      ]}
    >
      {withIcon ? (
        <Ionicons
          name={iconMap[status]}
          size={12}
          color={token}
          style={styles.icon}
        />
      ) : null}
      <ThemedText style={[styles.text, { color: token }]}>
        {t(labelKey[status])}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 6,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
