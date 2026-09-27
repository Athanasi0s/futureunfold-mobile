import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type CreatePollModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (question: string, options: string[]) => void;
};

const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;

export function CreatePollModal({ visible, onClose, onSubmit }: CreatePollModalProps) {
  const colors = useColors();
  const { t } = useTranslation();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setQuestion("");
    setOptions(["", ""]);
    setError(null);
    onClose();
  };

  const handleAddOption = () => {
    if (options.length < MAX_OPTIONS) {
      setOptions((prev) => [...prev, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (text: string, index: number) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? text : opt)));
  };

  const handleSubmit = () => {
    const trimmedQuestion = question.trim();
    const filledOptions = options.map((o) => o.trim()).filter(Boolean);

    if (!trimmedQuestion) {
      setError(t("chat.pollQuestionRequired", "Question is required"));
      return;
    }
    if (filledOptions.length < MIN_OPTIONS) {
      setError(t("chat.pollMinOptions", "At least 2 options are required"));
      return;
    }

    setError(null);
    onSubmit(trimmedQuestion, filledOptions);
    setQuestion("");
    setOptions(["", ""]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.gradientStart,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Title row */}
          <View style={styles.titleRow}>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              {t("chat.createPoll", "Create Poll")}
            </ThemedText>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Question */}
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
              {t("chat.pollQuestion", "Question")}
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
              placeholder={t("chat.pollQuestionPlaceholder", "What would you like to ask?")}
              placeholderTextColor={colors.textSubtle}
              value={question}
              onChangeText={setQuestion}
              multiline
              maxLength={200}
            />

            {/* Options */}
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
              {t("chat.pollOptions", "Options")}
            </ThemedText>

            {options.map((opt, idx) => (
              <View key={idx} style={styles.optionRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.optionInput,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder={`${t("chat.pollOptionLabel", "Option")} ${idx + 1}`}
                  placeholderTextColor={colors.textSubtle}
                  value={opt}
                  onChangeText={(text) => handleOptionChange(text, idx)}
                  maxLength={100}
                />
                {options.length > MIN_OPTIONS && (
                  <TouchableOpacity
                    onPress={() => handleRemoveOption(idx)}
                    style={styles.removeButton}
                    hitSlop={8}
                  >
                    <Ionicons name="remove-circle-outline" size={22} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {options.length < MAX_OPTIONS && (
              <TouchableOpacity
                style={[
                  styles.addOptionButton,
                  { borderColor: colors.primary },
                ]}
                onPress={handleAddOption}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <ThemedText style={[styles.addOptionLabel, { color: colors.primary }]}>
                  {t("chat.addPollOption", "Add Option")}
                </ThemedText>
              </TouchableOpacity>
            )}

            {error && (
              <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
            )}
          </ScrollView>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.submitLabel}>
              {t("chat.createPollSubmit", "Create Poll")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    maxHeight: "80%",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeButton: {
    padding: 2,
  },
  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: "dashed",
    paddingVertical: 10,
    gap: 6,
    marginTop: 4,
  },
  addOptionLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  submitLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
  },
});
