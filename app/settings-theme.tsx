import { setUserTheme } from "@/api/features/user-actions";
import { THEME_PRESETS } from "@/constants/theme-presets";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { useConfigStore } from "@/features/config/stores/config-store";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

export default function SettingsThemeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const userThemeOptions = useConfigStore((s) => s.userThemeOptions);
  const currentTheme = user?.theme_preference ?? null;
  const [saving, setSaving] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const availablePresets = THEME_PRESETS.filter((p) =>
    userThemeOptions.includes(p.id),
  );

  const handleSelect = async (themeId: string | null) => {
    if (!user) return;
    if (themeId === currentTheme) return;

    setSaving(true);
    try {
      await setUserTheme(themeId);
      setUser({ ...user, theme_preference: themeId });
    } catch {
      Alert.alert(t("settings.themeError"), t("settings.themeErrorMessage"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("settings.themeScreenTitle") }} />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={styles.description}>
            {t("settings.themeDescription")}
          </ThemedText>

          {/* Default option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              currentTheme === null && styles.optionCardSelected,
            ]}
            activeOpacity={0.7}
            onPress={() => handleSelect(null)}
            disabled={saving}
          >
            <View style={styles.optionInfo}>
              <View style={styles.radioOuter}>
                {currentTheme === null && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionTextContainer}>
                <ThemedText style={styles.optionName}>{t("settings.themeDefaultOption")}</ThemedText>
                <ThemedText style={styles.optionSubtitle}>
                  {t("settings.themeDefaultSubtitle")}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>

          {availablePresets.length > 0 && (
            <>
              <ThemedText style={styles.sectionLabel}>{t("settings.themeAvailableLabel")}</ThemedText>
              {availablePresets.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.optionCard,
                    currentTheme === preset.id && styles.optionCardSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(preset.id)}
                  disabled={saving}
                >
                  <View style={styles.optionInfo}>
                    <View style={styles.radioOuter}>
                      {currentTheme === preset.id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View style={styles.optionTextContainer}>
                      <ThemedText style={styles.optionName}>{preset.name}</ThemedText>
                      <View style={styles.swatchRow}>
                        <View
                          style={[
                            styles.swatch,
                            { backgroundColor: preset.primary },
                          ]}
                        />
                        <View
                          style={[
                            styles.swatch,
                            { backgroundColor: preset.secondary },
                          ]}
                        />
                        <View
                          style={[
                            styles.swatch,
                            { backgroundColor: preset.accent },
                          ]}
                        />
                        <View
                          style={[
                            styles.swatch,
                            { backgroundColor: preset.background },
                            styles.swatchBorder,
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {availablePresets.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons
                name="color-palette-outline"
                size={40}
                color={colors.textSecondary}
              />
              <ThemedText style={styles.emptyText}>
                {t("settings.themeNoThemes")}
              </ThemedText>
            </View>
          )}

          {saving && (
            <View style={styles.savingOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
              <ThemedText style={styles.savingText}>{t("settings.themeSaving")}</ThemedText>
            </View>
          )}
        </ScrollView>
      </View>
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
      paddingBottom: 32,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 1,
      marginTop: 20,
      marginBottom: 10,
      marginLeft: 4,
    },
    optionCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
      marginBottom: 10,
    },
    optionCardSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    optionInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.textSecondary,
      justifyContent: "center",
      alignItems: "center",
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    optionTextContainer: {
      flex: 1,
    },
    optionName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    optionSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    swatchRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 8,
    },
    swatch: {
      width: 24,
      height: 24,
      borderRadius: 6,
    },
    swatchBorder: {
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
      gap: 12,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    savingOverlay: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 16,
    },
    savingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });
