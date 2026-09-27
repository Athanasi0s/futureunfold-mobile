import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/api/client";
import type { ModeratorPermissions } from "@/api/schemas";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
type ScopeKey = keyof ModeratorPermissions;

const DEFAULT_PERMISSIONS: ModeratorPermissions = {
  validate_ticket: false,
  ticket_packages: false,
  user_reports: false,
  manage_sessions: false,
};

const TOGGLES: {
  key: ScopeKey;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    key: "validate_ticket",
    labelKey: "admin.moderatorPermissions.toggles.validateTicket",
    descriptionKey: "admin.moderatorPermissions.toggles.validateTicketDescription",
  },
  {
    key: "ticket_packages",
    labelKey: "admin.moderatorPermissions.toggles.ticketPackages",
    descriptionKey: "admin.moderatorPermissions.toggles.ticketPackagesDescription",
  },
  {
    key: "user_reports",
    labelKey: "admin.moderatorPermissions.toggles.userReports",
    descriptionKey: "admin.moderatorPermissions.toggles.userReportsDescription",
  },
  {
    key: "manage_sessions",
    labelKey: "admin.moderatorPermissions.toggles.manageSessions",
    descriptionKey:
      "admin.moderatorPermissions.toggles.manageSessionsDescription",
  },
];

export default function AdminModeratorPermissionsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();

  const {
    data: fetched,
    isLoading,
  } = useQuery<ModeratorPermissions>({
    queryKey: ["admin", "moderator-permissions"],
    queryFn: () =>
      api.auth<ModeratorPermissions>({
        url: "/admin/moderator-permissions",
        method: "GET",
      }),
  });

  const [permissions, setPermissions] = useState<ModeratorPermissions>(
    DEFAULT_PERMISSIONS,
  );
  const [saving, setSaving] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  useEffect(() => {
    if (fetched) {
      setPermissions({
        validate_ticket: !!fetched.validate_ticket,
        ticket_packages: !!fetched.ticket_packages,
        user_reports: !!fetched.user_reports,
        manage_sessions: !!fetched.manage_sessions,
      });
    }
  }, [fetched]);

  const handleToggle = useCallback((key: ScopeKey, value: boolean) => {
    setPermissions((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await api.auth<ModeratorPermissions>({
        url: "/admin/moderator-permissions",
        method: "PUT",
        data: permissions,
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "moderator-permissions"],
      });
      Alert.alert(
        t("admin.moderatorPermissions.saveSuccess"),
        t("admin.moderatorPermissions.saveSuccessMessage"),
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail || e?.message || "Failed to save";
      Alert.alert(t("common.error"), String(msg));
    } finally {
      setSaving(false);
    }
  }, [permissions, queryClient, t]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: t("admin.moderatorPermissions.title"),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("admin.moderatorPermissions.title"),
        }}
      />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={colors.primary}
              />
              <ThemedText style={styles.sectionTitle}>
                {t("admin.moderatorPermissions.sectionTitle")}
              </ThemedText>
            </View>

            {TOGGLES.map((toggle) => (
              <View key={toggle.key} style={styles.permissionRow}>
                <View style={styles.permissionInfo}>
                  <ThemedText style={styles.permissionLabel}>
                    {t(toggle.labelKey)}
                  </ThemedText>
                  <ThemedText style={styles.permissionDescription}>
                    {t(toggle.descriptionKey)}
                  </ThemedText>
                </View>
                <Switch
                  value={permissions[toggle.key]}
                  onValueChange={(v) => handleToggle(toggle.key, v)}
                  trackColor={{
                    false: colors.cardBorder,
                    true: colors.primary,
                  }}
                  thumbColor={COLOR_WHITE_ON_ACCENT}
                />
              </View>
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.saveContainer,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
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
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLOR_WHITE_ON_ACCENT}
                />
                <ThemedText style={styles.saveButtonText}>
                  {t("admin.moderatorPermissions.saveButton")}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    permissionRow: {
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
    permissionInfo: {
      flex: 1,
      marginRight: 12,
    },
    permissionLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    permissionDescription: {
      fontSize: 12,
      fontWeight: "400",
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 16,
    },
    saveContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
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
