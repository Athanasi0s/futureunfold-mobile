import { getBlockedUsers, unblockUser } from "@/api/features/user-actions";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

type BlockedUser = {
  id: number;
  full_name: string;
  avatar_url: string | null;
};

export default function BlockedUsersScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<number | null>(null);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const fetchBlocked = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBlockedUsers();
      setUsers(data);
    } catch {
      Alert.alert("Error", t("settings.blockedLoadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  const handleUnblock = useCallback(
    (user: BlockedUser) => {
      Alert.alert(t("settings.unblockTitle", { name: user.full_name }), undefined, [
        { text: t("settings.cancel"), style: "cancel" },
        {
          text: t("settings.unblockConfirmButton"),
          onPress: async () => {
            setUnblocking(user.id);
            try {
              await unblockUser(user.id);
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
            } catch {
              Alert.alert("Error", t("settings.unblockError"));
            } finally {
              setUnblocking(null);
            }
          },
        },
      ]);
    },
    [t],
  );

  const renderItem = useCallback(
    ({ item }: { item: BlockedUser }) => (
      <View style={styles.row}>
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          </View>
        )}
        <ThemedText style={styles.name} numberOfLines={1}>
          {item.full_name}
        </ThemedText>
        <TouchableOpacity
          style={styles.unblockButton}
          onPress={() => handleUnblock(item)}
          disabled={unblocking === item.id}
        >
          {unblocking === item.id ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <ThemedText style={styles.unblockText}>{t("settings.unblock")}</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    ),
    [styles, colors, handleUnblock, unblocking, t],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("settings.blockedUsersScreenTitle") }} />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : users.length === 0 ? (
          <View style={styles.center}>
            <Ionicons
              name="people-outline"
              size={48}
              color={colors.textSecondary}
            />
            <ThemedText style={styles.emptyText}>{t("settings.noBlockedUsers")}</ThemedText>
          </View>
        ) : (
          <FlatList
            data={users}
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
    list: {
      padding: 16,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 14,
      marginBottom: 10,
      gap: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    avatarPlaceholder: {
      backgroundColor: colors.chipBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    name: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    unblockButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.error,
    },
    unblockText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.error,
    },
  });
