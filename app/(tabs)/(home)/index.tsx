import { GroupOut, SessionOut, SpeakerBriefOut } from "@/api/schemas";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { ThemedText } from "@/components/themed-text";
import { MEDAL_COLORS } from "@/constants/data-colors";
import { getTenantBackgroundSource, getTenantKey } from "@/constants/tenant-assets";
import { useFeatureEnabled } from "@/features/config/hooks/useFeatureEnabled";
import {
  useGetRecommendedGroups,
  useGetRecommendedSessions,
  useGetSpeakers,
  useJoinGroup,
} from "@/features/home/hooks";
import { useGetAvailableInterests } from "@/features/onboarding/hooks/useGetAvailableInterests";
import { useColors } from "@/hooks/use-colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

const AWARDS: {
  tier?: "gold" | "silver" | "bronze";
  title: string;
  category: string;
}[] = [
  { tier: "gold", title: "Global Eventex Awards", category: "Use of Technology" },
  { tier: "silver", title: "Global Eventex Awards", category: "Use of AI" },
  { tier: "silver", title: "Global Eventex Awards", category: "Custom-built Technology" },
  { title: "Conventa Best Event Award", category: "B2B Events" },
  { tier: "silver", title: "Event Awards", category: "Brand Experience – Services" },
  { tier: "silver", title: "Event Awards", category: "Debut Event" },
  { tier: "bronze", title: "Event Awards", category: "Conferences, Meetings, Expos" },
];

