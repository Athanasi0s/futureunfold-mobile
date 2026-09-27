import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/api/client";
import { setAdminConfig } from "@/features/admin/api-config";
import { useConfigStore } from "@/features/config/stores/config-store";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
type FeatureRegistryItem = {
  key: string;
  label: string;
  enabled: boolean;
  depends_on: string[];
  default: boolean;
};

export default function AdminFeaturesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();

  const { data: registry, isLoading: registryLoading } = useQuery({
    queryKey: ["admin", "feature-registry"],
    queryFn: () =>
      api.auth<FeatureRegistryItem[]>({
        url: "/admin/feature-registry",
        method: "GET",
      }),
  });

  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  // Initialize flags from current config store values + registry defaults
  useEffect(() => {
    if (!registry) return;
    const initial: Record<string, boolean> = {};
    for (const item of registry) {
      initial[item.key] = item.enabled;
    }
    setFlags(initial);
    setDirty(false);
  }, [registry]);

  const rootFeatures = useMemo(
    () => (registry ?? []).filter((f) => f.depends_on.length === 0),
    [registry],
  );
  const subFeatures = useMemo(
    () => (registry ?? []).filter((f) => f.depends_on.length > 0),
    [registry],
  );

  // Find ALL descendants recursively
  const findAllDescendants = useCallback(
    (parentKey: string): string[] => {
      const directChildren = (registry ?? []).filter((f) => f.depends_on.includes(parentKey));
      const descendants: string[] = [];
      for (const child of directChildren) {
        descendants.push(child.key);
        descendants.push(...findAllDescendants(child.key));
      }
      return descendants;
    },
    [registry],
  );

  const handleToggle = useCallback(
    (feature: FeatureRegistryItem, newValue: boolean) => {
      // If disabling a feature, check for descendants
      if (!newValue) {
        const allDescendants = findAllDescendants(feature.key);
        const affectedLabels = allDescendants
          .filter((key) => flags[key])
          .map((key) => (registry ?? []).find((f) => f.key === key)?.label || key);

        if (affectedLabels.length > 0) {
          Alert.alert(
            "Disable Feature",
            `Disabling "${feature.label}" will also disable:\n${affectedLabels.join("\n")}\n\nContinue?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Disable All",
                style: "destructive",
                onPress: () => {
                  setFlags((prev) => {
                    const updated = { ...prev, [feature.key]: false };
                    for (const key of allDescendants) {
                      updated[key] = false;
                    }
                    return updated;
                  });
                  setDirty(true);
                },
              },
            ],
          );
          return;
        }
      }

      setFlags((prev) => ({ ...prev, [feature.key]: newValue }));
      setDirty(true);
    },
    [flags, findAllDescendants, registry],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await setAdminConfig("feature_flags", flags);
      await useConfigStore.getState().fetchAndCacheConfig();
      queryClient.invalidateQueries({ queryKey: ["admin", "feature-registry"] });
      setDirty(false);
      Alert.alert("Saved", "Feature toggles updated successfully.");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Failed to save";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  }, [flags, queryClient]);

  const renderFeatureRow = (feature: FeatureRegistryItem, isSub = false) => {
    const parentOff = isSub && feature.depends_on.length > 0 && feature.depends_on.some((dep) => !flags[dep]);
    const isDisabled = parentOff;
    const value = flags[feature.key] ?? feature.default;

    return (
      <View
        key={feature.key}
        style={[styles.featureRow, isSub && styles.subFeatureRow, isDisabled && styles.featureRowDisabled]}
      >
        <View style={styles.featureInfo}>
          <ThemedText style={[styles.featureLabel, isDisabled && styles.featureLabelDisabled]}>
            {feature.label}
          </ThemedText>
          <ThemedText style={styles.featureKey}>{feature.key}</ThemedText>
          {isSub && feature.depends_on.length > 0 && (
            <ThemedText style={styles.dependsLabel}>
              Requires: {feature.depends_on.map((d) => (registry ?? []).find((r) => r.key === d)?.label || d).join(" + ")}
            </ThemedText>
          )}
        </View>
        <Switch
          value={value && !parentOff}
          onValueChange={(v) => handleToggle(feature, v)}
          disabled={!!isDisabled}
          trackColor={{ false: colors.cardBorder, true: colors.primary }}
          thumbColor={COLOR_WHITE_ON_ACCENT}
        />
      </View>
    );
  };

  if (registryLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "Feature Toggles" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Feature Toggles" }} />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Core Features */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid" size={18} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Core Features</ThemedText>
            </View>
            {rootFeatures.map((f) => renderFeatureRow(f))}
          </View>

          {/* Sub-Features */}
          {subFeatures.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="git-branch" size={18} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>Sub-Features</ThemedText>
              </View>
              {subFeatures.map((f) => renderFeatureRow(f, true))}
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        {dirty && (
          <View style={[styles.saveContainer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={COLOR_WHITE_ON_ACCENT} size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={COLOR_WHITE_ON_ACCENT} />
                  <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
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
      paddingBottom: 100,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
      marginBottom: 8,
    },
    subFeatureRow: {
      marginLeft: 16,
    },
    featureRowDisabled: {
      opacity: 0.5,
    },
    featureInfo: {
      flex: 1,
      marginRight: 12,
    },
    featureLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    featureLabelDisabled: {
      color: colors.textSecondary,
    },
    featureKey: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
      fontFamily: "monospace",
    },
    dependsLabel: {
      fontSize: 11,
      color: colors.primary,
      marginTop: 4,
      fontStyle: "italic",
    },
    saveContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      paddingBottom: 32,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
  });
