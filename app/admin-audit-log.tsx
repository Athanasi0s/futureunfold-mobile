import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { useAdminAuditLog } from "@/features/admin/hooks/useAdminAuditLog";
import type { AuditLogEntry } from "@/features/admin/api";
import { Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 25;

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAuditLogScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const getActionColor = (action: string): string => {
    if (action.includes("delete")) return colors.error;
    if (action.includes("block")) return colors.warning;
    if (action.includes("create")) return colors.success;
    if (action.includes("update") || action.includes("set"))
      return colors.primary;
    return colors.textSecondary;
  };

  const [offset, setOffset] = useState(0);
  const { data, isLoading, isFetching, isError, error, refetch } = useAdminAuditLog({
    offset,
    limit: PAGE_SIZE,
  });

  const handleEndReached = useCallback(() => {
    if (data && offset + PAGE_SIZE < data.total && !isFetching) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [data, offset, isFetching]);

  const renderEntry = ({ item }: { item: AuditLogEntry }) => (
    <View style={styles.entryRow}>
      <View style={styles.entryHeader}>
        <View
          style={[
            styles.actionBadge,
            { backgroundColor: getActionColor(item.action) + "20" },
          ]}
        >
          <ThemedText
            style={[
              styles.actionText,
              { color: getActionColor(item.action) },
            ]}
          >
            {item.action}
          </ThemedText>
        </View>
        <ThemedText style={styles.timestamp}>
          {formatTimestamp(item.created_at)}
        </ThemedText>
      </View>
      <View style={styles.entryDetails}>
        {item.target_type && (
          <ThemedText style={styles.targetText}>
            {item.target_type}
            {item.target_id ? ` #${item.target_id}` : ""}
          </ThemedText>
        )}
        <ThemedText style={styles.adminText}>
          Admin #{item.admin_id}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("admin.auditLog.title") }} />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isError ? (
          <View style={styles.centered}>
            <ThemedText style={styles.emptyText}>
              Failed to load audit log. Pull down to retry.
            </ThemedText>
            <ThemedText style={[styles.emptyText, { fontSize: 12, marginTop: 8 }]}>
              {error?.message || "Unknown error"}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={data?.items ?? []}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderEntry}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={<RefreshControl refreshing={false} onRefresh={() => { setOffset(0); refetch(); }} tintColor={colors.primary} />}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
            ListEmptyComponent={
              <View style={styles.centered}>
                <ThemedText style={styles.emptyText}>
                  {t("admin.auditLog.emptyText")}
                </ThemedText>
              </View>
            }
            ListFooterComponent={
              isFetching ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={styles.footerLoader}
                />
              ) : null
            }
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
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 40,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 15,
    },
    list: {
      padding: 16,
    },
    entryRow: {
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 14,
      marginBottom: 8,
    },
    entryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    actionBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    actionText: {
      fontSize: 12,
      fontWeight: "700",
    },
    timestamp: {
      fontSize: 12,
      color: colors.textSubtle,
    },
    entryDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    targetText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    adminText: {
      fontSize: 12,
      color: colors.textSubtle,
    },
    footerLoader: {
      paddingVertical: 16,
    },
  });
