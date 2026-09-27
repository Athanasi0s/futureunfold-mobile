import type { JourneyTimelineOut, TimelineEventOut } from "@/api/schemas";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useColors } from "@/hooks/use-colors";

import { JOURNEY_EVENT_COLORS } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
function getEventColors(brandColor: string): Record<TimelineEventOut["type"], string> {
  return {
    session: brandColor,
    group: JOURNEY_EVENT_COLORS.group,
    scan: JOURNEY_EVENT_COLORS.scan,
    message: JOURNEY_EVENT_COLORS.message,
    meeting: JOURNEY_EVENT_COLORS.meeting,
    poll: JOURNEY_EVENT_COLORS.poll,
  };
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  data: JourneyTimelineOut;
};

export function JourneyTimeline({ data }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const EVENT_COLORS = getEventColors(colors.brand);
  if (!data.days || data.days.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="footsteps-outline" size={40} color={colors.textTertiary} />
        <ThemedText style={styles.emptyText}>{t("journey.emptyText")}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Total activities count */}
      <View style={styles.totalRow}>
        <Ionicons name="analytics-outline" size={18} color={colors.textSecondary} />
        <ThemedText style={styles.totalText}>{data.total_activities} {t("journey.activitiesLabel")}</ThemedText>
      </View>

      {data.days.map((day) => (
        <View key={day.date} style={styles.daySection}>
          {/* Day header */}
          <View style={styles.dayHeader}>
            <View style={styles.dayDot} />
            <ThemedText style={styles.dayLabel}>{day.day_label}</ThemedText>
          </View>

          {/* Events */}
          <View style={styles.eventsContainer}>
            {day.events.length > 1 && <View style={styles.eventLine} />}

            {day.events.map((event, index) => {
              const color = EVENT_COLORS[event.type] ?? JOURNEY_EVENT_COLORS.fallback;
              return (
                <View key={`${day.date}-${index}`} style={styles.eventRow}>
                  {/* Icon */}
                  <View style={[styles.eventIconWrap, { backgroundColor: `${color}20` }]}>
                    <Ionicons
                      name={event.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={color}
                    />
                  </View>

                  {/* Text */}
                  <View style={styles.eventTextWrap}>
                    <ThemedText style={styles.eventTitle} numberOfLines={1}>
                      {event.title}
                    </ThemedText>
                    {event.subtitle ? (
                      <ThemedText style={styles.eventSubtitle} numberOfLines={1}>
                        {event.subtitle}
                      </ThemedText>
                    ) : null}
                  </View>

                  {/* Time */}
                  <ThemedText style={styles.eventTime}>{formatTime(event.timestamp)}</ThemedText>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  totalText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  daySection: {
    marginBottom: 20,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  eventsContainer: {
    marginLeft: 4,
    paddingLeft: 20,
    position: "relative",
  },
  eventLine: {
    position: "absolute",
    left: 4,
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  eventIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  eventTextWrap: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  eventSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  emptyContainer: {
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
});
