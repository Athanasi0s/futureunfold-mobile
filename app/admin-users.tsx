import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  useAdminUsers,
  useBlockUser,
  useUnblockUser,
  useDeleteUser,
} from "@/features/admin/hooks/useAdminUsers";
import type { AdminUser } from "@/features/admin/api";
import { api } from "@/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const ROLES = ["attendee", "speaker", "exhibitor", "moderator", "admin"] as const;

const PAGE_SIZE = 20;

export default function AdminUsersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data, isLoading, isFetching } = useAdminUsers({
    search: debouncedSearch || undefined,
    offset,
    limit: PAGE_SIZE,
  });

  // Accumulate users across pages
  useEffect(() => {
    if (!data?.items) return;
    if (offset === 0) {
      setAllUsers(data.items);
    } else {
      setAllUsers((prev) => {
        const existingIds = new Set(prev.map((u) => u.id));
        const newItems = data.items.filter((u) => !existingIds.has(u.id));
        return [...prev, ...newItems];
      });
    }
  }, [data?.items, offset]);

  const qc = useQueryClient();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const deleteMutation = useDeleteUser();

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      api.auth<{ status: string }>({
        url: `/admin/users/${userId}/role`,
        method: "PUT",
        data: { role },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(text);
      setOffset(0);
      setAllUsers([]);
    }, 300);
  }, []);

  const handleToggleBlock = useCallback(
    (user: AdminUser) => {
      if (user.is_blocked) {
        unblockMutation.mutate(user.id);
      } else {
        Alert.alert(
          t("admin.users.alert.blockTitle"),
          t("admin.users.alert.blockMessage", { name: user.full_name || user.email }),
          [
            { text: t("admin.users.alert.cancel"), style: "cancel" },
            {
              text: t("admin.users.alert.blockConfirmButton"),
              style: "destructive",
              onPress: () => blockMutation.mutate(user.id),
            },
          ],
        );
      }
    },
    [blockMutation, unblockMutation, t],
  );

  const handleDelete = useCallback(
    (user: AdminUser) => {
      Alert.alert(
        t("admin.users.alert.deleteTitle"),
        t("admin.users.alert.deleteMessage", { name: user.full_name || user.email }),
        [
          { text: t("admin.users.alert.cancel"), style: "cancel" },
          {
            text: t("admin.users.alert.deleteConfirmButton"),
            style: "destructive",
            onPress: () => deleteMutation.mutate(user.id),
          },
        ],
      );
    },
    [deleteMutation, t],
  );

  const handleEndReached = useCallback(() => {
    if (data && allUsers.length < data.total && !isFetching) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [data, allUsers.length, isFetching]);

  const [rolePickerUser, setRolePickerUser] = useState<AdminUser | null>(null);

  const handleChangeRole = useCallback(
    (user: AdminUser) => {
      setRolePickerUser(user);
    },
    [],
  );

  const handleRoleSelect = useCallback(
    (role: string) => {
      if (!rolePickerUser) return;
      const user = rolePickerUser;
      setRolePickerUser(null);
      Alert.alert(
        t("admin.users.alert.confirmRoleTitle"),
        `Change ${user.full_name || user.email} from "${user.role}" to "${role}"?`,
        [
          { text: t("admin.users.alert.cancel"), style: "cancel" },
          {
            text: t("admin.users.alert.confirm"),
            onPress: () => roleMutation.mutate({ userId: user.id, role }),
          },
        ],
      );
    },
    [rolePickerUser, roleMutation, t],
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return colors.error;
      case "moderator":
        return colors.primary;
      case "speaker":
        return colors.primary;
      case "exhibitor":
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const renderUser = ({ item }: { item: AdminUser }) => (
    <View style={styles.userRow}>
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <ThemedText style={styles.userName}>
            {item.full_name || t("admin.users.noName")}
          </ThemedText>
          {item.is_blocked && (
            <View style={styles.blockedBadge}>
              <ThemedText style={styles.blockedText}>{t("admin.users.blockedBadge")}</ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
        <TouchableOpacity
          style={[
            styles.roleBadge,
            { backgroundColor: getRoleBadgeColor(item.role) + "20" },
          ]}
          onPress={() => handleChangeRole(item)}
        >
          <View style={styles.roleBadgeContent}>
            <ThemedText
              style={[styles.roleText, { color: getRoleBadgeColor(item.role) }]}
            >
              {item.role}
            </ThemedText>
            <Ionicons
              name="chevron-down"
              size={10}
              color={getRoleBadgeColor(item.role)}
            />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => handleToggleBlock(item)}
          style={styles.actionButton}
        >
          <Ionicons
            name={item.is_blocked ? "lock-open" : "lock-closed"}
            size={18}
            color={
              item.is_blocked ? colors.success : colors.warning
            }
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.actionButton}
        >
          <Ionicons name="trash" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("admin.users.title") }} />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={colors.placeholder}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t("admin.users.searchPlaceholder")}
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={handleSearchChange}
          />
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={allUsers}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderUser}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
            ListEmptyComponent={
              <View style={styles.centered}>
                <ThemedText style={styles.emptyText}>
                  {t("admin.users.emptyText")}
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

      <Modal
        visible={!!rolePickerUser}
        transparent
        animationType="fade"
        onRequestClose={() => setRolePickerUser(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRolePickerUser(null)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <ThemedText style={styles.modalTitle}>{t("admin.users.changeRoleTitle")}</ThemedText>
            <ThemedText style={styles.modalSubtitle}>
              {rolePickerUser?.full_name || rolePickerUser?.email}
            </ThemedText>
            {ROLES.filter((r) => r !== rolePickerUser?.role).map((role) => (
              <TouchableOpacity
                key={role}
                style={styles.modalOption}
                onPress={() => handleRoleSelect(role)}
              >
                <ThemedText style={styles.modalOptionText}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setRolePickerUser(null)}
            >
              <ThemedText style={styles.modalCancelText}>{t("admin.users.alert.cancel")}</ThemedText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.searchBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.searchBorder,
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 42,
      fontSize: 15,
      color: colors.text,
    },
    list: {
      paddingHorizontal: 16,
    },
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 14,
      marginBottom: 8,
    },
    userInfo: {
      flex: 1,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 2,
    },
    userName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    userEmail: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    roleBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    roleBadgeContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    roleText: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    blockedBadge: {
      backgroundColor: colors.error + "20",
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 6,
    },
    blockedText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.error,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      padding: 6,
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
    footerLoader: {
      paddingVertical: 16,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      width: "80%",
      maxWidth: 320,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 4,
    },
    modalSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 16,
    },
    modalOption: {
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    modalOptionText: {
      fontSize: 16,
      color: colors.primary,
      textAlign: "center",
      fontWeight: "600",
    },
    modalCancel: {
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      marginTop: 8,
    },
    modalCancelText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });
