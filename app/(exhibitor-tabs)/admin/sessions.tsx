import { useAuthStore } from "@/features/authentication/stores/auth";
import { useTranslation } from "react-i18next";
import { useGetExhibitorSessions } from "@/features/exhibitors/hooks/useGetExhibitorSessions";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
function getSessionStatus(startTime: string, endTime: string): "live" | "upcoming" | "past" {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (now >= start && now <= end) return "live";
  if (now < start) return "upcoming";
  return "past";
}

function formatStartsIn(startTime: string): string {
  const diff = new Date(startTime).getTime() - Date.now();
  const totalMins = Math.floor(diff / 60000);
  if (totalMins < 60) return `${totalMins}M`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hours}H ${mins}M` : `${hours}H`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AllSessionsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const user = useAuthStore((s) => s.user);
  const { data: sessions = [], isLoading } = useGetExhibitorSessions(user?.id);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  return (
    <View style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={COLOR_WHITE_ON_ACCENT} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("exhibitor.sessions.title")}</ThemedText>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {!isLoading && sessions.length === 0 && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>{t("exhibitor.sessions.noSessions")}</ThemedText>
          </View>
        )}

        {sessions.map((session) => {
          const status = getSessionStatus(session.start_time, session.end_time);
          return (
            <TouchableOpacity
              key={session.id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(exhibitor-tabs)/admin/edit-session",
                  params: { sessionId: String(session.id) },
                })
              }
            >
            <View style={[styles.card, styles.sessionCard]}>
              {status === "live" ? (
                <View style={styles.liveBadgeRow}>
                  <View style={styles.liveDot} />
                  <ThemedText style={styles.liveText}>{t("exhibitor.sessions.liveNow")}</ThemedText>
                </View>
              ) : status === "upcoming" ? (
                <View style={styles.upcomingRow}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                  <ThemedText style={styles.upcomingText}>
                    {t("exhibitor.sessions.endsIn")} {formatStartsIn(session.start_time)}
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.upcomingRow}>
                  <Ionicons name="checkmark-circle-outline" size={12} color={colors.textTertiary} />
                  <ThemedText style={styles.pastText}>{t("exhibitor.sessions.ended")}</ThemedText>
                </View>
              )}

              <ThemedText style={styles.sessionTitle}>{session.title}</ThemedText>

              {session.speakers.length > 0 && (
                <View style={styles.speakersRow}>
                  <View style={styles.speakerStack}>
                    {session.speakers.slice(0, 3).map((sp, idx) => (
                      <View
                        key={sp.user_id}
                        style={[
                          styles.speakerAvatarWrap,
                          idx > 0 && { marginLeft: -8 },
                        ]}
                      >
                        {sp.avatar_url ? (
                          <Image
                            source={{ uri: sp.avatar_url }}
                            style={styles.speakerAvatar}
                          />
                        ) : (
                          <View
                            style={[
                              styles.speakerAvatar,
                              styles.speakerAvatarPlaceholder,
                            ]}
                          >
                            <ThemedText style={styles.speakerInitial}>
                              {(sp.full_name || "?").charAt(0)}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                  <ThemedText style={styles.speakerNames}>
                    {session.speakers.map((sp) => sp.full_name).join(" & ")}
                  </ThemedText>
                </View>
              )}

              <View style={styles.sessionActions}>
                <TouchableOpacity
                  style={styles.sessionActionBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/(exhibitor-tabs)/admin/polls",
                      params: {
                        sessionId: String(session.id),
                        sessionTitle: session.title,
                      },
                    })
                  }
                >
                  <Ionicons name="bar-chart-outline" size={20} color={colors.textSecondary} />
                  <ThemedText style={styles.sessionActionText}>{t("exhibitor.sessions.polls")}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sessionActionBtn}
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
                  <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
                  <ThemedText style={styles.sessionActionText}>{t("exhibitor.sessions.qa")}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sessionActionBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/(exhibitor-tabs)/admin/speakers",
                      params: { sessionId: String(session.id) },
                    })
                  }
                >
                  <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
                  <ThemedText style={styles.sessionActionText}>{t("exhibitor.sessions.speakers")}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 24 }} />
      </ScrollView>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },

  headerSafeArea: {
    backgroundColor: colors.surfaceSecondary,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
  },

  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 12,
    overflow: "hidden",
  },
  sessionCard: {
    padding: 16,
  },

  liveBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brand,
    letterSpacing: 0.5,
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  upcomingText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  pastText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },

  sessionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    marginBottom: 10,
  },

  speakersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  speakerStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  speakerAvatarWrap: {
    borderWidth: 2,
    borderColor: colors.surfaceSecondary,
    borderRadius: 14,
  },
  speakerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  speakerAvatarPlaceholder: {
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  speakerInitial: {
    fontSize: 10,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  speakerNames: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },

  sessionActions: {
    flexDirection: "row",
    gap: 8,
  },
  sessionActionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  sessionActionText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
});
