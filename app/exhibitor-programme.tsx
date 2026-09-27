import { FeatureGate } from "@/components/feature-gate";
import { getExhibitorSessions } from "@/api/features/exhibitors";
import { SessionOut } from "@/api/schemas";
import {
  DateScroller,
  SessionCard,
  TimeSlotHeader,
  extractUniqueDates,
} from "@/components/program";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
interface SessionSection {
  title: string;
  data: SessionOut[];
}

function groupSessionsByTime(sessions: SessionOut[]): SessionSection[] {
  const groups: Record<string, SessionOut[]> = {};

  sessions.forEach((session) => {
    const date = new Date(session.start_time);
    const timeKey = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (!groups[timeKey]) {
      groups[timeKey] = [];
    }
    groups[timeKey].push(session);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => {
      const timeA = new Date(`2000-01-01 ${a}`);
      const timeB = new Date(`2000-01-01 ${b}`);
      return timeA.getTime() - timeB.getTime();
    })
    .map(([title, data]) => ({ title, data }));
}

export default function ExhibitorProgrammeScreen() {
  return (
    <FeatureGate flag="exhibitors">
      <ExhibitorProgrammeContent />
    </FeatureGate>
  );
}

function ExhibitorProgrammeContent() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const backgroundColor = colors.surfacePrimary;
  const textColor = colors.text;
  const textSecondary = colors.textSecondary;

  const [sessions, setSessions] = useState<SessionOut[]>([]);
  console.log("🔍 → ExhibitorProgrammeScreen → sessions:", sessions);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const dates = useMemo(() => extractUniqueDates(sessions), [sessions]);

  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0].date);
    }
  }, [dates, selectedDate]);

  const filteredSessions = useMemo(() => {
    if (!selectedDate) return sessions;
    return sessions.filter((s) => s.start_time.split("T")[0] === selectedDate);
  }, [sessions, selectedDate]);

  const sections = useMemo(
    () => groupSessionsByTime(filteredSessions),
    [filteredSessions],
  );

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!userId) return;
      try {
        if (!isRefresh) setLoading(true);
        setError(null);

        const sessionList = await getExhibitorSessions(parseInt(userId, 10));
        setSessions(sessionList);
      } catch (e: any) {
        console.error("Failed to load exhibitor programme:", e);
        setError(e?.message ?? "Failed to load programme");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  const handleSessionPress = useCallback(
    (session: SessionOut) => {
      router.push(`/session/${session.id}`);
    },
    [router],
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.brand} />
        <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
          {t("exhibitor.programme.loading")}
        </ThemedText>
      </View>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={48} color={textSecondary} />
        <ThemedText style={[styles.errorText, { color: textColor }]}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
          <ThemedText style={styles.retryButtonText}>{t("exhibitor.programme.retry")}</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={48} color={textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
        {t("exhibitor.programme.noSessions")}
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
        {t("exhibitor.programme.noSessionsDesc")}
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textSecondary }]}>
          {t("exhibitor.programme.header")}
        </ThemedText>
        <View style={styles.headerButton} />
      </View>

      {/* Date Scroller */}
      {selectedDate && dates.length > 0 && (
        <View style={styles.dateScrollerWrapper}>
          <DateScroller
            dates={dates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </View>
      )}

      {/* Session List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={({ section }) => (
          <TimeSlotHeader time={section.title} isFirst={false} />
        )}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <SessionCard
              session={item}
              isFavorite={false}
              onPress={() => handleSessionPress(item)}
              onFavoritePress={() => {}}
            />
          </View>
        )}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
          />
        }
        stickySectionHeadersEnabled={true}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
  },
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
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  dateScrollerWrapper: {
    paddingBottom: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.brand,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 40,
  },
  cardWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
    marginTop: 48,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
