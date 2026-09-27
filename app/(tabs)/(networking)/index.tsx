import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { UIButton } from "@/components/ui/ui-button";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { SHADOW_BLACK } from "@/constants/data-colors";
import type { FilterState } from "@/features/matching/components";
import {
  AttendeeRow,
  FilterBottomSheet,
  INITIAL_FILTER_STATE,
  MatchCardLarge,
} from "@/features/matching/components";
import type { UserFilters } from "@/features/matching/hooks/useGetAttendees";
import { useGetAttendees } from "@/features/matching/hooks/useGetAttendees";
import { useGetMatchingUsers } from "@/features/matching/hooks/useGetMatchingUsers";
import { useGetAvailableInterests } from "@/features/onboarding/hooks/useGetAvailableInterests";
import { useGetOnboardingStatus } from "@/features/onboarding/hooks/useGetOnboardingStatus";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding";
import type { MatchingFilters } from "@/features/matching/get-matching-users";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

type TabValue = "matches" | "attendees";

export default function Networking() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("matches");
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] =
    useState<FilterState>(INITIAL_FILTER_STATE);

  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const FILTER_CHIPS = [
    t("networking.filterChipForYou"),
    "AI Ethics",
    "Web3",
    "Founders",
  ] as const;

  const { data: onboardingStatus, isLoading: isLoadingOnboarding } =
    useGetOnboardingStatus();
  const hasCompletedOnboarding = onboardingStatus?.status === "completed";
  const setShouldOpenOnboarding = useOnboardingStore(
    (state) => state.setShouldOpenOnboarding,
  );

  const { data: availableInterests } = useGetAvailableInterests();

  // Resolve interest names → IDs once, shared by both tabs
  const resolvedInterestIds = useMemo(() => {
    if (activeFilters.interests.length === 0 || !availableInterests) return [];
    return availableInterests
      .filter((i) => activeFilters.interests.includes(i.name))
      .map((i) => i.id);
  }, [activeFilters.interests, availableInterests]);

  // Server-side filters for Top Matches (/matching)
  const matchingFilters = useMemo<MatchingFilters>(() => {
    const f: MatchingFilters = {};
    if (activeFilters.role) f.role = activeFilters.role;
    if (activeFilters.availableForMeetings) f.availableNow = true;
    if (resolvedInterestIds.length > 0) f.interestIds = resolvedInterestIds;
    return f;
  }, [activeFilters.role, activeFilters.availableForMeetings, resolvedInterestIds]);

  const {
    data: matchingUsers,
    isLoading,
    error,
  } = useGetMatchingUsers(hasCompletedOnboarding, matchingFilters);

  // Server-side filters for All Users (/users)
  const userFilters = useMemo<UserFilters>(() => {
    const f: UserFilters = {};
    if (activeFilters.role) f.role = activeFilters.role;
    if (activeFilters.availableForMeetings) f.availableNow = true;
    if (resolvedInterestIds.length > 0) f.interestIds = resolvedInterestIds;
    return f;
  }, [activeFilters.role, activeFilters.availableForMeetings, resolvedInterestIds]);

  const {
    data: attendees,
    isLoading: isLoadingAttendees,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAttendees(search, userFilters);

  const handleTabChange = useCallback(
    (tab: TabValue) => {
      setActiveTab(tab);
      setSearch("");
    },
    [],
  );

  // Client-side search filtering for matches
  const filteredMatchingUsers = useMemo(() => {
    if (!matchingUsers) return [];
    if (!search) return matchingUsers;
    const lower = search.toLowerCase();
    return matchingUsers.filter((u) =>
      u.full_name.toLowerCase().includes(lower),
    );
  }, [matchingUsers, search]);

  const handleCompleteQuestionnaire = () => {
    setShouldOpenOnboarding(true);
  };

  if (isLoadingOnboarding || (hasCompletedOnboarding && isLoading)) {
    return (
      <ThemedView testID="networking-screen" style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (hasCompletedOnboarding && error) {
    return (
      <ThemedView testID="networking-screen" style={styles.center}>
        <ThemedText>{t("networking.failedToLoadMatches")}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView testID="networking-screen" style={{ flex: 1, backgroundColor: colors.background }}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <MaterialIcons
            name="search"
            size={22}
            color={colors.icon}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder={t("networking.searchPlaceholder")}
            placeholderTextColor={colors.icon}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <Pressable
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <MaterialIcons name="tune" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.chipsContainer}
      >
        {FILTER_CHIPS.map((chip, index) => {
          const isActive = index === 0;
          return (
            <View
              key={chip}
              style={[
                styles.chip,
                isActive
                  ? { backgroundColor: colors.lightBlue }
                  : {
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
              ]}
            >
              <ThemedText
                style={[
                  styles.chipText,
                  {
                    color: isActive
                      ? colors.white
                      : colors.textSecondary,
                  },
                  isActive && styles.chipTextActive,
                ]}
              >
                {chip}
              </ThemedText>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={16}
                color={isActive ? colors.white : colors.textSecondary}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Tab toggle */}
      <View style={styles.toggleWrapper}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              activeTab === "matches" && [
                styles.toggleOptionActive,
                { backgroundColor: colors.background },
              ],
            ]}
            onPress={() => handleTabChange("matches")}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[
                styles.toggleText,
                {
                  color:
                    activeTab === "matches"
                      ? colors.text
                      : colors.icon,
                },
              ]}
            >
              {t("networking.tabTopMatches")}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleOption,
              activeTab === "attendees" && [
                styles.toggleOptionActive,
                { backgroundColor: colors.background },
              ],
            ]}
            onPress={() => handleTabChange("attendees")}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[
                styles.toggleText,
                {
                  color:
                    activeTab === "attendees"
                      ? colors.text
                      : colors.icon,
                },
              ]}
            >
              {t("networking.tabAllUsers")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {activeTab === "matches" ? (
          hasCompletedOnboarding ? (
            <FlatList
              data={filteredMatchingUsers}
              keyExtractor={(item) => item.user_id.toString()}
              renderItem={({ item }) => <MatchCardLarge user={item} />}
              contentContainerStyle={styles.matchesList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <ThemedText style={styles.emptyText}>
                  {t("networking.noMatchesFound")}
                </ThemedText>
              }
            />
          ) : (
            <View style={styles.unlockCard}>
              <View style={styles.lockIconContainer}>
                <MaterialIcons
                  name="lock"
                  size={24}
                  color={colors.lightBlue}
                />
              </View>
              <ThemedText style={styles.unlockTitle}>
                {t("networking.unlockTitle")}
              </ThemedText>
              <ThemedText style={styles.unlockDescription}>
                {t("networking.unlockDescription")}
              </ThemedText>
              <UIButton
                title={t("networking.completeQuestionnaire")}
                onPress={handleCompleteQuestionnaire}
                style={styles.questionnaireButton}
                textStyle={styles.questionnaireButtonText}
              />
            </View>
          )
        ) : (
          <FlatList
            data={attendees ?? []}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <AttendeeRow user={item} />}
            contentContainerStyle={styles.attendeesSection}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              isLoadingAttendees ? (
                <ActivityIndicator style={styles.loader} size="small" />
              ) : (
                <ThemedText style={styles.emptyText}>
                  {t("networking.noAttendeesFound")}
                </ThemedText>
              )
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator style={styles.loader} size="small" />
              ) : null
            }
            onEndReached={() => {
              if (hasNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
          />
        )}
      </View>
      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        activeFilters={activeFilters}
        onApply={(filters) => {
          setActiveFilters(filters);
          setFilterVisible(false);
        }}
      />
    </ThemedView>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },

    // Search
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    searchInputWrapper: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.inputBackground,
      alignItems: "center",
      justifyContent: "center",
    },

    // Filter chips
    chipsContainer: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      height: 32,
      paddingHorizontal: 14,
      paddingRight: 8,
      borderRadius: 16,
      gap: 2,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "500",
    },
    chipTextActive: {
      fontWeight: "600",
    },

    // Tab toggle
    toggleWrapper: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    toggleContainer: {
      flexDirection: "row",
      height: 44,
      borderRadius: 12,
      padding: 4,
      backgroundColor: colors.cardBackground,
    },
    toggleOption: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
    },
    toggleOptionActive: {
      shadowColor: SHADOW_BLACK,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    toggleText: {
      fontSize: 14,
      fontWeight: "600",
    },

    // Matches tab
    matchesList: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },

    // Attendees tab
    attendeesSection: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },

    // Unlock card
    unlockCard: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.lightBlue,
      marginHorizontal: 16,
      marginTop: 16,
      paddingVertical: 32,
      paddingHorizontal: 24,
    },
    lockIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "rgba(74, 144, 226, 0.15)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    unlockTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    unlockDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 20,
    },
    questionnaireButton: {
      backgroundColor: colors.lightBlue,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
      width: "100%",
      alignItems: "center",
    },
    questionnaireButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },

    // Shared
    loader: {
      paddingVertical: 20,
    },
    emptyText: {
      textAlign: "center",
      color: colors.icon,
      paddingVertical: 20,
    },
  });
