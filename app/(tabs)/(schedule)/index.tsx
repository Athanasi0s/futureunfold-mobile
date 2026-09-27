import {
  addFavorite,
  getMyAgenda,
  getProgram,
  removeFavorite,
} from "@/api/features/program";
import { AgendaItemOut, SessionOut } from "@/api/schemas";
import {
  DateScroller,
  ProgramToggle,
  SessionCard,
  TimeSlotHeader,
  TopicFilter,
  extractUniqueDates,
  extractUniqueTopics,
  type ProgramView,
} from "@/components/program";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

// Group sessions by time slot
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
interface SessionSection {
  title: string; // Formatted time like "09:00 AM"
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

  // Sort by time
  return Object.entries(groups)
    .sort(([a], [b]) => {
      const timeA = new Date(`2000-01-01 ${a}`);
      const timeB = new Date(`2000-01-01 ${b}`);
      return timeA.getTime() - timeB.getTime();
    })
    .map(([title, data]) => ({ title, data }));
}

export default function ProgramScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const router = useRouter();
  const backgroundColor = colors.surfacePrimary;
  const textColor = colors.text;
  const textSecondary = colors.textSecondary;
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  // State
  const [view, setView] = useState<ProgramView>("full");
  const [sessions, setSessions] = useState<SessionOut[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItemOut[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Derived data
  const dates = useMemo(() => extractUniqueDates(sessions), [sessions]);
  const topics = useMemo(() => extractUniqueTopics(sessions), [sessions]);

  // Initialize selected date when sessions load
  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0].date);
    }
  }, [dates, selectedDate]);

  // Filtered sessions for display
  const filteredSessions = useMemo(() => {
    if (view === "agenda") {
      // Show agenda sessions, filter by date if selected
      let agendaSessions = agendaItems.map((item) => item.session);
      if (selectedDate) {
        agendaSessions = agendaSessions.filter(
          (s) => s.start_time.split("T")[0] === selectedDate,
        );
      }
      return agendaSessions;
    }

    // Full program view with filters
    let filtered = sessions;
    if (selectedDate) {
      filtered = filtered.filter(
        (s) => s.start_time.split("T")[0] === selectedDate,
      );
    }
    if (selectedTopic) {
      filtered = filtered.filter((s) => s.topic_tags?.includes(selectedTopic));
    }
    return filtered;
  }, [view, sessions, agendaItems, selectedDate, selectedTopic]);

  const sections = useMemo(
    () => groupSessionsByTime(filteredSessions),
    [filteredSessions],
  );

  // Load data
  const loadData = useCallback(async (isRefresh = false, search?: string) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const filters = search ? { search } : undefined;
      const [programData, agendaData] = await Promise.all([
        getProgram(filters),
        getMyAgenda().catch(() => [] as AgendaItemOut[]), // Agenda may fail if not logged in
      ]);

      setSessions(programData);
      setAgendaItems(agendaData);
      setFavoriteIds(new Set(agendaData.map((item) => item.session.id)));
    } catch (e: any) {
      console.error("Failed to load program:", e);
      setError(e?.message ?? "Failed to load program");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refetch when search query changes (debounced)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      loadData(true, searchQuery || undefined);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery, loadData]);

  // Refetch favorites when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      // Only refetch agenda to sync favorites, not the full program
      const syncFavorites = async () => {
        try {
          const agendaData = await getMyAgenda().catch(() => []);
          setAgendaItems(agendaData);
          setFavoriteIds(new Set(agendaData.map((item) => item.session.id)));
        } catch {
          // Silent fail - user might not be logged in
        }
      };
      syncFavorites();
    }, []),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(
    async (session: SessionOut) => {
      const isFavorite = favoriteIds.has(session.id);

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFavorite) {
          next.delete(session.id);
        } else {
          next.add(session.id);
        }
        return next;
      });

      try {
        if (isFavorite) {
          await removeFavorite(session.id);
          setAgendaItems((prev) =>
            prev.filter((item) => item.session.id !== session.id),
          );
        } else {
          const response = await addFavorite(session.id);

          if (
            response.has_conflict &&
            response.conflicting_sessions.length > 0
          ) {
            Alert.alert(
              t("schedule.scheduleConflict"),
              t("schedule.scheduleConflictMessage", { sessions: response.conflicting_sessions.map((s) => s.title).join(", ") }),
              [{ text: t("schedule.okButton"), style: "default" }],
            );
          }

          // Refresh agenda to get updated list
          const agendaData = await getMyAgenda().catch(() => []);
          setAgendaItems(agendaData);
        }
      } catch (e: any) {
        // Rollback optimistic update
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isFavorite) {
            next.add(session.id);
          } else {
            next.delete(session.id);
          }
          return next;
        });

        if (e?.message?.includes("401")) {
          Alert.alert(
            t("schedule.signInRequired"),
            t("schedule.signInMessage"),
            [
              { text: t("schedule.cancelButton"), style: "cancel" },
              { text: t("schedule.signInButton"), onPress: () => router.push("/login") },
            ],
          );
        } else {
          Alert.alert(t("schedule.errorTitle"), e?.message ?? t("schedule.failedToUpdateFavorite"));
        }
      }
    },
    [favoriteIds, router, t],
  );

  // Handle session press
  const handleSessionPress = useCallback(
    (session: SessionOut) => {
      router.push(`/session/${session.id}`);
    },
    [router],
  );

  // Render loading state
  if (loading) {
    return (
      <View testID="schedule-screen" style={[styles.centerContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={colors.brand} />
        <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
          {t("schedule.loadingProgram")}
        </ThemedText>
      </View>
    );
  }

  // Render error state
  if (error && sessions.length === 0) {
    return (
      <View testID="schedule-screen" style={[styles.centerContainer, { backgroundColor }]}>
        <Ionicons name="alert-circle-outline" size={48} color={textSecondary} />
        <ThemedText style={[styles.errorText, { color: textColor }]}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
          <ThemedText style={styles.retryButtonText}>{t("schedule.retry")}</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={view === "agenda" ? "calendar-outline" : "search-outline"}
        size={48}
        color={textSecondary}
      />
      <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
        {view === "agenda" ? t("schedule.emptyAgendaTitle") : t("schedule.emptySearchTitle")}
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
        {view === "agenda"
          ? t("schedule.emptyAgendaSubtitle")
          : t("schedule.emptySearchSubtitle")}
      </ThemedText>
    </View>
  );

  return (
    <View testID="schedule-screen" style={[styles.container, { backgroundColor }]}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      {/* Header Controls */}
      <View style={styles.header}>
        <ProgramToggle
          value={view}
          onChange={(v) => {
            setView(v);
            if (v === "agenda") setSearchQuery("");
          }}
        />

        {view === "full" && (
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder={t("schedule.searchPlaceholder")}
              placeholderTextColor={textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {view === "agenda" && (
          <TouchableOpacity
            style={styles.myMeetingsButton}
            onPress={() => router.push("/my-meetings")}
            activeOpacity={0.7}
          >
            <Ionicons name="people" size={20} color={COLOR_WHITE_ON_ACCENT} />
            <ThemedText style={styles.myMeetingsText}>{t("schedule.myMeetingsButton")}</ThemedText>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {selectedDate && (
          <DateScroller
            dates={dates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        )}

        {view === "full" && topics.length > 0 && (
          <TopicFilter
            topics={topics}
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
          />
        )}
      </View>

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
              isFavorite={favoriteIds.has(item.id)}
              onPress={() => handleSessionPress(item)}
              onFavoritePress={() => handleFavoriteToggle(item)}
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
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },
  header: {
    paddingTop: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
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
    paddingBottom: 100, // Space for tab bar
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
  myMeetingsButton: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: "rgba(25, 79, 240, 0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(25, 79, 240, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  myMeetingsText: {
    flex: 1,
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
});
