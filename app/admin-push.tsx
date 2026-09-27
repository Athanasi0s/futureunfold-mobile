import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  AudienceSegmentRadio,
  AUDIENCE_OPTIONS,
  type AudienceValue,
} from "@/components/admin-push/AudienceSegmentRadio";
import {
  AudienceAgeBandRadio,
  AGE_BAND_OPTIONS,
  type AgeBandValue,
} from "@/components/admin-push/AudienceAgeBandRadio";
import {
  DeeplinkTemplatePicker,
  TEMPLATE_OPTIONS,
} from "@/components/admin-push/DeeplinkTemplatePicker";
import { SendConfirmModal } from "@/components/admin-push/SendConfirmModal";
import { DeviceBreakdownModal } from "@/components/admin-push/DeviceBreakdownModal";
import { useSendBroadcast } from "@/features/admin-push/hooks/useSendBroadcast";
import type {
  BroadcastPushIn,
  BroadcastPushOut,
  DeeplinkTemplate,
} from "@/api/schemas";
import { Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type AxiosLikeError = Error & {
  response?: {
    status?: number;
    data?: { detail?: unknown };
  };
};

export default function AdminPushScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AudienceValue>("all");
  const [ageBand, setAgeBand] = useState<AgeBandValue>("all");
  const [template, setTemplate] = useState<DeeplinkTemplate>("none");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<BroadcastPushOut | null>(null);
  const [emptyTargetError, setEmptyTargetError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const mutation = useSendBroadcast();

  const audienceLabel = useMemo(
    () =>
      AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? "All users",
    [audience],
  );
  const deeplinkLabel = useMemo(
    () =>
      TEMPLATE_OPTIONS.find((o) => o.value === template)?.label ??
      "No link (open app home)",
    [template],
  );
  const ageBandLabel = useMemo(
    () =>
      AGE_BAND_OPTIONS.find((o) => o.value === ageBand)?.label ?? "All ages",
    [ageBand],
  );

  const handleSendPress = useCallback(() => {
    if (!title.trim() || !body.trim()) {
      Alert.alert(
        t("admin.push.alert.validationTitle"),
        t("admin.push.alert.validationMessage"),
      );
      return;
    }
    setEmptyTargetError(null);
    setConfirmOpen(true);
  }, [title, body, t]);

  const handleConfirm = useCallback(async () => {
    const payload: BroadcastPushIn = {
      title: title.trim(),
      body: body.trim(),
      role_filter: audience === "all" ? null : audience,
      deeplink_template: template,
      age_band: ageBand,
    };
    try {
      const data = await mutation.mutateAsync(payload);
      setConfirmOpen(false);
      setResult(data);
    } catch (err) {
      setConfirmOpen(false);
      const axiosErr = err as AxiosLikeError;
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data?.detail;
      if (status === 400 && typeof detail === "string") {
        // Backend canonical empty-target message — render verbatim.
        setEmptyTargetError(detail);
      } else {
        Alert.alert(
          t("admin.push.alert.errorTitle"),
          t("admin.push.alert.errorMessage"),
        );
      }
    }
  }, [title, body, audience, ageBand, template, mutation, t]);

  const handleDismissResult = useCallback(() => {
    const sent = result;
    setResult(null);
    if (sent) {
      // Reset the form after a successful send so the next broadcast starts fresh.
      setTitle("");
      setBody("");
      setAudience("all");
      setAgeBand("all");
      setTemplate("none");
    }
  }, [result]);

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: t("admin.push.title") }}
      />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 24 },
            ]}
          >
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="megaphone" size={24} color={colors.primary} />
                <ThemedText style={styles.cardTitle}>
                  {t("admin.push.cardTitle")}
                </ThemedText>
              </View>

              <View style={styles.field}>
                <ThemedText style={styles.fieldLabel}>
                  {t("admin.push.fields.title")}
                </ThemedText>
                <TextInput
                  style={styles.fieldInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t("admin.push.fields.titlePlaceholder")}
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <View style={styles.field}>
                <ThemedText style={styles.fieldLabel}>
                  {t("admin.push.fields.body")}
                </ThemedText>
                <TextInput
                  style={[styles.fieldInput, styles.fieldMultiline]}
                  value={body}
                  onChangeText={setBody}
                  placeholder={t("admin.push.fields.bodyPlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  multiline
                />
              </View>

              <View style={styles.field}>
                <ThemedText style={styles.sectionHeader}>
                  Link destination
                </ThemedText>
                <ThemedText style={styles.sectionHelper}>
                  Choose a screen users land on when they tap the notification.
                </ThemedText>
                <DeeplinkTemplatePicker
                  value={template}
                  onChange={(v) => {
                    setTemplate(v);
                    // A new template invalidates any prior empty-target banner.
                    if (emptyTargetError) setEmptyTargetError(null);
                  }}
                />
              </View>

              <View style={styles.field}>
                <ThemedText style={styles.sectionHeader}>Audience</ThemedText>
                <AudienceSegmentRadio
                  value={audience}
                  onChange={setAudience}
                />
              </View>

              <View style={styles.field}>
                <ThemedText style={styles.sectionHeader}>Age range</ThemedText>
                <AudienceAgeBandRadio value={ageBand} onChange={setAgeBand} />
              </View>

              {emptyTargetError ? (
                <View
                  style={[
                    styles.banner,
                    {
                      borderColor: colors.error,
                      backgroundColor: colors.cardBackground,
                    },
                  ]}
                  testID="empty-target-banner"
                >
                  <Ionicons
                    name="warning"
                    size={20}
                    color={colors.error}
                    style={styles.bannerIcon}
                  />
                  <ThemedText
                    style={[styles.bannerText, { color: colors.error }]}
                  >
                    {emptyTargetError}
                  </ThemedText>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendPress}
                disabled={mutation.isPending}
                accessibilityRole="button"
                accessibilityLabel="Send push"
                testID="send-push-button"
              >
                {mutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <View style={styles.sendButtonContent}>
                    <Ionicons name="send" size={18} color={colors.white} />
                    <ThemedText style={styles.sendButtonText}>
                      Send push
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <SendConfirmModal
        visible={confirmOpen}
        audienceLabel={audienceLabel}
        deeplinkLabel={deeplinkLabel}
        ageBandLabel={ageBandLabel}
        isPending={mutation.isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      <DeviceBreakdownModal result={result} onDismiss={handleDismissResult} />
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },
    scrollContent: {
      padding: 16,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 20,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 20,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    field: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.label,
      marginBottom: 6,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 6,
    },
    sectionHelper: {
      fontSize: 11,
      fontWeight: "400",
      color: colors.textSecondary,
      marginBottom: 10,
      lineHeight: 16,
    },
    fieldInput: {
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
    },
    fieldMultiline: {
      height: 100,
      textAlignVertical: "top",
    },
    banner: {
      flexDirection: "row",
      alignItems: "flex-start",
      borderRadius: 8,
      borderWidth: 1,
      padding: 12,
      marginTop: 4,
      marginBottom: 12,
    },
    bannerIcon: {
      marginRight: 8,
      marginTop: 1,
    },
    bannerText: {
      fontSize: 14,
      flex: 1,
      lineHeight: 20,
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    sendButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sendButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.white,
    },
  });
