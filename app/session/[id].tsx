import {
  addFavorite,
  getMyAgenda,
  getSession,
  removeFavorite,
} from "@/api/features/program";
import { FeatureGate } from "@/components/feature-gate";
import { UserRole } from "@/api/schemas";
import type { SessionDetailOut, SpeakerBriefOut } from "@/api/schemas";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useGetExhibitorSessions } from "@/features/exhibitors/hooks/useGetExhibitorSessions";
import { PollCard } from "@/features/polls/components";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  AnimatedScrollView,
  HeaderNavBar,
} from "@/components/templates/parallax-header";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

// Map session types to hero-badge colors (solid tinted bg, white text).
// These are detail-view-specific (deeper alpha than SessionCard badges) so
// they live in data-colors.ts alongside SESSION_TYPE_COLORS.
import { SESSION_DETAIL_TYPE_COLORS } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
const TYPE_COLORS = SESSION_DETAIL_TYPE_COLORS;

// Topic icons mapping
const TOPIC_ICONS: Record<string, string> = {
  ai: "hardware-chip-outline",
  ml: "hardware-chip-outline",
  "ai/ml": "hardware-chip-outline",
  design: "brush-outline",
  "product design": "brush-outline",
  ux: "brush-outline",
  innovation: "trending-up-outline",
  web3: "globe-outline",
  blockchain: "link-outline",
  robotics: "construct-outline",
  security: "shield-checkmark-outline",
};

function getTopicIcon(topic: string): string {
  const normalized = topic.toLowerCase();
  return TOPIC_ICONS[normalized] || "pricetag-outline";
}

export default function SessionDetailScreen() {
  return (
    <FeatureGate flag="schedule">
      <SessionDetailContent />
    </FeatureGate>
  );
}

