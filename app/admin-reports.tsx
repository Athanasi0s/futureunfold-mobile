import {
  adminBlockUser,
  getAdminReports,
  updateReport,
  type AdminReport,
} from "@/api/features/user-actions";
import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { REPORT_STATUS_COLORS as STATUS_COLORS } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
const TAB_KEYS = [
  { key: undefined as string | undefined, tKey: "admin.reports.tabs.all" },
  { key: "pending", tKey: "admin.reports.tabs.pending" },
  { key: "reviewed", tKey: "admin.reports.tabs.reviewed" },
  { key: "actioned", tKey: "admin.reports.tabs.actioned" },
];

export default function AdminReportsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const TABS = TAB_KEYS.map((tab) => ({ key: tab.key, label: t(tab.tKey) }));
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const fetchReports = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      const data = await getAdminReports(status);
      setReports(data.items);
    } catch {
      Alert.alert(t("admin.reports.alert.loadErrorTitle"), t("admin.reports.alert.loadErrorMessage"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchReports(activeTab);
  }, [activeTab, fetchReports]);

  const handleBlockUser = useCallback(
    (report: AdminReport) => {
      Alert.alert(
        t("admin.reports.alert.blockTitle", { name: report.reported.name }),
        t("admin.reports.alert.blockMessage"),
        [
          { text: t("admin.reports.alert.cancel"), style: "cancel" },
          {
            text: t("admin.reports.alert.blockConfirmButton"),
            style: "destructive",
            onPress: async () => {
              setActioningId(report.id);
              try {
                await adminBlockUser(report.reported.id);
                await updateReport(report.id, "actioned");
                setReports((prev) =>
                  prev.map((r) =>
                    r.id === report.id ? { ...r, status: "actioned" } : r,
                  ),
                );
                Alert.alert(t("admin.reports.alert.blockSuccessTitle"), t("admin.reports.alert.blockSuccessMessage", { name: report.reported.name }));
              } catch {
                Alert.alert(t("admin.reports.alert.errorTitle"), t("admin.reports.alert.blockErrorMessage"));
              } finally {
                setActioningId(null);
              }
            },
          },
        ],
      );
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps -- all captures are stable (setState, module-level imports)
  );

  const handleDismiss = useCallback(
    (report: AdminReport) => {
      Alert.alert(t("admin.reports.alert.dismissTitle"), t("admin.reports.alert.dismissMessage"), [
        { text: t("admin.reports.alert.cancel"), style: "cancel" },
        {
          text: t("admin.reports.alert.dismissConfirmButton"),
          onPress: async () => {
            setActioningId(report.id);
            try {
              await updateReport(report.id, "reviewed");
              setReports((prev) =>
                prev.map((r) =>
                  r.id === report.id ? { ...r, status: "reviewed" } : r,
                ),
              );
            } catch {
              Alert.alert(t("admin.reports.alert.errorTitle"), t("admin.reports.alert.updateErrorMessage"));
            } finally {
              setActioningId(null);
            }
          },
        },
      ]);
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps -- all captures are stable (setState, module-level imports)
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const renderItem = useCallback(
    ({ item }: { item: AdminReport }) => {
      const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
      const isActioning = actioningId === item.id;

      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardUsers}>
              <ThemedText style={styles.cardLabel}>
                <ThemedText style={styles.cardBold}>{item.reporter.name}</ThemedText>
                {` ${t("admin.reports.reportedLabel")} `}
                <ThemedText style={styles.cardBold}>{item.reported.name}</ThemedText>
              </ThemedText>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
            >
              <ThemedText style={[styles.statusText, { color: statusStyle.text }]}>
                {item.status}
              </ThemedText>
            </View>
          </View>

          <View style={styles.cardBody}>
            <ThemedText style={styles.reasonLabel}>{t("admin.reports.reasonLabel")}</ThemedText>
            <ThemedText style={styles.reasonValue}>{item.reason}</ThemedText>
            {item.details ? (
              <ThemedText style={styles.details} numberOfLines={3}>
                {item.details}
              </ThemedText>
            ) : null}
          </View>

          {item.created_at ? (
            <ThemedText style={styles.dateText}>{formatDate(item.created_at)}</ThemedText>
          ) : null}

          {item.status === "pending" && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => handleDismiss(item)}
                disabled={isActioning}
              >
                {isActioning ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <ThemedText style={styles.dismissText}>{t("admin.reports.dismissButton")}</ThemedText>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.blockButton}
                onPress={() => handleBlockUser(item)}
                disabled={isActioning}
              >
                {isActioning ? (
                  <ActivityIndicator size="small" color={COLOR_WHITE_ON_ACCENT} />
                ) : (
                  <ThemedText style={styles.blockText}>{t("admin.reports.blockUserButton")}</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    },
    [styles, colors, actioningId, handleBlockUser, handleDismiss, t],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("admin.reports.title") }} />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.label}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.center}>
            <Ionicons
              name="checkmark-circle-outline"
              size={48}
              color={colors.textSecondary}
            />
            <ThemedText style={styles.emptyText}>{t("admin.reports.emptyText")}</ThemedText>
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          />
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
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 12,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    tabRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: "center",
    },
    tabActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
    },
    list: {
      padding: 16,
      paddingBottom: 32,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    cardUsers: {
      flex: 1,
      marginRight: 8,
    },
    cardLabel: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    cardBold: {
      fontWeight: "700",
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    cardBody: {
      marginBottom: 8,
    },
    reasonLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 2,
    },
    reasonValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
    },
    details: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 6,
      lineHeight: 18,
    },
    dateText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 10,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      paddingTop: 12,
    },
    dismissButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: "center",
    },
    dismissText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    blockButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.error,
      alignItems: "center",
    },
    blockText: {
      fontSize: 14,
      fontWeight: "600",
      color: COLOR_WHITE_ON_ACCENT,
    },
  });
