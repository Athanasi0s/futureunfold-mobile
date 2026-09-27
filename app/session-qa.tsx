import type { QuestionOut } from "@/api/schemas";
import { FeatureGate } from "@/components/feature-gate";
import {
  useAnswerQuestion,
  useDismissQuestion,
  useGetSessionQA,
} from "@/features/qa/hooks";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EMPTY_STATE_ICON, INPUT_PLACEHOLDER_DARK } from "@/constants/data-colors";
import { useColors } from "@/hooks/use-colors";

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  onReply,
  onDismiss,
  isDismissing,
}: {
  question: QuestionOut;
  onReply: (q: QuestionOut) => void;
  onDismiss: (id: number) => void;
  isDismissing: boolean;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const isAnswered = question.status === "answered";

  return (
    <View style={[styles.card, isAnswered && styles.cardAnswered]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.askerRow}>
          {question.asker.avatar_url ? (
            <Image
              source={{ uri: question.asker.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <ThemedText style={styles.avatarInitial}>
                {(question.asker.full_name || "?").charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          )}
          <View style={styles.askerInfo}>
            <ThemedText style={styles.askerName}>{question.asker.full_name}</ThemedText>
            <ThemedText style={styles.timeAgo}>{timeAgo(question.created_at)}</ThemedText>
          </View>
        </View>
        <View style={styles.likesRow}>
          <Ionicons name="heart-outline" size={14} color={colors.textTertiary} />
          <ThemedText style={styles.likesCount}>{question.likes_count}</ThemedText>
          {isAnswered && (
            <View style={styles.answeredBadge}>
              <ThemedText style={styles.answeredBadgeText}>{t("polls.sessionQa.statAnswered")}</ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Body */}
      <ThemedText style={styles.questionBody}>{question.body}</ThemedText>

      {/* Answer (if exists) */}
      {isAnswered && question.answer_text && (
        <View style={styles.answerBlock}>
          <ThemedText style={styles.answerLabel}>{t("polls.sessionQaPublic.answerLabel")}</ThemedText>
          <ThemedText style={styles.answerText}>{question.answer_text}</ThemedText>
        </View>
      )}

      {/* Actions */}
      {!isAnswered && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => onDismiss(question.id)}
            disabled={isDismissing}
          >
            <ThemedText style={styles.dismissBtnText}>{t("polls.sessionQa.dismissBtn")}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.replyBtn}
            onPress={() => onReply(question)}
          >
            <ThemedText style={styles.replyBtnText}>{t("polls.sessionQa.replyBtn")}</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function QAManagementScreen() {
  return (
    <FeatureGate flag="session_qa">
      <QAManagementContent />
    </FeatureGate>
  );
}

function QAManagementContent() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const { sessionId, sessionTitle } = useLocalSearchParams<{
    sessionId: string;
    sessionTitle: string;
  }>();
  const id = Number(sessionId);

  const [sort, setSort] = useState<"newest" | "likes">("newest");
  const [replyTarget, setReplyTarget] = useState<QuestionOut | null>(null);
  const [answerText, setAnswerText] = useState("");
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data, isLoading, isError, refetch } = useGetSessionQA(id, sort);
  const answerMutation = useAnswerQuestion(id);
  const dismissMutation = useDismissQuestion(id);

  const questions = data?.questions ?? [];
  const total = data?.total ?? 0;
  const pendingCount = data?.pending_count ?? 0;

  function handleDismiss(questionId: number) {
    Alert.alert(t("polls.sessionQa.alertDismiss"), t("polls.sessionQa.alertDismissMsg"), [
      { text: t("polls.sessionQa.alertCancel"), style: "cancel" },
      {
        text: t("polls.sessionQa.alertDismissBtn"),
        style: "destructive",
        onPress: () =>
          dismissMutation.mutate(questionId, {
            onError: () =>
              Alert.alert(t("polls.sessionQa.alertError"), t("polls.sessionQa.alertDismissFailed")),
          }),
      },
    ]);
  }

  function handleReply(question: QuestionOut) {
    setReplyTarget(question);
    setAnswerText("");
  }

  function handleSubmitAnswer() {
    if (!replyTarget || !answerText.trim()) return;
    answerMutation.mutate(
      { questionId: replyTarget.id, data: { answer_text: answerText.trim() } },
      {
        onSuccess: () => {
          setReplyTarget(null);
          setAnswerText("");
        },
        onError: () => Alert.alert(t("polls.sessionQa.alertError"), t("polls.sessionQa.alertAnswerFailed")),
      },
    );
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
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={COLOR_WHITE_ON_ACCENT} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle}>{t("polls.sessionQa.title")}</ThemedText>
            {sessionTitle ? (
              <ThemedText style={styles.headerSub} numberOfLines={1}>
                {sessionTitle}
              </ThemedText>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => refetch()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.refreshBtn}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={EMPTY_STATE_ICON} />
          <ThemedText style={styles.errorText}>{t("polls.sessionQa.loadFailed")}</ThemedText>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <ThemedText style={styles.retryBtnText}>{t("polls.sessionQa.retry")}</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statLabel}>{t("polls.sessionQa.statTotal")}</ThemedText>
              <ThemedText style={styles.statValue}>{total}</ThemedText>
            </View>
            <View style={[styles.statCard, styles.statCardPending]}>
              <ThemedText style={[styles.statLabel, styles.statLabelPending]}>
                {t("polls.sessionQa.statPending")}
              </ThemedText>
              <ThemedText style={[styles.statValue, styles.statValuePending]}>
                {String(pendingCount).padStart(2, "0")}
              </ThemedText>
            </View>
          </View>

          {/* Section header + sort */}
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>{t("polls.sessionQa.reviewQueue")}</ThemedText>
            <View style={styles.sortRow}>
              <TouchableOpacity
                onPress={() => setSort("newest")}
                style={[
                  styles.sortBtn,
                  sort === "newest" && styles.sortBtnActive,
                ]}
              >
                <ThemedText
                  style={[
                    styles.sortBtnText,
                    sort === "newest" && styles.sortBtnTextActive,
                  ]}
                >
                  {t("polls.sessionQa.sortNewest")}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSort("likes")}
                style={[
                  styles.sortBtn,
                  sort === "likes" && styles.sortBtnActive,
                ]}
              >
                <ThemedText
                  style={[
                    styles.sortBtnText,
                    sort === "likes" && styles.sortBtnTextActive,
                  ]}
                >
                  {t("polls.sessionQa.sortTopLiked")}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {questions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="chatbubble-outline"
                size={44}
                color={EMPTY_STATE_ICON}
              />
              <ThemedText style={styles.emptyTitle}>{t("polls.sessionQa.emptyTitle")}</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                {t("polls.sessionQa.emptyDesc")}
              </ThemedText>
            </View>
          ) : (
            questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                onReply={handleReply}
                onDismiss={handleDismiss}
                isDismissing={dismissMutation.isPending}
              />
            ))
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Reply Modal */}
      <Modal
        visible={!!replyTarget}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReplyTarget(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <SafeAreaView style={styles.modalHeaderSafe}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <ThemedText style={styles.modalTitle}>{t("polls.sessionQa.replyModal")}</ThemedText>
                <ThemedText style={styles.modalSub}>{t("polls.sessionQa.replyQuestion")}</ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => setReplyTarget(null)}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {replyTarget && (
              <View style={styles.questionPreview}>
                <ThemedText style={styles.questionPreviewAsker}>
                  {replyTarget.asker.full_name}
                </ThemedText>
                <ThemedText style={styles.questionPreviewBody}>
                  {replyTarget.body}
                </ThemedText>
              </View>
            )}

            <ThemedText style={styles.inputLabel}>{t("polls.sessionQa.yourAnswer")}</ThemedText>
            <TextInput
              style={styles.answerInput}
              value={answerText}
              onChangeText={setAnswerText}
              placeholder={t("polls.sessionQa.answerPlaceholder")}
              placeholderTextColor={INPUT_PLACEHOLDER_DARK}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoFocus
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!answerText.trim() || answerMutation.isPending) &&
                  styles.submitBtnDisabled,
              ]}
              onPress={handleSubmitAnswer}
              disabled={!answerText.trim() || answerMutation.isPending}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.submitBtnText}>
                {answerMutation.isPending ? t("polls.sessionQa.submitting") : t("polls.sessionQa.submitAnswer")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerCenter: { flex: 1, paddingHorizontal: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLOR_WHITE_ON_ACCENT },
  headerSub: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  refreshBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "flex-end" },

  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  errorText: { fontSize: 15, color: colors.textSecondary, fontWeight: "600" },
  retryBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: { color: COLOR_WHITE_ON_ACCENT, fontSize: 14, fontWeight: "600" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  // Stats
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 16,
  },
  statCardPending: {
    borderColor: `${colors.brand}4D`,
    backgroundColor: `${colors.brand}0F`,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  statLabelPending: { color: colors.textSecondary },
  statValue: { fontSize: 36, fontWeight: "800", color: colors.text, lineHeight: 40 },
  statValuePending: { color: colors.brand },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  sortRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  sortBtnActive: { backgroundColor: colors.brand },
  sortBtnText: { fontSize: 12, fontWeight: "600", color: colors.textTertiary },
  sortBtnTextActive: { color: COLOR_WHITE_ON_ACCENT },

  // Question card
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 16,
    marginBottom: 12,
  },
  cardAnswered: { borderColor: "rgba(16,185,129,0.2)" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  askerRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 14, fontWeight: "700", color: colors.textSecondary },
  askerInfo: { flex: 1 },
  askerName: { fontSize: 14, fontWeight: "700", color: colors.text },
  timeAgo: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  likesRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  likesCount: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  answeredBadge: {
    marginLeft: 6,
    backgroundColor: "rgba(16,185,129,0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  answeredBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.success,
    letterSpacing: 0.5,
  },
  questionBody: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 14,
  },
  answerBlock: {
    backgroundColor: "rgba(16,185,129,0.06)",
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.success,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  answerText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  cardActions: { flexDirection: "row", gap: 8 },
  dismissBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  dismissBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  replyBtn: {
    flex: 2,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.brand,
  },
  replyBtnText: { fontSize: 12, fontWeight: "700", color: COLOR_WHITE_ON_ACCENT, letterSpacing: 0.5 },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 56, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.surfacePrimary },
  modalHeaderSafe: { backgroundColor: colors.surfacePrimary },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  modalHeaderText: { flex: 1 },
  modalTitle: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 2 },
  modalSub: { fontSize: 13, color: colors.textSecondary },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  modalScroll: { flex: 1 },
  modalScrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 },
  questionPreview: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 14,
    marginBottom: 24,
  },
  questionPreviewAsker: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  questionPreviewBody: { fontSize: 14, color: colors.text, lineHeight: 20 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  answerInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 120,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 24 : 20,
    paddingTop: 12,
    backgroundColor: colors.surfacePrimary,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  submitBtn: {
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLOR_WHITE_ON_ACCENT,
    letterSpacing: 1,
  },
});
