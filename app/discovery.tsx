import type { GroupFilters, GroupOut } from "@/api/schemas";
import { FeatureGate } from "@/components/feature-gate";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import {
  GroupFilterBottomSheet,
  type GroupFilterState,
  INITIAL_GROUP_FILTER_STATE,
} from "@/features/home/components/GroupFilterBottomSheet";
import {
  useGetGroups,
  useGetMyGroups,
  useJoinGroup,
} from "@/features/home/hooks";
import { SHADOW_BLACK } from "@/constants/data-colors";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { useColors } from "@/hooks/use-colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop",
];


type TabType = "all" | "my";

function TabButtons({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.tabWrapper}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "all" && styles.tabButtonActive,
          ]}
          onPress={() => onTabChange("all")}
          activeOpacity={0.7}
        >
          <ThemedText
            style={[
              styles.tabButtonText,
              {
                color:
                  activeTab === "all"
                    ? colors.text
                    : colors.textSecondary,
              },
            ]}
          >
            {t("discovery.tabAllGroups")}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "my" && styles.tabButtonActive,
          ]}
          onPress={() => onTabChange("my")}
          activeOpacity={0.7}
        >
          <ThemedText
            style={[
              styles.tabButtonText,
              {
                color:
                  activeTab === "my"
                    ? colors.text
                    : colors.textSecondary,
              },
            ]}
          >
            {t("discovery.tabMyGroups")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ListHeader({
  activeTab,
  myGroupCount,
}: {
  activeTab: TabType;
  myGroupCount: number;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (activeTab === "my") {
    return (
      <View style={styles.listHeader}>
        <ThemedText style={styles.listHeaderTitle}>{t("discovery.headerMyCommunitiesTitle")}</ThemedText>
        <ThemedText style={styles.listHeaderSubtitle}>
          {t("discovery.headerMyCommunitiesSubtitle", { count: myGroupCount })}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.listHeader}>
      <ThemedText style={styles.listHeaderTitle}>{t("discovery.headerExploreTitle")}</ThemedText>
      <ThemedText style={styles.listHeaderSubtitle}>
        {t("discovery.headerExploreSubtitle")}
      </ThemedText>
    </View>
  );
}

function GroupDiscoveryCard({
  group,
  index,
  joined,
  onJoin,
}: {
  group: GroupOut;
  index: number;
  joined: boolean;
  onJoin: () => void;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const matchPercent = group.match_percentage;
  const imageUrl = PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];

  const handlePress = () => {
    router.push({
      pathname: "/group-details",
      params: {
        id: group.id.toString(),
        title: group.title,
        description: group.description ?? "",
        group_type: group.group_type,
        ref_key: group.ref_key,
        member_count: group.member_count.toString(),
        match_percentage: group.match_percentage?.toString() ?? "",
        image_index: index.toString(),
      },
    });
  };

  return (
    <Pressable style={styles.discoveryCard} onPress={handlePress}>
      {/* Image */}
      <View style={styles.discoveryImageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.discoveryImage}
          contentFit="cover"
        />
        {/* Match badge — only show when not joined and match_percentage exists */}
        {!joined && matchPercent != null && (
          <View style={styles.matchBadge}>
            <ThemedText style={styles.matchBadgeText}>{t("discovery.matchBadge", { percent: matchPercent })}</ThemedText>
          </View>
        )}
        {/* Joined badge */}
        {joined && (
          <View style={styles.joinedBadge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={colors.white}
            />
            <ThemedText style={styles.joinedBadgeText}>{t("discovery.joinedBadge")}</ThemedText>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.discoveryContent}>
        <ThemedText style={styles.discoveryTitle} numberOfLines={2}>
          {group.title}
        </ThemedText>

        <View style={styles.discoveryMembersRow}>
          <Ionicons name="people" size={14} color={colors.success} />
          <ThemedText style={styles.discoveryMembersText}>
            {t("discovery.members", { count: group.member_count })}
          </ThemedText>
        </View>

        {group.description && (
          <ThemedText style={styles.discoveryDescription} numberOfLines={2}>
            {group.description}
          </ThemedText>
        )}

        <View style={styles.discoveryFooter}>
          <View style={{ flex: 1 }} />
          {joined ? (
            <View style={styles.discoveryJoinedButton}>
              <ThemedText style={styles.discoveryJoinedButtonText}>{t("discovery.joinedBadge")}</ThemedText>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.discoveryJoinButton}
              onPress={onJoin}
            >
              <ThemedText style={styles.discoveryJoinButtonText}>{t("discovery.join")}</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function DiscoveryScreen() {
  return (
    <FeatureGate flag="groups">
      <DiscoveryContent />
    </FeatureGate>
  );
}

function DiscoveryContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<GroupFilterState>(
    INITIAL_GROUP_FILTER_STATE,
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const filters = useMemo<GroupFilters | undefined>(() => {
    const hasFilters = search || activeFilters.role || activeFilters.venue;
    if (!hasFilters) return undefined;
    const f: GroupFilters = {};
    if (search) f.search = search;
    if (activeFilters.role) f.has_role = activeFilters.role;
    if (activeFilters.venue) f.venue = activeFilters.venue;
    return f;
  }, [search, activeFilters.role, activeFilters.venue]);

  const { data: groups = [], isLoading: isLoadingGroups, refetch: refetchGroups } = useGetGroups(filters);
  const { data: myGroups = [], isLoading: isLoadingMyGroups, refetch: refetchMyGroups } = useGetMyGroups(filters);
  const joinGroup = useJoinGroup();

  const isLoading = activeTab === "all" ? isLoadingGroups : isLoadingMyGroups;

  const handleRefetch = () => {
    refetchGroups();
    refetchMyGroups();
  };

  const myGroupIds = useMemo(
    () => new Set(myGroups.map((g) => g.id)),
    [myGroups],
  );

  const displayGroups = activeTab === "all" ? groups : myGroups;

  const handleJoin = (group: GroupOut) => {
    joinGroup.mutate(
      { group_id: group.id, ref_key: group.ref_key },
      {
        onSuccess: () => {
          Alert.alert(t("discovery.joinedSuccess"), t("discovery.joinedSuccessMessage", { title: group.title }));
        },
        onError: () => {
          Alert.alert(t("discovery.joinError"), t("discovery.joinErrorMessage"));
        },
      },
    );
  };

  return (
    <LinearGradient
      colors={[
        colors.gradientStart,
        colors.gradientMiddle,
        colors.gradientEnd,
      ]}
      style={styles.container}
    >
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t("discovery.title")}</ThemedText>
        <View style={styles.headerBackButton} />
      </View>

      {/* Search bar + filter button */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <MaterialIcons
            name="search"
            size={22}
            color={colors.icon}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder={t("discovery.searchPlaceholder")}
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

      <TabButtons activeTab={activeTab} onTabChange={setActiveTab} />
      <FlatList
        data={displayGroups}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ListHeader activeTab={activeTab} myGroupCount={myGroups.length} />
        }
        onRefresh={handleRefetch}
        refreshing={isLoading}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.lightBlue} />
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <GroupDiscoveryCard
            group={item}
            index={index}
            joined={activeTab === "my" || myGroupIds.has(item.id)}
            onJoin={() => handleJoin(item)}
          />
        )}
      />

      <GroupFilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        activeFilters={activeFilters}
        onApply={(newFilters) => {
          setActiveFilters(newFilters);
          setFilterVisible(false);
        }}
      />
    </LinearGradient>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: colors.gradientStart,
    },
    headerBackButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
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

    // Tabs
    tabWrapper: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginBottom: 12,
    },
    tabContainer: {
      flexDirection: "row",
      height: 44,
      borderRadius: 12,
      padding: 4,
      backgroundColor: colors.cardBackground,
    },
    tabButton: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
    },
    tabButtonActive: {
      backgroundColor: colors.surfacePrimary,
      shadowColor: SHADOW_BLACK,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: "600",
    },

    // List header
    listHeader: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    listHeaderTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 6,
    },
    listHeaderSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },

    // List
    listContent: {
      paddingTop: 8,
      paddingBottom: 100,
      paddingHorizontal: 16,
      gap: 16,
    },

    // Loading
    loadingContainer: {
      paddingTop: 60,
      alignItems: "center",
      justifyContent: "center",
    },

    // Discovery card
    discoveryCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    discoveryImageContainer: {
      width: "100%",
      height: 160,
      position: "relative",
    },
    discoveryImage: {
      width: "100%",
      height: "100%",
    },
    matchBadge: {
      position: "absolute",
      top: 12,
      right: 12,
      backgroundColor: colors.matchBadgeBackground,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    matchBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.white,
    },
    discoveryContent: {
      padding: 14,
    },
    discoveryTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      lineHeight: 22,
      marginBottom: 8,
    },
    discoveryMembersRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 8,
    },
    discoveryMembersText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.success,
    },
    discoveryDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 12,
    },
    discoveryFooter: {
      flexDirection: "row",
      alignItems: "center",
    },
    discoveryJoinButton: {
      backgroundColor: colors.lightBlue,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 10,
    },
    discoveryJoinButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.white,
    },
    discoveryJoinedButton: {
      backgroundColor: colors.chipBackground,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 10,
    },
    discoveryJoinedButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    joinedBadge: {
      position: "absolute",
      top: 12,
      right: 12,
      backgroundColor: colors.success,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    joinedBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.white,
    },
  });
