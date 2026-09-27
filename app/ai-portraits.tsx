import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { ThemedText } from "@/components/themed-text";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AiPortraitsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const aiPortraitsUrl = useConfigStore((state) => state.aiPortraitsUrl);
  const [hasConsented, setHasConsented] = useState(false);
  const hasBackgroundArt = Boolean(getTenantBackgroundSource("secondary"));

  const openPortraits = async () => {
    if (!hasConsented) {
      Alert.alert(t("futureUnfold.portraits"), t("futureUnfold.portraitsConsentRequired"));
      return;
    }
    if (!aiPortraitsUrl) {
      Alert.alert(t("futureUnfold.portraits"), t("futureUnfold.portraitsUnavailable"));
      return;
    }

    await WebBrowser.openBrowserAsync(aiPortraitsUrl);
  };

  return (
    <SafeAreaView style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: width * (1864 / 2100) }]}
        />
      )}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("futureUnfold.back")}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t("futureUnfold.portraits")}</ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles" size={36} color={colors.brand} />
        </View>
        <ThemedText style={styles.title}>{t("futureUnfold.portraitsTitle")}</ThemedText>
        <ThemedText style={styles.description}>
          {t("futureUnfold.portraitsDescription")}
        </ThemedText>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.brand} />
          <ThemedText style={styles.infoText}>
            {t("futureUnfold.portraitsNoTransfer")}
          </ThemedText>
        </View>

        <TouchableOpacity
          accessibilityRole="checkbox"
          accessibilityState={{ checked: hasConsented }}
          activeOpacity={0.8}
          onPress={() => setHasConsented((value) => !value)}
          style={styles.consentRow}
        >
          <View style={[styles.checkbox, hasConsented && styles.checkboxChecked]}>
            {hasConsented && (
              <Ionicons name="checkmark" size={18} color={COLOR_WHITE_ON_ACCENT} />
            )}
          </View>
          <ThemedText style={styles.consentText}>
            {t("futureUnfold.portraitsPrivacy")}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={openPortraits}
          style={[styles.openButton, !hasConsented && styles.openButtonDisabled]}
        >
          <Ionicons name="camera-outline" size={22} color={COLOR_WHITE_ON_ACCENT} />
          <ThemedText style={styles.openButtonText}>
            {t("futureUnfold.portraitsOpen")}
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    backgroundArt: { position: "absolute", top: 0, alignSelf: "center", opacity: 0.12 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
    content: { padding: 24, paddingBottom: 48 },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 22,
    },
    title: { fontSize: 28, lineHeight: 34, fontWeight: "700", color: colors.text },
    description: { marginTop: 12, fontSize: 16, lineHeight: 24, color: colors.textSecondary },
    infoCard: {
      flexDirection: "row",
      gap: 12,
      padding: 16,
      marginTop: 24,
      borderRadius: 14,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    infoText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
    consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 24 },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.brand,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    checkboxChecked: { backgroundColor: colors.brand },
    consentText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
    openButton: {
      marginTop: 28,
      minHeight: 52,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.brand,
    },
    openButtonDisabled: { opacity: 0.55 },
    openButtonText: { color: COLOR_WHITE_ON_ACCENT, fontSize: 16, fontWeight: "700" },
  });
}
