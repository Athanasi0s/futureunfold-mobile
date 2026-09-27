import { FeatureGate } from "@/components/feature-gate";
import { getProgram } from "@/api/features/program";
import type { PollDetailOut, SessionOut } from "@/api/schemas";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import {
  useCreatePoll,
  useDeletePoll,
  useGetMyPolls,
} from "@/features/polls/hooks";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
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
    <View
      style={[
        styles.pollCard,
        poll.is_active ? styles.pollCardActive : styles.pollCardEnded,
      ]}
    >
      <View style={styles.pollCardTop}>
        <View
          style={[
            styles.statusBadge,
            poll.is_active ? styles.statusLive : styles.statusEnded,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              poll.is_active ? styles.dotLive : styles.dotEnded,
            ]}
          />
          <ThemedText
            style={[
              styles.statusText,
              poll.is_active ? styles.statusTextLive : styles.statusTextEnded,
            ]}
          >
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

      {poll.session_title ? (
        <ThemedText style={styles.sessionTitle}>{t("polls.myPolls.sessionLabel")} {poll.session_title}</ThemedText>
      ) : null}

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
        {poll.total_votes} {poll.total_votes !== 1 ? t("polls.myPolls.votesUnit") : t("polls.myPolls.voteUnit")} {t("polls.myPolls.cast")}
      </ThemedText>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MyPollsScreen() {
  return (
    <FeatureGate flag="polls">
      <MyPollsContent />
    </FeatureGate>
  );
}

