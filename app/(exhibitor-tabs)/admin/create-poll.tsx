import { useCreatePoll } from "@/features/polls/hooks";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
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
import { INPUT_PLACEHOLDER_DARK } from "@/constants/data-colors";
import { useColors } from "@/hooks/use-colors";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
export default function CreatePollScreen() {
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

  const createPoll = useCreatePoll();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", ""]);

  useFocusEffect(
    useCallback(() => {
      setQuestion("");
      setOptions(["", "", ""]);
    }, [])
  );

  function updateOption(index: number, value: string) {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  }

  function addOption() {
    if (options.length < 6) setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  }

  function handleCreate() {
    if (!question.trim()) {
      Alert.alert(t("exhibitor.createPoll.alertError"), t("exhibitor.createPoll.alertNoQuestion"));
      return;
    }
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      Alert.alert(t("exhibitor.createPoll.alertError"), t("exhibitor.createPoll.alertMinOptions"));
      return;
    }
    createPoll.mutate(
      { session_id: id, question: question.trim(), options: validOptions },
      {
        onSuccess: () => router.back(),
        onError: (err: any) => {
          Alert.alert(
            t("exhibitor.createPoll.alertError"),
            err?.response?.data?.detail || "Failed to create poll"
          );
        },
      }
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
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>{t("exhibitor.createPoll.title")}</ThemedText>
            <ThemedText style={styles.headerSub}>{t("exhibitor.createPoll.dashboard")}</ThemedText>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Target Session */}
          <ThemedText style={styles.sectionLabel}>{t("exhibitor.createPoll.targetSession")}</ThemedText>
          <View style={styles.sessionRow}>
            <ThemedText style={styles.sessionName} numberOfLines={1}>
              {sessionTitle}
            </ThemedText>
            <View style={styles.sessionColorDot} />
          </View>
          <ThemedText style={styles.sessionHint}>
            {t("exhibitor.createPoll.targetDesc")}
          </ThemedText>

          {/* Poll Question */}
          <ThemedText style={[styles.sectionLabel, { marginTop: 24 }]}>
            {t("exhibitor.createPoll.pollQuestion")}
          </ThemedText>
          <TextInput
            style={styles.questionInput}
            value={question}
            onChangeText={setQuestion}
            placeholder={t("exhibitor.createPoll.questionPlaceholder")}
            placeholderTextColor={INPUT_PLACEHOLDER_DARK}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Options */}
          <ThemedText style={[styles.sectionLabel, { marginTop: 24 }]}>{t("exhibitor.createPoll.options")}</ThemedText>

          {options.map((opt, index) => (
            <View key={index} style={styles.optionRow}>
              <TextInput
                style={styles.optionInput}
                value={opt}
                onChangeText={(v) => updateOption(index, v)}
                placeholder={`Option ${index + 1}`}
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
              <ThemedText style={styles.addOptionText}>{t("exhibitor.createPoll.addOption")}</ThemedText>
            </TouchableOpacity>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Start Poll button */}
        <SafeAreaView edges={["bottom"]} style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.startBtn,
              createPoll.isPending && styles.startBtnDisabled,
            ]}
            onPress={handleCreate}
            disabled={createPoll.isPending}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.startBtnText}>
              {createPoll.isPending ? t("exhibitor.createPoll.creating") : t("exhibitor.createPoll.startPoll")}
            </ThemedText>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cardBackground },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },
  flex: { flex: 1 },

  headerSafe: { backgroundColor: colors.cardBackground },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    marginBottom: 2,
  },
  headerSub: { fontSize: 13, color: colors.textTertiary },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // Session row
  sessionRow: {
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
  sessionName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
  },
  sessionColorDot: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  sessionHint: {
    fontSize: 12,
    color: colors.border,
    marginTop: 6,
    marginLeft: 2,
  },

  // Question
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

  // Options
  optionRow: {
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

  // Footer
  footer: {
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
});
