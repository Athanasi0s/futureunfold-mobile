import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";


import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
  submitting: boolean;
  targetName: string;
}

export function ReportModal({
  visible,
  onClose,
  onSubmit,
  submitting,
  targetName,
}: ReportModalProps) {
  const { t } = useTranslation();
  const REPORT_REASONS = [
    { key: "inappropriate", label: t("report.modal.reasons.inappropriateBehavior") },
    { key: "spam", label: t("report.modal.reasons.spam") },
    { key: "harassment", label: t("report.modal.reasons.harassment") },
    { key: "offensive", label: t("report.modal.reasons.offensiveContent") },
    { key: "other", label: t("report.modal.reasons.other") },
  ];
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [reportReason, setReportReason] = useState<string>("");
  const [reportDetails, setReportDetails] = useState("");

  const handleSubmit = () => {
    if (!reportReason) return;
    const reasonObj = REPORT_REASONS.find((r) => r.key === reportReason);
    onSubmit(reasonObj?.key ?? reportReason, reportDetails.trim());
  };

  const handleClose = () => {
    setReportReason("");
    setReportDetails("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView style={reportStyles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
          keyboardShouldPersistTaps="handled"
        >
        <View
          style={[
            reportStyles.modal,
            { backgroundColor: colors.gradientStart, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={reportStyles.modalHeader}>
            <ThemedText style={[reportStyles.modalTitle, { color: colors.text }]}>
              {t("report.modal.title")}
            </ThemedText>
            <TouchableOpacity
              onPress={handleClose}
              style={[
                reportStyles.closeButton,
                { backgroundColor: colors.textSecondary + "15" },
              ]}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ThemedText style={[reportStyles.label, { color: colors.textSecondary }]}>
            {t("report.modal.whyReporting")}
          </ThemedText>
          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.key}
              style={[
                reportStyles.reasonRow,
                { borderColor: colors.cardBorder },
                reportReason === reason.key && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primaryLight,
                },
              ]}
              onPress={() => setReportReason(reason.key)}
            >
              <View
                style={[
                  reportStyles.radioOuter,
                  { borderColor: colors.textSecondary },
                  reportReason === reason.key && {
                    borderColor: colors.primary,
                  },
                ]}
              >
                {reportReason === reason.key && (
                  <View
                    style={[
                      reportStyles.radioInner,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </View>
              <ThemedText style={[reportStyles.reasonText, { color: colors.text }]}>
                {reason.label}
              </ThemedText>
            </TouchableOpacity>
          ))}

          <ThemedText
            style={[
              reportStyles.label,
              { color: colors.textSecondary, marginTop: 16 },
            ]}
          >
            {t("report.modal.additionalDetails")}
          </ThemedText>
          <TextInput
            style={[
              reportStyles.textInput,
              {
                color: colors.text,
                borderColor: colors.cardBorder,
                backgroundColor: colors.cardBackground,
              },
            ]}
            placeholder={t("report.modal.detailsPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            value={reportDetails}
            onChangeText={setReportDetails}
          />
          <ThemedText
            style={[reportStyles.charCount, { color: colors.textSecondary }]}
          >
            {reportDetails.length}/500
          </ThemedText>

          <View style={reportStyles.buttonRow}>
            <TouchableOpacity
              style={[
                reportStyles.cancelButton,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.cardBackground,
                },
              ]}
              onPress={handleClose}
            >
              <ThemedText
                style={[
                  reportStyles.cancelButtonText,
                  { color: colors.text },
                ]}
              >
                {t("report.modal.cancel")}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                reportStyles.submitButton,
                { backgroundColor: colors.primary },
                !reportReason && reportStyles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!reportReason || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLOR_WHITE_ON_ACCENT} />
              ) : (
                <ThemedText style={reportStyles.submitButtonText}>
                  {t("report.modal.submitReport")}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const reportStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reasonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 16,
    fontWeight: "700",
  },
});