function MyPollsContent() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const { user, isLoadingUser } = useAuth();
  const router = useRouter();
  const { sessionId: sessionIdParam, sessionTitle: sessionTitleParam } =
    useLocalSearchParams<{ sessionId?: string; sessionTitle?: string }>();

  const preselectedSessionId = sessionIdParam ? Number(sessionIdParam) : null;
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data: polls, isLoading, isError, refetch } = useGetMyPolls();
  const deleteMutation = useDeletePoll();
  const createMutation = useCreatePoll();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessions, setSessions] = useState<SessionOut[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    preselectedSessionId,
  );
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);

  const isSpeaker = user?.role === "speaker" || user?.role === "exhibitor";

  const loadMySessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const allSessions = await getProgram();
      const mySessions = allSessions.filter((s) =>
        s.speakers.some((sp) => sp.user_id === user?.id),
      );
      setSessions(mySessions);
    } catch {
      // Error handled silently — UI shows empty state
    } finally {
      setLoadingSessions(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (showCreateModal && isSpeaker && !preselectedSessionId) {
      loadMySessions();
    }
  }, [showCreateModal, isSpeaker, preselectedSessionId, loadMySessions]);

  const handleDeletePoll = (pollId: number) => {
    Alert.alert(t("polls.myPolls.alertDelete"), t("polls.myPolls.alertDeleteMsg"), [
      { text: t("polls.myPolls.alertCancel"), style: "cancel" },
      {
        text: t("polls.myPolls.alertDeleteBtn"),
        style: "destructive",
        onPress: () =>
          deleteMutation.mutate(pollId, {
            onError: (err: any) =>
              Alert.alert(
                t("polls.myPolls.alertError"),
                err?.response?.data?.detail || "Failed to delete poll",
              ),
          }),
      },
    ]);
  };

  const addOption = () => {
    if (options.length < 6) setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  const resetForm = () => {
    setSelectedSessionId(preselectedSessionId);
    setQuestion("");
    setOptions(["", ""]);
    setShowSessionDropdown(false);
  };

  const handleCreatePoll = () => {
    if (!selectedSessionId) {
      Alert.alert(t("polls.myPolls.alertError"), t("polls.myPolls.alertSelectSession"));
      return;
    }
    if (!question.trim()) {
      Alert.alert(t("polls.myPolls.alertError"), t("polls.myPolls.alertNoQuestion"));
      return;
    }
    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      Alert.alert(t("polls.myPolls.alertError"), t("polls.myPolls.alertMinOptions"));
      return;
    }
    createMutation.mutate(
      {
        session_id: selectedSessionId,
        question: question.trim(),
        options: validOptions,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          resetForm();
          Alert.alert(t("polls.myPolls.alertSuccess"), t("polls.myPolls.alertSuccessMsg"));
        },
        onError: (err: any) =>
          Alert.alert(
            t("polls.myPolls.alertError"),
            err?.response?.data?.detail || "Failed to create poll",
          ),
      },
    );
  };

  // Not authorized
  if (!isLoadingUser && !isSpeaker) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
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
              <ThemedText style={styles.headerTitle}>{t("polls.myPolls.title")}</ThemedText>
            </View>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={48} color={EMPTY_STATE_ICON} />
          <ThemedText style={styles.emptyTitle}>{t("polls.myPolls.accessRestricted")}</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            {t("polls.myPolls.accessMsg")}
          </ThemedText>
        </View>
      </View>
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
      <Stack.Screen options={{ headerShown: false }} />
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
            <ThemedText style={styles.headerTitle}>{t("polls.myPolls.title")}</ThemedText>
          </View>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={16} color={COLOR_WHITE_ON_ACCENT} />
            <ThemedText style={styles.createBtnText}>{t("polls.myPolls.newPoll")}</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading || isLoadingUser ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : isError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={EMPTY_STATE_ICON} />
          <ThemedText style={styles.emptyTitle}>{t("polls.myPolls.loadFailed")}</ThemedText>
          <TouchableOpacity
            style={styles.emptyCreateBtn}
            onPress={() => refetch()}
          >
            <ThemedText style={styles.emptyCreateBtnText}>{t("polls.myPolls.retry")}</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {polls?.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="bar-chart-outline" size={48} color={EMPTY_STATE_ICON} />
              <ThemedText style={styles.emptyTitle}>{t("polls.myPolls.empty")}</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                {t("polls.myPolls.createToEngage")}
              </ThemedText>
              <TouchableOpacity
                style={styles.emptyCreateBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add" size={18} color={COLOR_WHITE_ON_ACCENT} />
                <ThemedText style={styles.emptyCreateBtnText}>{t("polls.myPolls.createNew")}</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {polls?.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onDelete={handleDeletePoll}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </ScrollView>
      )}

      {/* Create Poll Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setShowCreateModal(false); resetForm(); }}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalHeaderSafe}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <ThemedText style={styles.modalTitle}>{t("polls.myPolls.modalTitle")}</ThemedText>
                <ThemedText style={styles.modalSub}>{t("polls.myPolls.speakerDashboard")}</ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => { setShowCreateModal(false); resetForm(); }}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Session Picker */}
              <ThemedText style={styles.sectionLabel}>{t("polls.myPolls.targetSession")}</ThemedText>
              {preselectedSessionId ? (
                <View style={styles.lockedSession}>
                  <Ionicons name="bookmark" size={16} color={colors.brand} />
                  <ThemedText style={styles.lockedSessionText} numberOfLines={2}>
                    {sessionTitleParam}
                  </ThemedText>
                </View>
              ) : loadingSessions ? (
                <ActivityIndicator size="small" color={colors.brand} style={{ marginBottom: 20 }} />
              ) : sessions.length === 0 ? (
                <ThemedText style={styles.noSessionsText}>
                  {t("polls.myPolls.noSessions")}
                </ThemedText>
              ) : (
                <View style={styles.dropdownWrap}>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setShowSessionDropdown((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <ThemedText
                      style={[
                        styles.dropdownTriggerText,
                        !selectedSessionId && styles.dropdownPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {selectedSessionId
                        ? sessions.find((s) => s.id === selectedSessionId)?.title
                        : t("polls.myPolls.selectSession")}
                    </ThemedText>
                    <Ionicons
                      name={showSessionDropdown ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>

                  {showSessionDropdown && (
                    <View style={styles.dropdownList}>
                      {sessions.map((session, index) => (
                        <TouchableOpacity
                          key={session.id}
                          style={[
                            styles.dropdownItem,
                            index < sessions.length - 1 && styles.dropdownItemBorder,
                            selectedSessionId === session.id && styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedSessionId(session.id);
                            setShowSessionDropdown(false);
                          }}
                        >
                          <ThemedText
                            style={[
                              styles.dropdownItemText,
                              selectedSessionId === session.id && styles.dropdownItemTextSelected,
                            ]}
                            numberOfLines={2}
                          >
                            {session.title}
                          </ThemedText>
                          {selectedSessionId === session.id && (
                            <Ionicons name="checkmark" size={16} color={colors.brand} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Question */}
              <ThemedText style={[styles.sectionLabel, { marginTop: 24 }]}>{t("polls.myPolls.pollQuestion")}</ThemedText>
              <TextInput
                style={styles.questionInput}
                value={question}
                onChangeText={setQuestion}
                placeholder={t("polls.myPolls.questionPlaceholder")}
                placeholderTextColor={INPUT_PLACEHOLDER_DARK}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Options */}
              <ThemedText style={[styles.sectionLabel, { marginTop: 24 }]}>{t("polls.myPolls.optionsLabel")}</ThemedText>
              {options.map((option, index) => (
                <View key={index} style={styles.formOptionRow}>
                  <TextInput
                    style={styles.optionInput}
                    value={option}
                    onChangeText={(v) => updateOption(index, v)}
                    placeholder={t("polls.myPolls.optionPlaceholder", { n: index + 1 })}
                    placeholderTextColor={INPUT_PLACEHOLDER_DARK}
                  />
                  {options.length > 2 ? (
                    <TouchableOpacity
                      onPress={() => removeOption(index)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="reorder-three" size={22} color={colors.border} />
                  )}
                </View>
              ))}

              {options.length < 6 && (
                <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
                  <Ionicons name="add" size={18} color={colors.textSecondary} />
                  <ThemedText style={styles.addOptionText}>{t("polls.myPolls.addOption")}</ThemedText>
                </TouchableOpacity>
              )}

              <View style={{ height: 32 }} />
            </ScrollView>

            <SafeAreaView edges={["bottom"]} style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.startBtn, createMutation.isPending && styles.startBtnDisabled]}
                onPress={handleCreatePoll}
                disabled={createMutation.isPending}
                activeOpacity={0.85}
              >
                <ThemedText style={styles.startBtnText}>
                  {createMutation.isPending ? t("polls.myPolls.creating") : t("polls.myPolls.createBtn")}
                </ThemedText>
              </TouchableOpacity>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
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
    gap: 12,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLOR_WHITE_ON_ACCENT },
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

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

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
    marginBottom: 6,
  },
  sessionTitle: { fontSize: 12, color: colors.textTertiary, marginBottom: 14 },

  optionsList: { gap: 8, marginBottom: 12 },
  optionRow: { gap: 4 },
  optionBarBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 3,
    overflow: "hidden",
  },
  optionBarFill: { height: 6, backgroundColor: colors.brand, borderRadius: 3 },
  optionLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  optionText: { fontSize: 13, color: colors.textSecondary },
  optionPct: { fontSize: 13, fontWeight: "600", color: COLOR_WHITE_ON_ACCENT },
  pollFooter: { fontSize: 11, color: colors.border, marginTop: 4 },

  emptyState: { flex: 1, alignItems: "center", paddingVertical: 60, gap: 8 },
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

  // Modal
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
  modalTitle: { fontSize: 26, fontWeight: "700", color: COLOR_WHITE_ON_ACCENT, marginBottom: 2 },
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
  modalContent: { flex: 1 },
  modalScrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  noSessionsText: { fontSize: 14, color: colors.textTertiary, marginBottom: 20 },

  dropdownWrap: { marginBottom: 20 },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dropdownTriggerText: { flex: 1, fontSize: 15, fontWeight: "600", color: COLOR_WHITE_ON_ACCENT },
  dropdownPlaceholder: { color: colors.border, fontWeight: "400" },
  dropdownList: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 6,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  dropdownItemSelected: { backgroundColor: "rgba(25,79,240,0.1)" },
  dropdownItemText: { flex: 1, fontSize: 14, color: colors.textSecondary },
  dropdownItemTextSelected: { color: COLOR_WHITE_ON_ACCENT, fontWeight: "600" },

  questionInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLOR_WHITE_ON_ACCENT,
    minHeight: 100,
  },
  formOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginBottom: 10,
    gap: 8,
  },
  optionInput: {
    flex: 1,
    fontSize: 15,
    color: COLOR_WHITE_ON_ACCENT,
    paddingVertical: 12,
  },
  addOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  addOptionText: { fontSize: 14, color: colors.textSecondary, fontWeight: "500" },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  startBtn: {
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLOR_WHITE_ON_ACCENT,
    letterSpacing: 1,
  },
  lockedSession: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(25,79,240,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(25,79,240,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  lockedSessionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
  },
});