const FUTURE_UNFOLD_AWARDS = [
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-01.png"),
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-02.png"),
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-03.png"),
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-04.png"),
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-05.png"),
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-06.png"),
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-07.png"),
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-08.png"),
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-09.png"),
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-10.png"),
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-11.png"),
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-12.png"),
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-13.png"),
  require("@/assets/tenants/future-unfold/awards/future-unfold-vraveia-14.png"),
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);
  const isFutureUnfold = getTenantKey() === "future-unfold";

  const RECOMMENDATION_REASONS = [
    t("home.recommendationFollowAI"),
    t("home.recommendationIndustry"),
    t("home.recommendationInterests"),
    t("home.recommendationRole"),
  ];

  const scheduleEnabled = useFeatureEnabled("schedule");
  const recommendationsEnabled = useFeatureEnabled("recommendations");
  const groupsEnabled = useFeatureEnabled("groups");
  const exhibitorsEnabled = useFeatureEnabled("exhibitors");

  // Fetch recommended sessions
  const {
    data: recommendedSessions = [],
    isLoading: recommendedSessionsLoading,
    refetch: refetchRecommendedSessions,
  } = useGetRecommendedSessions();

  // Fetch available interests
  const { data: interests = [] } = useGetAvailableInterests();

  // Fetch recommended groups
  const {
    data: recommendedGroups = [],
    isLoading: recommendedGroupsLoading,
    refetch: refetchRecommendedGroups,
  } = useGetRecommendedGroups();

  const joinGroup = useJoinGroup();

  const handleJoinGroup = (group: GroupOut) => {
    joinGroup.mutate(
      { group_id: group.id, ref_key: group.ref_key },
      {
        onSuccess: () => {
          Alert.alert(t("home.joinedSuccess"), t("home.joinedSuccessMessage", { title: group.title }));
        },
        onError: () => {
          Alert.alert(t("home.joinError"), t("home.joinErrorMessage"));
        },
      },
    );
  };

  // Fetch speakers
  const {
    data: speakers = [],
    isLoading: speakersLoading,
    refetch: refetchSpeakers,
  } = useGetSpeakers();

  const isLoading =
    recommendedSessionsLoading || recommendedGroupsLoading || speakersLoading;

  const onRefresh = async () => {
    await Promise.all([
      refetchRecommendedSessions(),
      refetchRecommendedGroups(),
      refetchSpeakers(),
    ]);
  };

  return (
    <LinearGradient
      testID="home-screen"
      colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
      style={styles.container}
    >
      {hasBackgroundArt && (
        <TenantBackgroundArt
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {isFutureUnfold && (
              <View style={styles.futureActions}>
                <TouchableOpacity
                  style={styles.futureActionCard}
                  onPress={() => router.push("/agenda")}
                >
                  <Ionicons name="calendar-outline" size={26} color={colors.brand} />
                  <ThemedText style={styles.futureActionTitle}>
                    {t("futureUnfold.agenda")}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.futureActionCard}
                  onPress={() => router.push("/ai-portraits")}
                >
                  <Ionicons name="sparkles" size={26} color={colors.brand} />
                  <ThemedText style={styles.futureActionTitle}>
                    {t("futureUnfold.portraits")}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {isFutureUnfold && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>{t("home.ourAwards")}</ThemedText>
                <FlatList
                  data={FUTURE_UNFOLD_AWARDS}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                  keyExtractor={(_, index) => String(index)}
                  snapToInterval={Math.min(width - 64, 360) + 12}
                  decelerationRate="fast"
                  renderItem={({ item, index }) => (
                    <View
                      style={[
                        styles.futureAwardCard,
                        { width: Math.min(width - 64, 360) },
                      ]}
                    >
                      <Image
                        source={item}
                        style={styles.futureAwardImage}
                        contentFit="contain"
                        accessibilityLabel={t("home.ourAwards") + " " + (index + 1) + " / " + FUTURE_UNFOLD_AWARDS.length}
                      />
                    </View>
                  )}
                />
              </View>
            )}

            {/* For You Section */}
            {scheduleEnabled && recommendationsEnabled && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText style={styles.sectionTitleInline}>
                    {t("home.forYou")}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/(schedule)")}
                  >
                    <ThemedText style={styles.viewAllText}>{t("home.seeAll")}</ThemedText>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={recommendedSessions}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item, index }) => (
                    <ForYouCard
                      session={item}
                      recommendationReason={
                        RECOMMENDATION_REASONS[
                          index % RECOMMENDATION_REASONS.length
                        ]
                      }
                      onPress={() => router.push(`/session/${item.id}`)}
                    />
                  )}
                />
              </View>
            )}

            {/* Recommended Groups Section */}
            {groupsEnabled && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText style={styles.sectionTitleInline}>
                    {t("home.recommendedGroups")}
                  </ThemedText>
                  <TouchableOpacity onPress={() => router.push("/discovery")}>
                    <ThemedText style={styles.viewAllText}>{t("home.seeAll")}</ThemedText>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={recommendedGroups.slice(0, 5)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item, index }) => (
                    <GroupCard
                      group={item}
                      recommendationReason={
                        index % 2 === 0
                          ? t("home.recommendationBecauseInterests")
                          : t("home.recommendationForIndustry")
                      }
                      onJoin={() => handleJoinGroup(item)}
                      isLoading={
                        joinGroup.isPending &&
                        joinGroup.variables?.group_id === item.id
                      }
                    />
                  )}
                />
              </View>
            )}

            {/* Our Awards Section */}
            {!isFutureUnfold && <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{t("home.ourAwards")}</ThemedText>
              <FlatList
                data={AWARDS}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalListContent}
                keyExtractor={(item) => `${item.title}-${item.category}`}
                renderItem={({ item }) => <AwardCard award={item} />}
              />
            </View>}

            {/* Speakers Section */}
            {exhibitorsEnabled && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>{t("home.speakers")}</ThemedText>
                <FlatList
                  data={speakers}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                  keyExtractor={(item) => item.user_id.toString()}
                  renderItem={({ item }) => (
                    <SpeakerCard
                      speaker={item}
                      onPress={() => router.push(`/user/${item.user_id}`)}
                    />
                  )}
                />
              </View>
            )}

            {/* Tech Trails Section */}
            {(groupsEnabled || recommendationsEnabled) && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>{t("home.techTrails")}</ThemedText>
                <View style={styles.interestsContainer}>
                  {interests.map((interest) => (
                    <InterestChip key={interest.id} interest={interest} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

// For You Card Component
function ForYouCard({
  session,
  recommendationReason,
  onPress,
}: {
  session: SessionOut;
  recommendationReason: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const speaker = session.speakers[0];

  return (
    <Pressable style={styles.forYouCard} onPress={onPress}>
      {/* Image */}
      <View style={styles.forYouImageContainer}>
        {session.image_url ? (
          <Image
            source={{ uri: session.image_url }}
            style={styles.forYouImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.forYouImage, styles.forYouImagePlaceholder]}>
            <MaterialIcons
              name="account-balance"
              size={40}
              color={colors.textSecondary}
            />
          </View>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.forYouImageOverlay}
        />
      </View>

      {/* Content */}
      <View style={styles.forYouContent}>
        <ThemedText style={styles.forYouRecommendation}>{recommendationReason}</ThemedText>
        <ThemedText style={styles.forYouTitle} numberOfLines={2}>
          {session.title}
        </ThemedText>

        <View style={styles.forYouFooter}>
          <View style={styles.forYouInfo}>
            {speaker && (
              <View style={styles.forYouSpeakerRow}>
                <Ionicons
                  name="person"
                  size={12}
                  color={colors.textSecondary}
                />
                <ThemedText style={styles.forYouSpeakerText}>
                  {speaker.full_name}
                </ThemedText>
              </View>
            )}
            {session.venue && (
              <View style={styles.forYouVenueRow}>
                <Ionicons
                  name="location"
                  size={12}
                  color={colors.textSecondary}
                />
                <ThemedText style={styles.forYouVenueText}>{session.venue.name}</ThemedText>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.viewSessionButton} onPress={onPress}>
            <ThemedText style={styles.viewSessionButtonText}>{t("home.viewSession")}</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

// Group Card Component
function GroupCard({
  group,
  recommendationReason,
  onJoin,
  isLoading,
}: {
  group: GroupOut;
  recommendationReason: string;
  onJoin: () => void;
  isLoading?: boolean;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.groupCard}>
      <View style={styles.groupCardContent}>
        <ThemedText style={styles.groupRecommendation}>{recommendationReason}</ThemedText>
        <ThemedText style={styles.groupTitle} numberOfLines={2}>
          {group.title}
        </ThemedText>
        <View style={styles.groupMembersRow}>
          <Ionicons name="people" size={14} color={colors.textSecondary} />
          <ThemedText style={styles.groupMembersText}>
            {t("home.members", { count: group.member_count })}
          </ThemedText>
        </View>
      </View>
      <TouchableOpacity
        style={styles.joinButton}
        onPress={onJoin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <ThemedText style={styles.joinButtonText}>{t("home.join")}</ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
}

// Speaker Card Component
function SpeakerCard({
  speaker,
  onPress,
}: {
  speaker: SpeakerBriefOut;
  onPress: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <TouchableOpacity style={styles.exhibitorCard} onPress={onPress}>
      <View style={styles.exhibitorIconContainer}>
        {speaker.avatar_url ? (
          <Image
            source={{ uri: speaker.avatar_url }}
            style={styles.exhibitorAvatar}
            contentFit="cover"
          />
        ) : (
          <ThemedText style={styles.exhibitorInitials}>
            {getInitials(speaker.full_name)}
          </ThemedText>
        )}
      </View>
      <ThemedText style={styles.exhibitorName} numberOfLines={1}>
        {speaker.full_name}
      </ThemedText>
      {speaker.company && (
        <ThemedText style={styles.speakerCompany} numberOfLines={1}>
          {speaker.company}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

// Award Card Component
function AwardCard({
  award,
}: {
  award: { tier?: "gold" | "silver" | "bronze"; title: string; category: string };
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tierColor = award.tier ? MEDAL_COLORS[award.tier] : colors.primary;

  return (
    <View style={styles.awardCard}>
      <View style={[styles.awardIconWrap, { backgroundColor: `${tierColor}22` }]}>
        <Ionicons name="trophy" size={22} color={tierColor} />
      </View>
      {award.tier && (
        <ThemedText style={[styles.awardTier, { color: tierColor }]}>
          {award.tier.toUpperCase()}
        </ThemedText>
      )}
      <ThemedText style={styles.awardTitle} numberOfLines={2}>
        {award.title}
      </ThemedText>
      <ThemedText style={styles.awardCategory} numberOfLines={2}>
        {award.category}
      </ThemedText>
    </View>
  );
}

// Interest Chip Component
function InterestChip({
  interest,
}: {
  interest: { id: number; name: string };
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[styles.interestChip, { backgroundColor: colors.chipBackground }]}
    >
      <ThemedText style={[styles.interestChipText, { color: colors.text }]}>
        {interest.name}
      </ThemedText>
    </View>
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 8,
      paddingBottom: 100,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 100,
    },
    futureActions: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    futureActionCard: {
      flex: 1,
      minHeight: 104,
      borderRadius: 16,
      padding: 16,
      justifyContent: "space-between",
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    futureActionTitle: {
      marginTop: 14,
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },

    futureAwardCard: {
      height: 280,
      borderRadius: 16,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: "hidden",
    },
    futureAwardImage: {
      width: "100%",
      height: "100%",
    },

    // Sections
    section: {
      marginBottom: 24,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    sectionTitleInline: {
      fontSize: 20,
      fontWeight: "700",
    },
    viewAllText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600",
    },
    horizontalListContent: {
      paddingHorizontal: 16,
      gap: 12,
    },
    loadingMoreContainer: {
      width: 72,
      justifyContent: "center",
      alignItems: "center",
    },

    // For You Card
    forYouCard: {
      width: 300,
      height: 290,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    forYouImageContainer: {
      width: "100%",
      height: 140,
      position: "relative",
    },
    forYouImage: {
      width: "100%",
      height: "100%",
    },
    forYouImagePlaceholder: {
      backgroundColor: colors.chipBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    forYouImageOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
    },
    forYouContent: {
      flex: 1,
      padding: 12,
    },
    forYouRecommendation: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.recommendationLabel,
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    forYouTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      lineHeight: 22,
      marginBottom: 12,
    },
    forYouFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginTop: "auto",
    },
    forYouInfo: {
      flex: 1,
      marginRight: 8,
    },
    forYouSpeakerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 4,
    },
    forYouSpeakerText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    forYouVenueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    forYouVenueText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    viewSessionButton: {
      backgroundColor: colors.lightBlue,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    viewSessionButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.white,
    },

    // Group Card
    groupCard: {
      width: 250,
      height: 180,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      justifyContent: "space-between",
    },
    groupCardContent: {
      flex: 1,
    },
    groupRecommendation: {
      fontSize: 9,
      fontWeight: "600",
      color: colors.recommendationLabel,
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    groupTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      lineHeight: 22,
      marginBottom: 8,
    },
    groupMembersRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    groupMembersText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    joinButton: {
      backgroundColor: colors.lightBlue,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    joinButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.white,
    },

    // Exhibitor Card
    exhibitorCard: {
      width: 100,
      alignItems: "center",
    },
    exhibitorIconContainer: {
      width: 72,
      height: 72,
      borderRadius: 16,
      backgroundColor: colors.exhibitorCardBackground,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 8,
      overflow: "hidden",
    },
    exhibitorAvatar: {
      width: "100%",
      height: "100%",
    },
    exhibitorInitials: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.primary,
    },
    exhibitorName: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.text,
      textAlign: "center",
      width: "100%",
    },
    speakerCompany: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: "center",
      width: "100%",
      marginTop: 2,
    },

    // Award Card
    awardCard: {
      width: 140,
      padding: 14,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    awardIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    awardTier: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    awardTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    awardCategory: {
      fontSize: 11,
      color: colors.textSecondary,
    },

    // Interests
    interestsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 16,
      gap: 8,
    },
    interestChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    interestChipText: {
      fontSize: 13,
      fontWeight: "500",
    },
  });
