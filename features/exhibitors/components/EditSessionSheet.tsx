import { getSpeakers } from "@/api/features/program";
import type { SessionOut, SpeakerBriefOut } from "@/api/schemas";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { usePatchSession } from "@/features/exhibitors/hooks/usePatchSession";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { EMPTY_STATE_ICON } from "@/constants/data-colors";
import { useColors } from "@/hooks/use-colors";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
type Props = {
  session: SessionOut | null;
  visible: boolean;
  onClose: () => void;
};

export function EditSessionSheet({ session, visible, onClose }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState<number[]>([]);
  const [speakers, setSpeakers] = useState<SpeakerBriefOut[]>([]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const patchSession = usePatchSession(session?.id ?? 0);
  const { t } = useTranslation();

  // Pre-populate when session changes
  useEffect(() => {
    if (session) {
      setTitle(session.title);
      setStartDate(new Date(session.start_time));
      setEndDate(new Date(session.end_time));
      setSelectedSpeakerIds(session.speakers.map((s) => s.user_id));
    }
  }, [session?.id]);

  // Load all available speakers once
  useEffect(() => {
    getSpeakers().then(setSpeakers).catch(() => {});
  }, []);

  const toggleSpeaker = (id: number) => {
    setSelectedSpeakerIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert(t("exhibitor.editSession.alertValidationTitle"), t("exhibitor.editSession.alertValidationMsg"));
      return;
    }
    if (endDate <= startDate) {
      Alert.alert(t("exhibitor.editSession.alertValidationTitle"), t("exhibitor.editSession.alertEndTimeMsg"));
      return;
    }
    patchSession.mutate(
      {
        title: title.trim(),
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        speaker_ids: selectedSpeakerIds,
      },
      {
        onSuccess: () => onClose(),
        onError: () => Alert.alert(t("exhibitor.editSession.alertErrorTitle"), t("exhibitor.editSession.alertSaveError")),
      },
    );
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  if (!session) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.sheetTitle}>{t("exhibitor.editSession.title")}</ThemedText>

          {/* ── Session Title ── */}
          <ThemedText style={styles.label}>{t("exhibitor.editSession.labelSessionTitle")}</ThemedText>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t("exhibitor.editSession.sessionTitlePlaceholder")}
            placeholderTextColor={colors.textTertiary}
          />

          {/* ── Start / End Time ── */}
          <View style={styles.timeRow}>
            <View style={styles.timeHalf}>
              <ThemedText style={styles.label}>{t("exhibitor.editSession.labelStartTime")}</ThemedText>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setShowStartPicker(true)}
              >
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <ThemedText style={styles.timeText}>{formatTime(startDate)}</ThemedText>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, date) => {
                    setShowStartPicker(Platform.OS === "ios");
                    if (date) setStartDate(date);
                  }}
                />
              )}
            </View>

            <View style={styles.timeHalf}>
              <ThemedText style={styles.label}>{t("exhibitor.editSession.labelEndTime")}</ThemedText>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setShowEndPicker(true)}
              >
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <ThemedText style={styles.timeText}>{formatTime(endDate)}</ThemedText>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, date) => {
                    setShowEndPicker(Platform.OS === "ios");
                    if (date) setEndDate(date);
                  }}
                />
              )}
            </View>
          </View>

          {/* ── Speakers ── */}
          <ThemedText style={styles.label}>{t("exhibitor.editSession.labelSpeakers")}</ThemedText>
          <View style={styles.speakersList}>
            {speakers.map((sp, index) => {
              const selected = selectedSpeakerIds.includes(sp.user_id);
              return (
                <TouchableOpacity
                  key={sp.user_id}
                  style={[
                    styles.speakerRow,
                    index < speakers.length - 1 && styles.speakerRowBorder,
                    selected && styles.speakerRowSelected,
                  ]}
                  onPress={() => toggleSpeaker(sp.user_id)}
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
                  <ThemedText style={styles.speakerName} numberOfLines={1}>
                    {sp.full_name}
                    {sp.company ? ` (${sp.company})` : ""}
                  </ThemedText>
                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.brand}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
            {speakers.length === 0 && (
              <ThemedText style={styles.emptyText}>{t("exhibitor.editSession.noSpeakersAvailable")}</ThemedText>
            )}
          </View>

          {/* ── Engagement & Management ── */}
          <ThemedText style={[styles.label, { marginTop: 20 }]}>
            {t("exhibitor.editSession.labelEngagement")}
          </ThemedText>
          <View style={styles.engagementCard}>
            <TouchableOpacity
              style={styles.engagementRow}
              onPress={() => {
                onClose();
                router.push({
                  pathname: "/(exhibitor-tabs)/admin/polls",
                  params: {
                    sessionId: String(session.id),
                    sessionTitle: session.title,
                  },
                });
              }}
            >
              <View style={styles.engagementIcon}>
                <Ionicons name="bar-chart-outline" size={20} color={colors.brand} />
              </View>
              <View style={styles.engagementInfo}>
                <ThemedText style={styles.engagementTitle}>{t("exhibitor.editSession.engagementStartPoll")}</ThemedText>
                <ThemedText style={styles.engagementSub}>{t("exhibitor.editSession.engagementStartPollSub")}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* ── Actions ── */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              patchSession.isPending && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={patchSession.isPending}
          >
            <ThemedText style={styles.saveBtnText}>
              {patchSession.isPending ? t("exhibitor.admin.saving") : t("exhibitor.editSession.saveChanges")}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <ThemedText style={styles.cancelText}>{t("common.cancel")}</ThemedText>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    marginBottom: 20,
    marginTop: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLOR_WHITE_ON_ACCENT,
    marginBottom: 20,
  },

  // Time row
  timeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  timeHalf: {
    flex: 1,
  },
  timeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
  },

  // Speakers
  speakersList: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
    overflow: "hidden",
  },
  speakerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  speakerRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  speakerRowSelected: {
    backgroundColor: "rgba(25, 79, 240, 0.08)",
  },
  speakerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  speakerAvatarPlaceholder: {
    backgroundColor: EMPTY_STATE_ICON,
    justifyContent: "center",
    alignItems: "center",
  },
  speakerInitial: {
    fontSize: 13,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  speakerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: COLOR_WHITE_ON_ACCENT,
  },
  emptyText: {
    padding: 16,
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: "center",
  },

  // Engagement
  engagementCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 24,
    overflow: "hidden",
  },
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  engagementIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(25, 79, 240, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  engagementInfo: {
    flex: 1,
  },
  engagementTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
  },
  engagementSub: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 1,
  },

  // Buttons
  saveBtn: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textTertiary,
  },
});