function SessionDetailContent() {
  const colors = useColors();
  const styles = getStyles(colors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const backgroundColor = colors.surfacePrimary;
  const cardBg = colors.surfaceSecondary;
  const textColor = colors.text;
  const textSecondary = colors.textSecondary;
  const borderColor = colors.border;

  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { data: exhibitorSessions = [] } = useGetExhibitorSessions(
    user?.role === UserRole.exhibitor ? user?.id : undefined,
  );

  const [session, setSession] = useState<SessionDetailOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  // Load session data
  const loadSession = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const [sessionData, agendaData] = await Promise.all([
        getSession(parseInt(id, 10)),
        getMyAgenda().catch(() => []),
      ]);

      setSession(sessionData);
      setIsFavorite(
        agendaData.some((item) => item.session.id === sessionData.id),
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Refetch session data when screen comes back into focus
  // This ensures polls and other data is up-to-date after creating a poll
  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      const refetchSession = async () => {
        try {
          const [sessionData, agendaData] = await Promise.all([
            getSession(parseInt(id, 10)),
            getMyAgenda().catch(() => []),
          ]);
          setSession(sessionData);
          setIsFavorite(
            agendaData.some((item) => item.session.id === sessionData.id),
          );
        } catch {
          // Silent fail - keep existing data
        }
      };
      refetchSession();
    }, [id]),
  );

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(async () => {
    if (!session) return;

    const wasFavorite = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      if (wasFavorite) {
        await removeFavorite(session.id);
      } else {
        const response = await addFavorite(session.id);
        if (response.has_conflict && response.conflicting_sessions.length > 0) {
          Alert.alert(
            t("session.scheduleConflict"),
            t("session.scheduleConflictMessage", { sessions: response.conflicting_sessions.map((s) => s.title).join(", ") }),
            [{ text: t("session.ok") }],
          );
        }
      }
    } catch (e: any) {
      setIsFavorite(wasFavorite);
      if (e?.response?.status === 401) {
        Alert.alert(
          t("session.signInRequired"),
          t("session.signInMessage"),
          [
            { text: t("session.cancel"), style: "cancel" },
            { text: t("session.signIn"), onPress: () => router.push("/login") },
          ],
        );
      } else {
        Alert.alert(t("session.error"), e?.message ?? "Failed to update favorite");
      }
    }
  }, [session, isFavorite, router, t]);

  // Handle share
  const appName = useConfigStore((s) => s.appName);
  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out "${session?.title ?? "this session"}" at ${appName}!`,
        title: "Share Session",
      });
    } catch (error) {
      console.error("Error sharing session:", error);
    }
  }, [session, appName]);

  // Handle view map
  const handleViewMap = useCallback(() => {
    router.push("/map");
  }, [router]);

  // Handle speaker profile
  const handleSpeakerPress = useCallback(
    (speaker: SpeakerBriefOut) => {
      router.push({
        pathname: "/user/[id]",
        params: { id: speaker.user_id.toString() },
      });
    },
    [router],
  );

  // Handle slides download
  const handleDownloadSlides = useCallback(() => {
    if (session?.slides_url && session.slides_unlocked) {
      Linking.openURL(session.slides_url);
    }
  }, [session]);

  // Format time
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format date
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  };

  // Calculate duration
  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const minutes = Math.round(
      (endDate.getTime() - startDate.getTime()) / 60000,
    );
    return t("session.minutes", { count: minutes });
  };

  // Check if session is live
  const isLive = () => {
    if (!session) return false;
    const now = new Date();
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    return now >= start && now <= end;
  };

  // Determine if the current user is an admin of this session
  const isSpeaker = session
    ? session.speakers.some((s) => s.user_id === user?.id)
    : false;
  const isExhibitorOfSession = session
    ? exhibitorSessions.some((s) => s.id === session.id)
    : false;
  const isSessionAdmin = isSpeaker || isExhibitorOfSession;
  const activePollCount = session?.polls?.filter((p) => p.is_active).length ?? 0;

  // Loading state
  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor }]}>
        <Stack.Screen options={{ title: "Session", headerShown: false }} />
        <ActivityIndicator size="large" color={colors.brand} />
        <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
          {t("session.loading")}
        </ThemedText>
      </View>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <View style={[styles.centerContainer, { backgroundColor }]}>
        <Stack.Screen options={{ title: "Error", headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={48} color={textSecondary} />
        <ThemedText style={[styles.errorText, { color: textColor }]}>
          {error ?? t("session.notFound")}
        </ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadSession}>
          <ThemedText style={styles.retryButtonText}>{t("session.retry")}</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const typeColors =
    TYPE_COLORS[session.type.toLowerCase()] || TYPE_COLORS.talk;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <Stack.Screen options={{ headerShown: false }} />

      <AnimatedScrollView
        headerMaxHeight={350}
        topBarHeight={90}
        renderHeaderComponent={() => (
          <View style={{ flex: 1 }}>
            {session.image_url ? (
              <Image
                source={{ uri: session.image_url }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.cardBackground }]}
              />
            )}
            <LinearGradient
              colors={["transparent", "rgba(16,21,34,0.95)"]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={{ flex: 1, justifyContent: "flex-end", padding: 24 }}>
              <View style={styles.heroBadges}>
                {isLive() && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <ThemedText style={styles.liveBadgeText}>{t("session.liveNow")}</ThemedText>
                  </View>
                )}
                <View
                  style={[styles.typeBadge, { backgroundColor: typeColors.bg }]}
                >
                  <ThemedText
                    style={[styles.typeBadgeText, { color: typeColors.text }]}
                  >
                    {session.type.toUpperCase()}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.heroTitle}>{session.title}</ThemedText>
            </View>
          </View>
        )}
        renderTopNavBarComponent={() => (
          <HeaderNavBar intensity={60} tint="systemUltraThinMaterialDark" headerHeight={90}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={textColor} />
            </TouchableOpacity>
            <ThemedText style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
              {session.title}
            </ThemedText>
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color={textColor} />
            </TouchableOpacity>
          </HeaderNavBar>
        )}
        renderHeaderNavBarComponent={() => (
          <HeaderNavBar intensity={0} tint="dark" headerHeight={90}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={COLOR_WHITE_ON_ACCENT} />
            </TouchableOpacity>
            <View />
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color={COLOR_WHITE_ON_ACCENT} />
            </TouchableOpacity>
          </HeaderNavBar>
        )}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Meta Information */}
        <View style={styles.metaSection}>
          {/* Location */}
          {session.venue && (
            <View
              style={[
                styles.metaCard,
                { backgroundColor: cardBg, borderColor },
              ]}
            >
              <View style={styles.metaCardContent}>
                <View style={styles.metaIconContainer}>
                  <Ionicons name="map-outline" size={24} color={colors.brand} />
                </View>
                <View style={styles.metaInfo}>
                  <ThemedText style={[styles.metaTitle, { color: textColor }]}>
                    {session.venue.name}
                  </ThemedText>
                  {/* {session.venue.has_indoor && (
                    <ThemedText
                      style={[styles.metaSubtitle, { color: textSecondary }]}
                    >
                      Capacity: {session.location.capacity}
                    </ThemedText>
                  )} */}
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewMapButton}
                onPress={handleViewMap}
              >
                <ThemedText style={styles.viewMapButtonText}>{t("session.viewMap")}</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Time */}
          <View
            style={[styles.metaCard, { backgroundColor: cardBg, borderColor }]}
          >
            <View style={styles.metaCardContent}>
              <View style={styles.metaIconContainer}>
                <Ionicons name="time-outline" size={24} color={colors.brand} />
              </View>
              <View style={styles.metaInfo}>
                <ThemedText style={[styles.metaTitle, { color: textColor }]}>
                  {formatTime(session.start_time)} -{" "}
                  {formatTime(session.end_time)}
                </ThemedText>
                <ThemedText style={[styles.metaSubtitle, { color: textSecondary }]}>
                  {getDuration(session.start_time, session.end_time)} •{" "}
                  {formatDate(session.start_time)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Topic Tags */}
        {session.topic_tags && session.topic_tags.length > 0 && (
          <View style={styles.tagsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tagsContainer}>
                {session.topic_tags.map((tag) => (
                  <View
                    key={tag}
                    style={[
                      styles.tag,
                      { backgroundColor: cardBg, borderColor },
                    ]}
                  >
                    <Ionicons
                      name={getTopicIcon(tag) as any}
                      size={14}
                      color={colors.brand}
                    />
                    <ThemedText style={[styles.tagText, { color: textColor }]}>
                      {tag}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Description */}
        {session.description && (
          <View style={styles.descriptionSection}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              {t("session.aboutSession")}
            </ThemedText>
            <ThemedText
              style={[styles.descriptionText, { color: textSecondary }]}
              numberOfLines={isDescriptionExpanded ? undefined : 4}
            >
              {session.description}
            </ThemedText>
            {session.description.length > 200 && (
              <TouchableOpacity
                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                <ThemedText style={styles.readMoreText}>
                  {isDescriptionExpanded ? t("session.showLess") : t("session.readMore")}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Speakers */}
        {session.speakers.length > 0 && (
          <View style={styles.speakersSection}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              {session.speakers.length > 1 ? t("session.speakerPlural") : t("session.speakerSingular")}
            </ThemedText>
            {session.speakers.map((speaker) => (
              <TouchableOpacity
                key={speaker.user_id}
                style={[
                  styles.speakerCard,
                  { backgroundColor: cardBg, borderColor },
                ]}
                onPress={() => handleSpeakerPress(speaker)}
                activeOpacity={0.7}
              >
                <View style={styles.speakerAvatar}>
                  {speaker.avatar_url ? (
                    <Image
                      source={{ uri: speaker.avatar_url }}
                      style={styles.speakerImage}
                    />
                  ) : (
                    <View style={styles.speakerPlaceholder}>
                      <ThemedText style={styles.speakerInitial}>
                        {(speaker.full_name || "?").charAt(0)}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.speakerInfo}>
                  <ThemedText style={[styles.speakerName, { color: textColor }]}>
                    {speaker.full_name}
                  </ThemedText>
                  <ThemedText style={styles.viewProfileText}>{t("session.viewProfile")}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Engagement Section */}
        <View style={styles.engagementSection}>
          {(isSessionAdmin || (session.polls && session.polls.length > 0)) && (
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              {t("session.engagement")}
            </ThemedText>
          )}

          {/* Admin management tiles (speakers / exhibitors only) */}
          {isSessionAdmin && (
            <View style={styles.adminTilesRow}>
              <TouchableOpacity
                style={[styles.adminTile, styles.adminTileActive]}
                onPress={() =>
                  router.push({
                    pathname: "/my-polls",
                    params: {
                      sessionId: String(session.id),
                      sessionTitle: session.title,
                    },
                  })
                }
              >
                <Ionicons name="bar-chart" size={28} color={COLOR_WHITE_ON_ACCENT} />
                <ThemedText style={styles.adminTileTitle}>{t("session.polls")}</ThemedText>
                {activePollCount > 0 && (
                  <View style={styles.adminTileBadge}>
                    <ThemedText style={styles.adminTileBadgeText}>
                      {activePollCount !== 1
                        ? t("session.activePollPlural", { count: activePollCount })
                        : t("session.activePollSingular", { count: activePollCount })}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminTile, styles.adminTileDark]}
                onPress={() =>
                  router.push({
                    pathname: "/session-qa",
                    params: {
                      sessionId: String(session.id),
                      sessionTitle: session.title,
                    },
                  })
                }
              >
                <Ionicons name="chatbubble" size={28} color={colors.textSecondary} />
                <ThemedText style={[styles.adminTileTitle, { color: colors.textSecondary }]}>
                  {t("session.qa")}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Q&A button for attendees */}
          {!isSessionAdmin && (
            <TouchableOpacity
              style={styles.qaAttendeeBtn}
              onPress={() =>
                router.push({
                  pathname: "/session-qa-public",
                  params: {
                    sessionId: String(session.id),
                    sessionTitle: session.title,
                  },
                })
              }
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
              <ThemedText style={styles.qaAttendeeBtnText}>{t("session.qaAskQuestion")}</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}

          {/* Polls */}
          {session.polls?.map((poll) => (
            <PollCard key={poll.id} pollId={poll.id} />
          ))}

          {/* Slides */}
          <View
            style={[
              styles.slidesCard,
              {
                backgroundColor: session.slides_unlocked
                  ? cardBg
                  : `${cardBg}66`,
                borderColor: session.slides_unlocked ? colors.brand : borderColor,
              },
            ]}
          >
            <View style={styles.slidesIconContainer}>
              <Ionicons
                name={session.slides_unlocked ? "document-text" : "lock-closed"}
                size={28}
                color={session.slides_unlocked ? colors.brand : textSecondary}
              />
            </View>
            <ThemedText style={[styles.slidesTitle, { color: textColor }]}>
              {t("session.sessionSlides")}
            </ThemedText>
            <ThemedText style={[styles.slidesSubtitle, { color: textSecondary }]}>
              {session.slides_unlocked
                ? t("session.slidesAvailable")
                : t("session.slidesLocked")}
            </ThemedText>
            {session.slides_unlocked && session.slides_url && (
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleDownloadSlides}
              >
                <Ionicons name="download-outline" size={18} color={COLOR_WHITE_ON_ACCENT} />
                <ThemedText style={styles.downloadButtonText}>{t("session.download")}</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Spacer for bottom bar */}
        <View style={{ height: insets.bottom + 104 }} />
      </AnimatedScrollView>

      {/* Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: `${cardBg}F5`,
            borderColor,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.bookmarkButton,
            isFavorite && styles.bookmarkButtonActive,
          ]}
          onPress={handleFavoriteToggle}
        >
          <Ionicons
            name={isFavorite ? "bookmark" : "bookmark-outline"}
            size={24}
            color={colors.brand}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() =>
            router.push({
              pathname: "/session-chat",
              params: { session_id: id, title: session.title },
            })
          }
        >
          <Ionicons name="chatbubbles-outline" size={20} color={COLOR_WHITE_ON_ACCENT} />
          <ThemedText style={styles.joinButtonText}>{t("session.joinDiscussion")}</ThemedText>
        </TouchableOpacity>
      </View>
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
  // Header
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  // Hero
  heroBadges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brand,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLOR_WHITE_ON_ACCENT,
  },
  liveBadgeText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  // Meta Section
  metaSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  metaCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  metaCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
  },
  metaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(25, 79, 240, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  metaInfo: {
    flex: 1,
  },
  metaTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  metaSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  viewMapButton: {
    backgroundColor: colors.brand,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  viewMapButtonText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 14,
    fontWeight: "600",
  },
  // Tags
  tagsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Description
  descriptionSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  readMoreText: {
    color: colors.brand,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  // Speakers
  speakersSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  speakerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  speakerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.brand,
    overflow: "hidden",
  },
  speakerImage: {
    width: "100%",
    height: "100%",
  },
  speakerPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.label,
    justifyContent: "center",
    alignItems: "center",
  },
  speakerInitial: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textTertiary,
  },
  speakerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  speakerName: {
    fontSize: 18,
    fontWeight: "700",
  },
  speakerRole: {
    fontSize: 14,
    marginTop: 2,
  },
  viewProfileText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  // Engagement
  engagementSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  adminTilesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  adminTile: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
    minHeight: 110,
    justifyContent: "center",
  },
  adminTileActive: {
    backgroundColor: colors.brand,
  },
  adminTileDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  adminTileTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  adminTileBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  adminTileBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
  },
  qaAttendeeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  qaAttendeeBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  // Poll
  pollCard: {
    backgroundColor: "rgba(25, 79, 240, 0.05)",
    borderWidth: 2,
    borderColor: "rgba(25, 79, 240, 0.2)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  pollHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pollLiveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pollLiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
  pollLiveText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  pollButton: {
    backgroundColor: colors.brand,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  pollButtonText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 14,
    fontWeight: "600",
  },
  // Slides
  slidesCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  slidesIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(100, 116, 139, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  slidesTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  slidesSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.brand,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  downloadButtonText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 14,
    fontWeight: "600",
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
    borderTopWidth: 1,
  },
  bookmarkButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.brand,
    justifyContent: "center",
    alignItems: "center",
  },
  bookmarkButtonActive: {
    backgroundColor: "rgba(25, 79, 240, 0.1)",
  },
  joinButton: {
    flex: 1,
    height: 56,
    backgroundColor: colors.brand,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  joinButtonText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 16,
    fontWeight: "700",
  },
});
