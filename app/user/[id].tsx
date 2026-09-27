import { getUser } from "@/api/features/user";
import {
  blockUser,
  reportUser,
  unblockUser,
} from "@/api/features/user-actions";
import { SessionBriefOut, UserProfileOut } from "@/api/schemas";
import { ExhibitorProfile } from "@/components/exhibitor-profile";
import { ReportModal } from "@/components/report-modal";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

import {
  attendeeStyles as a,
  formatDate,
  formatTime,
  getRoleConfig,
  MOCK_GROUPS,
} from "@/components/user-profile-constants";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const colors = useColors();
  const styles = getStyles(colors);
  const backgroundColor = colors.background;
  const cardBg = colors.cardBackground;
  const textColor = colors.text;
  const textSecondary = colors.textSecondary;
  const borderColor = colors.cardBorder;
  const tagBg = colors.chipBackground;

  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<UserProfileOut | null>(null);
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const isOwnProfile = user?.id === currentUser?.id;

  // Handle three-dot menu
  const handleMoreMenu = useCallback(() => {
    if (!user || isOwnProfile) return;
    setShowOptionsMenu(true);
  }, [user, isOwnProfile]);

  const handleBlockPress = useCallback(() => {
    if (!user) return;
    setShowOptionsMenu(false);
    if (isBlocked) {
      Alert.alert(
        t("settings.userUnblockTitle"),
        t("settings.userUnblockConfirm", { name: user.full_name }),
        [
          { text: t("settings.userCancel"), style: "cancel" },
          {
            text: t("settings.userUnblockButton"),
            onPress: async () => {
              try {
                await unblockUser(user.id);
                setIsBlocked(false);
              } catch {
                Alert.alert("Error", t("settings.userUnblockFailed"));
              }
            },
          },
        ],
      );
    } else {
      Alert.alert(
        t("settings.userBlockTitle", { name: user.full_name }),
        t("settings.userBlockMessage"),
        [
          { text: t("settings.userCancel"), style: "cancel" },
          {
            text: t("settings.userBlockButton"),
            style: "destructive",
            onPress: async () => {
              try {
                await blockUser(user.id);
                setIsBlocked(true);
              } catch {
                Alert.alert("Error", t("settings.userBlockFailed"));
              }
            },
          },
        ],
      );
    }
  }, [user, isBlocked, t]);

  const handleReportPress = useCallback(() => {
    setShowOptionsMenu(false);
    setShowReportModal(true);
  }, []);

  // Handle report submission
  const handleSubmitReport = useCallback(
    async (reason: string, details: string) => {
      if (!user || !reason) return;
      setSubmittingReport(true);
      try {
        await reportUser(user.id, reason, details || undefined);
        setShowReportModal(false);
        Alert.alert(
          t("settings.reportSubmitted"),
          t("settings.reportSubmittedMessage"),
        );
      } catch {
        Alert.alert(
          t("settings.reportError"),
          t("settings.reportErrorMessage"),
        );
      } finally {
        setSubmittingReport(false);
      }
    },
    [t, user],
  );

  // Load user data
  const loadUser = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getUser(parseInt(id, 10));
      setUser(data);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to load profile";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Handle LinkedIn
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
  }, [t, user?.linkedin_url]);

  // Handle Message
  const handleMessage = useCallback(() => {
    if (!user) return;
    router.push({
      pathname: "/dm-chat",
      params: {
        user_id: String(user.id),
        name: user.full_name,
      },
    });
  }, [user, router]);

  // Handle Request Meeting
  const handleRequestMeeting = useCallback(() => {
    if (!user) return;
    router.push({
      pathname: "/(tabs)/(networking)/schedule",
      params: { userId: String(user.id) },
    } as never);
  }, [user, router]);

  // Handle session press
  const handleSessionPress = useCallback(
    (session: SessionBriefOut) => {
      router.push({
        pathname: "/session/[id]",
        params: { id: session.id.toString() },
      });
    },
    [router],
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor }]}>
        <Stack.Screen options={{ title: "Profile", headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
          {t("networking.userinfo.loading")}
        </ThemedText>
      </View>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <View style={[styles.centerContainer, { backgroundColor }]}>
        <Stack.Screen options={{ title: "Error", headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={48} color={textSecondary} />
        <ThemedText style={[styles.errorText, { color: textColor }]}>
          {error ?? t("networking.userinfo.profileNotFound")}
        </ThemedText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadUser}
        >
          <ThemedText style={styles.retryButtonText}>
            {t("networking.userinfo.retry")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const roleConfig = getRoleConfig(user.role);

  // ============================================
  // EXHIBITOR PROFILE LAYOUT
  // ============================================
  if (user.role === "exhibitor") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ExhibitorProfile
          user={user}
          isOwnProfile={isOwnProfile}
          onBack={() => router.back()}
          onMoreMenu={handleMoreMenu}
          onRequestMeeting={handleRequestMeeting}
          onMessage={handleMessage}
          sharedStyles={styles}
        />
        <ReportModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleSubmitReport}
          submitting={submittingReport}
          targetName={user.full_name}
        />
        {/* Options Bottom Sheet */}
        <Modal visible={showOptionsMenu} transparent animationType="fade" onRequestClose={() => setShowOptionsMenu(false)}>
          <Pressable style={optMenuStyles.overlay} onPress={() => setShowOptionsMenu(false)}>
            <View style={[optMenuStyles.sheet, { backgroundColor: colors.cardBackground, paddingBottom: insets.bottom + 24 }]}>
              <TouchableOpacity style={[optMenuStyles.option, { borderBottomColor: colors.cardBorder }]} onPress={handleReportPress}>
                <Ionicons name="flag-outline" size={22} color={colors.text} />
                <ThemedText style={[optMenuStyles.optionText, { color: colors.text }]}>{t("settings.userReportUser")}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[optMenuStyles.option, { borderBottomColor: colors.cardBorder }]} onPress={handleBlockPress}>
                <Ionicons name={isBlocked ? "lock-open-outline" : "ban-outline"} size={22} color={colors.error} />
                <ThemedText style={[optMenuStyles.optionText, { color: colors.error }]}>{isBlocked ? t("settings.userUnblockUser") : t("settings.userBlockUser")}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={optMenuStyles.option} onPress={() => setShowOptionsMenu(false)}>
                <Ionicons name="close-outline" size={22} color={colors.textSecondary} />
                <ThemedText style={[optMenuStyles.optionText, { color: colors.textSecondary }]}>{t("settings.userCancel")}</ThemedText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </>
    );
  }

  // ============================================
  // DEFAULT PROFILE LAYOUT (non-exhibitor)
  // ============================================
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background Gradients */}
      <View style={a.backgroundGradients}>
        <View
          style={[a.gradientTopRight, { backgroundColor: colors.primary }]}
        />
        <View style={[a.gradientBottomLeft, { backgroundColor: colors.followUp }]} />
      </View>

      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: `${backgroundColor}CC`, paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textSecondary }]}>
          {t("networking.userinfo.profileHeader")}
        </ThemedText>
        {!isOwnProfile ? (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMoreMenu}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={textColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={a.profileHeader}>
          <View style={a.avatarContainer}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={a.avatar} />
            ) : (
              <View style={[a.avatarPlaceholder, { backgroundColor: tagBg }]}>
                <ThemedText style={[styles.avatarInitial, { color: textSecondary }]}>
                  {(user.full_name || "?").charAt(0)}
                </ThemedText>
              </View>
            )}
            <View style={[a.onlineIndicator, { borderColor: backgroundColor }]} />
          </View>

          <ThemedText style={[a.profileName, { color: textColor }]}>
            {user.full_name}
          </ThemedText>

          {user.company && (
            <ThemedText style={[a.profileRole, { color: textSecondary }]}>
              {user.company}
            </ThemedText>
          )}

          {/* Role Badge */}
          <View
            style={[
              a.roleBadge,
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
            <ThemedText style={[a.roleBadgeText, { color: roleConfig.color }]}>
              {roleConfig.label}
            </ThemedText>
          </View>

          {/* LinkedIn Button */}
          {user.linkedin_url && (
            <TouchableOpacity style={a.linkedinButton} onPress={handleLinkedIn}>
              <Ionicons name="logo-linkedin" size={20} color={colors.link} />
              <ThemedText style={a.linkedinButtonText}>
                {t("networking.userinfo.viewLinkedIn")}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: borderColor }]} />

        {/* Bio Section */}
        {user.bio && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.primary}
              />
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                {t("settings.userAbout")}
              </ThemedText>
            </View>
            <ThemedText style={[styles.bioText, { color: textSecondary }]}>
              {user.bio}
            </ThemedText>
          </View>
        )}

        {/* Interests Section */}
        {user.interests && user.interests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={20} color={colors.primary} />
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                {t("networking.userinfo.interests")}
              </ThemedText>
            </View>
            <View style={a.tagsContainer}>
              {user.interests.map((interest, index) => (
                <View
                  key={index}
                  style={[
                    a.interestTag,
                    { backgroundColor: tagBg, borderColor },
                  ]}
                >
                  <ThemedText style={[a.interestTagText, { color: textColor }]}>
                    {interest}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sessions Section (for speakers) */}
        {user.sessions && user.sessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                {t("networking.userinfo.sessionsSection")}
              </ThemedText>
            </View>
            <View style={a.sessionsContainer}>
              {user.sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    a.sessionCard,
                    { backgroundColor: cardBg, borderColor },
                  ]}
                  onPress={() => handleSessionPress(session)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      a.sessionIcon,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Ionicons
                      name="mic-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={a.sessionInfo}>
                    <ThemedText
                      style={[a.sessionTitle, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {session.title}
                    </ThemedText>
                    <ThemedText style={[a.sessionMeta, { color: textSecondary }]}>
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

        {/* Groups in Common Section -- TODO: replace MOCK_GROUPS with real API data */}
        {__DEV__ && user.id !== currentUser?.id ? (
          <View style={styles.section}>
            <View style={a.sectionHeaderWithAction}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="people-outline"
                  size={20}
                  color={colors.primary}
                />
                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                  {t("networking.userinfo.groupsInCommon")}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => router.push("/discovery" as never)}>
                <ThemedText style={[a.seeAllText, { color: colors.primary }]}>
                  {t("networking.userinfo.seeAll")}
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={a.groupsContainer}>
              {MOCK_GROUPS.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    a.groupCard,
                    { backgroundColor: cardBg, borderColor },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: "/group-details", params: { id: String(group.id), title: group.name } } as never)}
                >
                  <View
                    style={[
                      a.groupIcon,
                      { backgroundColor: `${group.color}15` },
                    ]}
                  >
                    <Ionicons
                      name={group.icon as keyof typeof Ionicons.glyphMap}
                      size={22}
                      color={group.color}
                    />
                  </View>
                  <View style={a.groupInfo}>
                    <ThemedText
                      style={[a.groupName, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {group.name}
                    </ThemedText>
                    <ThemedText style={[a.groupMeta, { color: textSecondary }]}>
                      {group.members} members • {group.status}
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
        ) : null}

        {/* Spacer for bottom bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      {user.id !== currentUser?.id ? (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[a.messageButton, { borderColor }]}
            onPress={handleMessage}
          >
            <Ionicons name="chatbubble-outline" size={20} color={textColor} />
            <ThemedText style={[a.messageButtonText, { color: textColor }]}>
              {t("networking.userinfo.message")}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={a.meetingButton}
            onPress={handleRequestMeeting}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.background} />
            <ThemedText style={a.meetingButtonText}>
              {t("networking.userinfo.requestMeeting")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleSubmitReport}
        submitting={submittingReport}
        targetName={user.full_name}
      />
      {/* Options Bottom Sheet */}
      <Modal visible={showOptionsMenu} transparent animationType="fade" onRequestClose={() => setShowOptionsMenu(false)}>
        <Pressable style={optMenuStyles.overlay} onPress={() => setShowOptionsMenu(false)}>
          <View style={[optMenuStyles.sheet, { backgroundColor: colors.cardBackground, paddingBottom: insets.bottom + 24 }]}>
            <TouchableOpacity style={[optMenuStyles.option, { borderBottomColor: colors.cardBorder }]} onPress={handleReportPress}>
              <Ionicons name="flag-outline" size={22} color={colors.text} />
              <ThemedText style={[optMenuStyles.optionText, { color: colors.text }]}>{t("settings.userReportUser")}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[optMenuStyles.option, { borderBottomColor: colors.cardBorder }]} onPress={handleBlockPress}>
              <Ionicons name={isBlocked ? "lock-open-outline" : "ban-outline"} size={22} color={colors.error} />
              <ThemedText style={[optMenuStyles.optionText, { color: colors.error }]}>{isBlocked ? t("settings.userUnblockUser") : t("settings.userBlockUser")}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={optMenuStyles.option} onPress={() => setShowOptionsMenu(false)}>
              <Ionicons name="close-outline" size={22} color={colors.textSecondary} />
              <ThemedText style={[optMenuStyles.optionText, { color: colors.textSecondary }]}>{t("settings.userCancel")}</ThemedText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============================================
// SHARED STYLES
// ============================================
const getStyles = (colors: any) =>
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
    // Header
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
    // Scroll
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 8,
    },
    avatarInitial: {
      fontSize: 40,
      fontWeight: "700",
    },
    // Divider
    divider: {
      height: 1,
      marginHorizontal: 24,
      marginBottom: 24,
    },
    // Sections
    section: {
      paddingHorizontal: 24,
      marginBottom: 32,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    // Bio
    bioText: {
      fontSize: 16,
      lineHeight: 24,
    },
    // Bottom Bar
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 16,
      backgroundColor: "rgba(16, 21, 34, 0.85)",
      borderTopWidth: 1,
      borderTopColor: "rgba(255, 255, 255, 0.08)",
    },
  });

const optMenuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 48,
    paddingHorizontal: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
