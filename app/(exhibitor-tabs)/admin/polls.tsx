import { useDeletePoll, useGetMyPolls } from "@/features/polls/hooks";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import type { PollDetailOut } from "@/api/schemas";
import { EMPTY_STATE_ICON } from "@/constants/data-colors";
import { useColors } from "@/hooks/use-colors";

// ─── Poll Card ────────────────────────────────────────────────────────────────

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
function PollCard({
  poll,
  onDelete,
  isDeleting,
}: {
  poll: PollDetailOut;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  return (
    <View style={[styles.pollCard, poll.is_active ? styles.pollCardActive : styles.pollCardEnded]}>
      <View style={styles.pollCardTop}>
        <View style={[styles.statusBadge, poll.is_active ? styles.statusLive : styles.statusEnded]}>
          <View style={[styles.statusDot, poll.is_active ? styles.dotLive : styles.dotEnded]} />
          <ThemedText style={[styles.statusText, poll.is_active ? styles.statusTextLive : styles.statusTextEnded]}>
            {poll.is_active ? t("exhibitor.polls.liveBadge") : t("exhibitor.polls.endedBadge")}
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(poll.id)}
          disabled={isDeleting}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ThemedText style={styles.pollQuestion}>{poll.question}</ThemedText>

      <View style={styles.optionsList}>
        {poll.options.map((opt) => {
          const pct =
            poll.total_votes > 0
              ? Math.round((opt.vote_count / poll.total_votes) * 100)
              : 0;
          return (
            <View key={opt.id} style={styles.optionRow}>
              <View style={styles.optionBarBg}>
                <View style={[styles.optionBarFill, { width: `${pct}%` }]} />
              </View>
              <View style={styles.optionLabelRow}>
                <ThemedText style={styles.optionText}>{opt.text}</ThemedText>
                <ThemedText style={styles.optionPct}>{pct}%</ThemedText>
              </View>
            </View>
          );
        })}
      </View>

      <ThemedText style={styles.pollFooter}>
        {poll.total_votes} {poll.total_votes !== 1 ? t("exhibitor.polls.votesUnit") : t("exhibitor.polls.voteUnit")} {t("exhibitor.polls.cast")}
      </ThemedText>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SessionPollsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const { sessionId, sessionTitle } = useLocalSearchParams<{
    sessionId: string;
    sessionTitle: string;
  }>();
  const id = Number(sessionId);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data: allPolls = [], isFetching, isError } = useGetMyPolls();
  const polls = allPolls.filter((p) => p.session_id === id);

  const deletePoll = useDeletePoll();

  function handleDelete(pollId: number) {
    Alert.alert(t("exhibitor.polls.alertDelete"), t("exhibitor.polls.alertDeleteMsg"), [
      { text: t("exhibitor.polls.alertCancel"), style: "cancel" },
      {
        text: t("exhibitor.polls.alertDeleteBtn"),
        style: "destructive",
        onPress: () => deletePoll.mutate(pollId),
      },
    ]);
  }

  function goToCreate() {
    router.push({
      pathname: "/(exhibitor-tabs)/admin/create-poll",
      params: { sessionId, sessionTitle },
    });
  }

  return (
    <View style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLOR_WHITE_ON_ACCENT} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle}>{t("exhibitor.polls.title")}</ThemedText>
            {sessionTitle ? (
              <ThemedText style={styles.headerSub} numberOfLines={1}>
                {sessionTitle}
              </ThemedText>
            ) : null}
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={goToCreate}>
            <Ionicons name="add" size={16} color={COLOR_WHITE_ON_ACCENT} />
            <ThemedText style={styles.createBtnText}>{t("exhibitor.polls.newPoll")}</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isFetching && (
          <View style={styles.centeredState}>
            <Ionicons name="bar-chart-outline" size={40} color={EMPTY_STATE_ICON} />
            <ThemedText style={styles.loadingText}>{t("exhibitor.polls.loading")}</ThemedText>
          </View>
        )}

        {isError && !isFetching && (
          <View style={styles.centeredState}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
            <ThemedText style={styles.errorTitle}>{t("exhibitor.polls.failed")}</ThemedText>
            <ThemedText style={styles.errorSubtitle}>{t("exhibitor.polls.checkConnection")}</ThemedText>
          </View>
        )}

        {!isFetching && !isError && polls.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color={EMPTY_STATE_ICON} />
            <ThemedText style={styles.emptyTitle}>{t("exhibitor.polls.empty")}</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {t("exhibitor.polls.createToEngage")}
            </ThemedText>
            <TouchableOpacity style={styles.emptyCreateBtn} onPress={goToCreate}>
              <Ionicons name="add" size={18} color={COLOR_WHITE_ON_ACCENT} />
              <ThemedText style={styles.emptyCreateBtnText}>{t("exhibitor.polls.createNew")}</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {!isFetching && !isError && polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            onDelete={handleDelete}
            isDeleting={deletePoll.isPending}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfacePrimary },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },

  headerSafe: { backgroundColor: colors.surfaceSecondary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLOR_WHITE_ON_ACCENT },
  headerSub: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brand,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  createBtnText: { fontSize: 13, fontWeight: "600", color: COLOR_WHITE_ON_ACCENT },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Poll card
  pollCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  pollCardActive: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: "rgba(25,79,240,0.3)",
  },
  pollCardEnded: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: "rgba(255,255,255,0.06)",
  },
  pollCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusLive: { backgroundColor: "rgba(25,79,240,0.12)" },
  statusEnded: { backgroundColor: "rgba(239,68,68,0.1)" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  dotLive: { backgroundColor: colors.brand },
  dotEnded: { backgroundColor: colors.error },
  statusText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  statusTextLive: { color: colors.brand },
  statusTextEnded: { color: colors.error },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  pollQuestion: {
    fontSize: 17,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    lineHeight: 24,
    marginBottom: 14,
  },

  optionsList: { gap: 8, marginBottom: 12 },
  optionRow: { gap: 4 },
  optionBarBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 3,
    overflow: "hidden",
  },
  optionBarFill: {
    height: 6,
    backgroundColor: colors.brand,
    borderRadius: 3,
  },
  optionLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionText: { fontSize: 13, color: colors.textSecondary },
  optionPct: { fontSize: 13, fontWeight: "600", color: COLOR_WHITE_ON_ACCENT },
  pollFooter: { fontSize: 11, color: colors.border, marginTop: 4 },

  centeredState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.error,
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: "center",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    marginTop: 12,
  },
  emptySubtitle: { fontSize: 13, color: colors.textTertiary, textAlign: "center" },
  emptyCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 12,
  },
  emptyCreateBtnText: { fontSize: 14, fontWeight: "600", color: COLOR_WHITE_ON_ACCENT },
});
