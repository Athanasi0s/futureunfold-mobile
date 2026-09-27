import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { Ionicons } from "@expo/vector-icons";
import { setAdminConfig } from "@/features/admin/api-config";
import { useConfigStore } from "@/features/config/stores/config-store";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
export default function AdminBrandingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const currentAppName = useConfigStore((s) => s.appName);
  const currentLogoUrl = useConfigStore((s) => s.appLogoUrl);
  const fetchAndCacheConfig = useConfigStore((s) => s.fetchAndCacheConfig);

  const [appName, setAppName] = useState(currentAppName);
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl ?? "");
  const [savingName, setSavingName] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const handleSaveAppName = useCallback(async () => {
    if (!appName.trim()) {
      Alert.alert("Validation", "App name cannot be empty.");
      return;
    }
    setSavingName(true);
    try {
      await setAdminConfig("app_name", appName.trim());
      await fetchAndCacheConfig();
      Alert.alert("Saved", "App name updated successfully.");
    } catch {
      Alert.alert("Error", "Failed to save app name.");
    } finally {
      setSavingName(false);
    }
  }, [appName, fetchAndCacheConfig]);

  const handleSaveLogoUrl = useCallback(async () => {
    setSavingLogo(true);
    try {
      await setAdminConfig("app_logo_url", logoUrl.trim() || null);
      await fetchAndCacheConfig();
      Alert.alert("Saved", "App logo updated successfully.");
    } catch {
      Alert.alert("Error", "Failed to save logo URL.");
    } finally {
      setSavingLogo(false);
    }
  }, [logoUrl, fetchAndCacheConfig]);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Branding" }} />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
          {/* App Name Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="text" size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>App Name</ThemedText>
              </View>
            </View>
            <View style={styles.sectionBody}>
              <ThemedText style={styles.fieldLabel}>
                Display name shown throughout the app
              </ThemedText>
              <TextInput
                style={styles.input}
                value={appName}
                onChangeText={setAppName}
                placeholder="e.g. FUTURE UNFOLD"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveAppName}
                disabled={savingName}
              >
                {savingName ? (
                  <ActivityIndicator size="small" color={COLOR_WHITE_ON_ACCENT} />
                ) : (
                  <ThemedText style={styles.saveButtonText}>
                    Save App Name
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* App Logo Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="image" size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>App Logo</ThemedText>
              </View>
            </View>
            <View style={styles.sectionBody}>
              <ThemedText style={styles.fieldLabel}>
                Paste a URL to your logo image (PNG or SVG recommended)
              </ThemedText>
              <TextInput
                style={styles.input}
                value={logoUrl}
                onChangeText={setLogoUrl}
                placeholder="https://example.com/logo.png"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              {/* Logo Preview */}
              {logoUrl.trim() ? (
                <View style={styles.previewContainer}>
                  <ThemedText style={styles.previewLabel}>Preview</ThemedText>
                  <View style={styles.previewBox}>
                    <Image
                      source={{ uri: logoUrl.trim() }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              ) : currentLogoUrl ? (
                <View style={styles.previewContainer}>
                  <ThemedText style={styles.previewLabel}>
                    Current Logo
                  </ThemedText>
                  <View style={styles.previewBox}>
                    <Image
                      source={{ uri: currentLogoUrl }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.previewContainer}>
                  <ThemedText style={styles.previewLabel}>
                    No logo set - default icon will be used
                  </ThemedText>
                </View>
              )}

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveLogoUrl}
                disabled={savingLogo}
              >
                {savingLogo ? (
                  <ActivityIndicator size="small" color={COLOR_WHITE_ON_ACCENT} />
                ) : (
                  <ThemedText style={styles.saveButtonText}>
                    Save Logo URL
                  </ThemedText>
                )}
              </TouchableOpacity>

              {currentLogoUrl && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    setLogoUrl("");
                    handleSaveLogoUrl();
                  }}
                >
                  <ThemedText style={styles.removeButtonText}>
                    Remove Logo
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    sectionCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 16,
      overflow: "hidden",
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    sectionHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    sectionBody: {
      padding: 16,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
      marginBottom: 12,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
    },
    saveButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
    removeButton: {
      marginTop: 8,
      paddingVertical: 10,
      alignItems: "center",
    },
    removeButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.error,
    },
    previewContainer: {
      marginBottom: 12,
    },
    previewLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 8,
    },
    previewBox: {
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 100,
    },
    previewImage: {
      width: 120,
      height: 80,
    },
  });
