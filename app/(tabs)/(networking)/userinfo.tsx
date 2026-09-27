import { SessionBriefOut } from "@/api/schemas";
import {
  COMMON_INTEREST_COLORS,
  GROUP_FALLBACK_COLORS,
  MATCH_STRENGTH_COLORS,
  ROLE_COLORS,
} from "@/constants/data-colors";
import { LINKEDIN_BRAND, COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { useGetMatchingUsers } from "@/features/matching/hooks/useGetMatchingUsers";
import { useGetUser } from "@/features/matching/hooks/useGetUser";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  speaker: { label: "SPEAKER", icon: "mic", color: ROLE_COLORS.speaker },
  exhibitor: {
    label: "EXHIBITOR",
    icon: "storefront-outline",
    color: ROLE_COLORS.exhibitor,
  },
  admin: { label: "ADMIN", icon: "shield-checkmark", color: ROLE_COLORS.admin },
  attendee: { label: "ATTENDEE", icon: "person", color: ROLE_COLORS.attendee },
};

const getMatchLabel = (score: number) => {
  if (score >= 90) return { label: "Excellent", color: MATCH_STRENGTH_COLORS.excellent };
  if (score >= 70) return { label: "Great", color: MATCH_STRENGTH_COLORS.great };
  if (score >= 50) return { label: "Good", color: MATCH_STRENGTH_COLORS.good };
  return { label: "Fair", color: MATCH_STRENGTH_COLORS.fair };
};

export default function UserProfileScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const GROUP_COLORS = [colors.brand, ...GROUP_FALLBACK_COLORS.slice(1)];
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  // Theme-aware colors — all resolve from active palette via useColors().
  const backgroundColor = colors.surfacePrimary;
  const cardBg = colors.surfaceSecondary;
  const textColor = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const borderColor = colors.border;
  const tagBg = colors.chipBackground;
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const parsedUserId = userId ? parseInt(userId, 10) : 0;

  const {
    data: userProfile,
    isLoading: loadingProfile,
    error: profileError,
    refetch,
  } = useGetUser(parsedUserId);

  const { data: matchingUsers } = useGetMatchingUsers();

  const matchData = matchingUsers?.find(
    (u) => u.user_id === parsedUserId,
  );

  const user = useMemo(() => {
    if (!userProfile) return null;
    return {
      ...userProfile,
      user_id: userProfile.id,
      match_score: matchData?.match_score ?? 0,
      common_interests: matchData?.common_interests ?? [],
      common_groups: matchData?.common_groups ?? [],
      common_goals: matchData?.common_goals ?? [],
      common_discussion_topics: matchData?.common_discussion_topics ?? [],
      same_level: matchData?.same_level ?? false,
    };
  }, [userProfile, matchData]);

  const loading = loadingProfile;
  const error = profileError
    ? profileError instanceof Error
      ? profileError.message
      : "Failed to load profile"
    : null;

  const handleLinkedIn = useCallback(() => {
    if (!user?.linkedin_url) return;
    const raw = user.linkedin_url.trim();
    const url = raw.startsWith("http") ? raw : `https://${raw}`;
    const isValid = /^https?:\/\/(www\.)?linkedin\.com\/.+/.test(url);
    if (!isValid) {
      Alert.alert(t("networking.userinfo.invalidLinkedIn"));
      return;
    }
    Linking.openURL(url);
  }, [t, user]);

  const handleMessage = useCallback(() => {
    if (!user) return;
    router.push({
      pathname: "/dm-chat",
      params: {
        user_id: String(user.user_id),
        name: user.full_name,
      },
    });
  }, [user, router]);

  const handleRequestMeeting = useCallback(() => {
    router.push({
      pathname: "/schedule",
      params: { userId: user?.user_id },
    });
  }, [router, user?.user_id]);

  const handleMyProgramme = useCallback(() => {
    router.push({
      pathname: "/exhibitor-programme",
      params: { userId: user?.user_id?.toString() },
    });
  }, [router, user?.user_id]);

  const handleSessionPress = useCallback(
    (session: SessionBriefOut) => {
      router.push({
        pathname: "/session/[id]",
        params: { id: session.id.toString() },
      });
    },
    [router],
  );

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getRoleConfig = (role: string) => {
    return ROLE_CONFIG[role.toLowerCase()] || ROLE_CONFIG.attendee;
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor }]}>
        <Stack.Screen options={{ title: t("networking.userinfo.profileHeader"), headerShown: false }} />
        <ActivityIndicator size="large" color={colors.brand} />
        <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
          {t("networking.userinfo.loading")}
        </ThemedText>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={[styles.centerContainer, { backgroundColor }]}>
        <Stack.Screen options={{ title: t("networking.userinfo.profileHeader"), headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={48} color={textSecondary} />
        <ThemedText style={[styles.errorText, { color: textColor }]}>
          {error ?? t("networking.userinfo.profileNotFound")}
        </ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <ThemedText style={styles.retryButtonText}>{t("networking.userinfo.retry")}</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const roleConfig = getRoleConfig(user.role);
  const matchInfo = getMatchLabel(user.match_score);
  const sharedGroupsText = user.common_groups?.join(", ") || "";
  const mutualSessionsCount = user.sessions?.length ?? 0;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.backgroundGradients}>
        <View
          style={[styles.gradientTopRight, { backgroundColor: colors.brand }]}
        />
        <View
          style={[
            styles.gradientBottomLeft,
            { backgroundColor: ROLE_COLORS.speaker },
          ]}
        />
      </View>

      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: `${backgroundColor}CC`, paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textSecondary }]}>
          {t("networking.userinfo.profileHeader")}
        </ThemedText>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View
                style={[styles.avatarPlaceholder, { backgroundColor: tagBg }]}
              >
                <ThemedText style={[styles.avatarInitial, { color: textSecondary }]}>
                  {(user.full_name || "?").charAt(0)}
                </ThemedText>
              </View>
            )}
            <View style={styles.onlineIndicator} />
          </View>

          <ThemedText style={[styles.profileName, { color: textColor }]}>
            {user.full_name}
          </ThemedText>

          {user.company && (
            <ThemedText style={[styles.profileCompany, { color: textSecondary }]}>
              {user.company}
            </ThemedText>
          )}

          {/* Role Badge */}
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: `${roleConfig.color}15`,
                borderColor: `${roleConfig.color}30`,
              },
            ]}
          >
            <Ionicons
              name={roleConfig.icon as keyof typeof Ionicons.glyphMap}
              size={14}
              color={roleConfig.color}
            />
            <ThemedText style={[styles.roleBadgeText, { color: roleConfig.color }]}>
              {roleConfig.label}
            </ThemedText>
          </View>

          {/* LinkedIn Button */}
          {user.linkedin_url && (
            <TouchableOpacity
              style={styles.linkedinButton}
              onPress={handleLinkedIn}
            >
              <Ionicons name="logo-linkedin" size={20} color={LINKEDIN_BRAND} />
              <ThemedText style={styles.linkedinButtonText}>{t("networking.userinfo.viewLinkedIn")}</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Interests Section */}
        {user.interests && user.interests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={20} color={ROLE_COLORS.speaker} />
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                {t("networking.userinfo.interests")}
              </ThemedText>
            </View>
            <View style={styles.tagsContainer}>
              {user.interests.map((interest, index) => (
                <View
                  key={index}
                  style={[
                    styles.interestTag,
                    { backgroundColor: tagBg, borderColor },
                  ]}
                >
                  <ThemedText style={[styles.interestTagText, { color: textColor }]}>
                    {interest}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Groups in Common Section */}
        {user.common_groups && user.common_groups.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithAction}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={20} color={textSecondary} />
                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                  {t("networking.userinfo.groupsInCommon")}
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/discovery")}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.seeAllText}>{t("networking.userinfo.seeAll")}</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.groupsContainer}>
              {user.common_groups.map((group, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.groupCard,
                    { backgroundColor: cardBg, borderColor },
                  ]}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.groupLetterIcon,
                      {
                        backgroundColor: `${GROUP_COLORS[index % GROUP_COLORS.length]}20`,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.groupLetterText,
                        {
                          color: GROUP_COLORS[index % GROUP_COLORS.length],
                        },
                      ]}
                    >
                      {group.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={styles.groupInfo}>
                    <ThemedText
                      style={[styles.groupName, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {group}
                    </ThemedText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Match Insights Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionLabel, { color: textSecondary }]}>
            {t("networking.userinfo.matchInsights")}
          </ThemedText>

          <View
            style={[styles.matchCard, { backgroundColor: cardBg, borderColor }]}
          >
            <View style={styles.matchCardHeader}>
              <ThemedText style={[styles.matchCardLabel, { color: textSecondary }]}>
                {t("networking.userinfo.overallFit")}
              </ThemedText>
              <Ionicons name="copy-outline" size={16} color={textSecondary} />
            </View>
            <View style={styles.matchScoreRow}>
              <ThemedText style={[styles.matchScoreText, { color: textColor }]}>
                {user.match_score}%
              </ThemedText>
              <ThemedText
                style={[styles.matchScoreLabel, { color: matchInfo.color }]}
              >
                {matchInfo.label}
              </ThemedText>
            </View>
          </View>

          <View style={styles.matchDetailsContainer}>
            {sharedGroupsText.length > 0 && (
              <View
                style={[
                  styles.matchDetailRow,
                  { backgroundColor: cardBg, borderColor },
                ]}
              >
                <View style={styles.matchDetailLeft}>
                  <Ionicons
                    name="people-outline"
                    size={18}
                    color={textSecondary}
                  />
                  <ThemedText
                    style={[styles.matchDetailLabel, { color: textSecondary }]}
                  >
                    {t("networking.userinfo.sharedGroups")}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[styles.matchDetailValue, { color: textColor }]}
                  numberOfLines={1}
                >
                  {sharedGroupsText}
                </ThemedText>
              </View>
            )}

            {mutualSessionsCount > 0 && (
              <View
                style={[
                  styles.matchDetailRow,
                  { backgroundColor: cardBg, borderColor },
                ]}
              >
                <View style={styles.matchDetailLeft}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={textSecondary}
                  />
                  <ThemedText
                    style={[styles.matchDetailLabel, { color: textSecondary }]}
                  >
                    {t("networking.userinfo.mutualSessions")}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.matchDetailValue, { color: textColor }]}>
                  {t("networking.userinfo.sessionsCount", { count: mutualSessionsCount })}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Common Interests Section */}
        {user.common_interests && user.common_interests.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionLabel, { color: textSecondary }]}>
              {t("networking.userinfo.commonInterests")}
            </ThemedText>
            <View style={styles.tagsContainer}>
              {user.common_interests.map((interest, index) => {
                const colorSet =
                  COMMON_INTEREST_COLORS[index % COMMON_INTEREST_COLORS.length];
                return (
                  <View
                    key={index}
                    style={[
                      styles.commonInterestTag,
                      {
                        backgroundColor: colorSet.bg,
                        borderColor: colorSet.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.commonInterestTagText,
                        { color: colorSet.text },
                      ]}
                    >
                      {interest}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Sessions Section (for speakers) */}
        {user.sessions && user.sessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color={colors.brand} />
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                {t("networking.userinfo.sessionsSection")}
              </ThemedText>
            </View>
            <View style={styles.sessionsContainer}>
              {user.sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    styles.sessionCard,
                    { backgroundColor: cardBg, borderColor },
                  ]}
                  onPress={() => handleSessionPress(session)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.sessionIcon,
                      { backgroundColor: "rgba(25, 79, 240, 0.1)" },
                    ]}
                  >
                    <Ionicons name="mic-outline" size={22} color={colors.brand} />
                  </View>
                  <View style={styles.sessionInfo}>
                    <ThemedText
                      style={[styles.sessionTitle, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {session.title}
                    </ThemedText>
                    <ThemedText
                      style={[styles.sessionMeta, { color: textSecondary }]}
                    >
                      {formatDate(session.start_time)} •{" "}
                      {formatTime(session.start_time)}
                      {session.venue_name && ` • ${session.venue_name}`}
                    </ThemedText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {user.role === "exhibitor" ? (
            <TouchableOpacity
              style={styles.requestMeetingButton}
              onPress={handleMyProgramme}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.text}
              />
              <ThemedText style={styles.requestMeetingButtonText}>{t("networking.userinfo.myProgramme")}</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.requestMeetingButton}
              onPress={handleRequestMeeting}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.text}
              />
              <ThemedText style={styles.requestMeetingButtonText}>
                {t("networking.userinfo.requestMeeting")}
              </ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.messageButton, { borderColor }]}
            onPress={handleMessage}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble" size={18} color={textColor} />
            <ThemedText style={[styles.messageButtonText, { color: textColor }]}>
              {t("networking.userinfo.message")}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  backgroundGradients: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    opacity: 0.3,
    overflow: "hidden",
  },
  gradientTopRight: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.3,
  },
  gradientBottomLeft: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  // Profile Header
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: `${colors.brand}1A`,
  },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: `${colors.brand}1A`,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: "700",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surfacePrimary,
  },
  linkedinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0, 119, 181, 0.1)",
  },
  linkedinButtonText: {
    color: LINKEDIN_BRAND,
    fontSize: 14,
    fontWeight: "600",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  profileCompany: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionHeaderWithAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.primary,
  },
  // Interests
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  interestTagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Groups
  groupsContainer: {
    gap: 10,
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  groupLetterIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  groupLetterText: {
    fontSize: 18,
    fontWeight: "700",
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: "700",
  },
  // Match Insights
  matchCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
  },
  matchCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  matchCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  matchScoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },
  matchScoreText: {
    fontSize: 42,
    fontWeight: "800",
  },
  matchScoreLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  matchDetailsContainer: {
    gap: 10,
  },
  matchDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  matchDetailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchDetailLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  matchDetailValue: {
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
    maxWidth: "50%",
  },
  // Common Interests
  commonInterestTag: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  commonInterestTagText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // Sessions
  sessionsContainer: {
    gap: 12,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sessionMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  // Action Buttons
  actionButtons: {
    paddingHorizontal: 24,
    gap: 12,
  },
  requestMeetingButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  requestMeetingButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  messageButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
