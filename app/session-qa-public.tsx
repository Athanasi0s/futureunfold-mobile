import type { QuestionOut } from "@/api/schemas";
import { FeatureGate } from "@/components/feature-gate";
import { EMPTY_STATE_ICON, INPUT_PLACEHOLDER_DARK } from "@/constants/data-colors";
import {
  useGetSessionQA,
  useLikeQuestion,
  useSubmitQuestion,
} from "@/features/qa/hooks";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
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
import { useTranslation } from "react-i18next";
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
  onLike,
  isLiking,
}: {
  question: QuestionOut;
  onLike: (id: number) => void;
  isLiking: boolean;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const isAnswered = question.status === "answered";

  return (
    <View style={[styles.card, isAnswered && styles.cardAnswered]}>
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

        <TouchableOpacity
          style={[styles.likeBtn, question.liked_by_me && styles.likeBtnActive]}
          onPress={() => onLike(question.id)}
          disabled={isLiking}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={question.liked_by_me ? "heart" : "heart-outline"}
            size={16}
            color={question.liked_by_me ? colors.error : colors.textTertiary}
          />
          {question.likes_count > 0 && (
            <ThemedText
              style={[
                styles.likeCount,
                question.liked_by_me && styles.likeCountActive,
              ]}
            >
              {question.likes_count}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>

      <ThemedText style={styles.questionBody}>{question.body}</ThemedText>

      {isAnswered && question.answer_text && (
        <View style={styles.answerBlock}>
          <ThemedText style={styles.answerLabel}>{t("polls.sessionQaPublic.answerLabel")}</ThemedText>
          <ThemedText style={styles.answerText}>{question.answer_text}</ThemedText>
        </View>
      )}

      {isAnswered && (
        <View style={styles.answeredRow}>
          <Ionicons name="checkmark-circle" size={13} color={colors.success} />
          <ThemedText style={styles.answeredText}>{t("polls.sessionQaPublic.answeredLabel")}</ThemedText>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SessionQAPublicScreen() {
  return (
    <FeatureGate flag="session_qa">
      <SessionQAPublicContent />
    </FeatureGate>
  );
}

function SessionQAPublicContent() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const { sessionId, sessionTitle } = useLocalSearchParams<{
    sessionId: string;
    sessionTitle: string;
  }>();
  const id = Number(sessionId);

  const [sort, setSort] = useState<"newest" | "likes">("newest");
  const [showAskModal, setShowAskModal] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data, isLoading, isError, refetch } = useGetSessionQA(id, sort);
  const submitMutation = useSubmitQuestion(id);
  const likeMutation = useLikeQuestion(id);

  const questions = data?.questions ?? [];

  function handleLike(questionId: number) {
    likeMutation.mutate(questionId);
  }

  function handleSubmit() {
    if (!questionText.trim()) return;
    submitMutation.mutate(
      { body: questionText.trim() },
      {
        onSuccess: () => {
          setShowAskModal(false);
          setQuestionText("");
        },
        onError: () => Alert.alert(t("polls.sessionQaPublic.alertError"), t("polls.sessionQaPublic.alertSubmitFailed")),
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
            <ThemedText style={styles.headerTitle}>{t("polls.sessionQaPublic.title")}</ThemedText>
            {sessionTitle ? (
              <ThemedText style={styles.headerSub} numberOfLines={1}>
                {sessionTitle}
              </ThemedText>
            ) : null}
          </View>
          {questions.length > 0 ? (
            <TouchableOpacity
              style={styles.askBtn}
              onPress={() => setShowAskModal(true)}
            >
              <Ionicons name="add" size={16} color={COLOR_WHITE_ON_ACCENT} />
              <ThemedText style={styles.askBtnText}>{t("polls.sessionQaPublic.askBtn")}</ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.askBtnPlaceholder} />
          )}
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={EMPTY_STATE_ICON} />
          <ThemedText style={styles.errorText}>{t("polls.sessionQaPublic.loadFailed")}</ThemedText>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <ThemedText style={styles.retryBtnText}>{t("polls.sessionQaPublic.retry")}</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sort toggle */}
          <View style={styles.sortRow}>
            <TouchableOpacity
              onPress={() => setSort("newest")}
              style={[styles.sortBtn, sort === "newest" && styles.sortBtnActive]}
            >
              <ThemedText
                style={[
                  styles.sortBtnText,
                  sort === "newest" && styles.sortBtnTextActive,
                ]}
              >
                {t("polls.sessionQaPublic.sortNewest")}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSort("likes")}
              style={[styles.sortBtn, sort === "likes" && styles.sortBtnActive]}
            >
              <ThemedText
                style={[
                  styles.sortBtnText,
                  sort === "likes" && styles.sortBtnTextActive,
                ]}
              >
                {t("polls.sessionQaPublic.sortTopLiked")}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {questions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={44} color={EMPTY_STATE_ICON} />
              <ThemedText style={styles.emptyTitle}>{t("polls.sessionQaPublic.emptyTitle")}</ThemedText>
              <ThemedText style={styles.emptySubtitle}>{t("polls.sessionQaPublic.emptyDesc")}</ThemedText>
              <TouchableOpacity
                style={styles.emptyAskBtn}
                onPress={() => setShowAskModal(true)}
              >
                <Ionicons name="add" size={18} color={COLOR_WHITE_ON_ACCENT} />
                <ThemedText style={styles.emptyAskBtnText}>{t("polls.sessionQaPublic.askQuestion")}</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                onLike={handleLike}
                isLiking={likeMutation.isPending}
              />
            ))
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Ask Question Modal */}
      <Modal
        visible={showAskModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAskModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <SafeAreaView style={styles.modalHeaderSafe}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <ThemedText style={styles.modalTitle}>{t("polls.sessionQaPublic.modalTitle")}</ThemedText>
                <ThemedText style={styles.modalSub} numberOfLines={1}>
                  {sessionTitle}
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => setShowAskModal(false)}
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
            <ThemedText style={styles.inputLabel}>{t("polls.sessionQaPublic.yourQuestion")}</ThemedText>
            <TextInput
              style={styles.questionInput}
              value={questionText}
              onChangeText={setQuestionText}
              placeholder={t("polls.sessionQaPublic.questionPlaceholder")}
              placeholderTextColor={INPUT_PLACEHOLDER_DARK}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!questionText.trim() || submitMutation.isPending) &&
                  styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!questionText.trim() || submitMutation.isPending}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.submitBtnText}>
                {submitMutation.isPending ? t("polls.sessionQaPublic.submitting") : t("polls.sessionQaPublic.submitQuestion")}
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
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brand,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  askBtnText: { fontSize: 13, fontWeight: "600", color: COLOR_WHITE_ON_ACCENT },
  askBtnPlaceholder: { width: 36 },

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

  sortRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    padding: 2,
    gap: 2,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  sortBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  sortBtnActive: { backgroundColor: colors.brand },
  sortBtnText: { fontSize: 12, fontWeight: "600", color: colors.textTertiary },
  sortBtnTextActive: { color: COLOR_WHITE_ON_ACCENT },

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
  avatar: { width: 34, height: 34, borderRadius: 17 },
  avatarPlaceholder: {
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  askerInfo: { flex: 1 },
  askerName: { fontSize: 14, fontWeight: "700", color: COLOR_WHITE_ON_ACCENT },
  timeAgo: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  likeBtnActive: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.2)",
  },
  likeCount: { fontSize: 12, fontWeight: "600", color: colors.textTertiary },
  likeCountActive: { color: colors.error },
  questionBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  answerBlock: {
    backgroundColor: "rgba(16,185,129,0.06)",
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.success,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  answerText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  answeredRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  answeredText: { fontSize: 11, color: colors.success, fontWeight: "600" },

  emptyState: { alignItems: "center", paddingVertical: 56, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: COLOR_WHITE_ON_ACCENT, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: colors.textTertiary },
  emptyAskBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 12,
  },
  emptyAskBtnText: { fontSize: 14, fontWeight: "600", color: COLOR_WHITE_ON_ACCENT },

  modalContainer: { flex: 1, backgroundColor: colors.cardBackground },
  modalHeaderSafe: { backgroundColor: colors.cardBackground },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  modalHeaderText: { flex: 1 },
  modalTitle: { fontSize: 24, fontWeight: "700", color: COLOR_WHITE_ON_ACCENT, marginBottom: 2 },
  modalSub: { fontSize: 13, color: colors.textTertiary },
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
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  questionInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLOR_WHITE_ON_ACCENT,
    minHeight: 120,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 24 : 20,
    paddingTop: 12,
    backgroundColor: colors.cardBackground,
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
