import type { UserListItem } from "@/api/schemas";
import { FeatureGate } from "@/components/feature-gate";
import { getUsers } from "@/api/features/user";
import { useColors } from "@/hooks/use-colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

function UserRow({
  user,
  onPress,
  styles,
}: {
  user: UserListItem;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const initial = (user.full_name ?? "?")[0].toUpperCase();

  return (
    <TouchableOpacity
      style={styles.userRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {user.avatar_url ? (
        <Image
          source={{ uri: user.avatar_url }}
          style={styles.avatar}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <ThemedText style={styles.avatarInitial}>{initial}</ThemedText>
        </View>
      )}
      <View style={styles.userInfo}>
        <ThemedText style={styles.userName} numberOfLines={1}>
          {user.full_name}
        </ThemedText>
        {user.company && (
          <ThemedText style={styles.userCompany} numberOfLines={1}>
            {user.company}
          </ThemedText>
        )}
      </View>
      {user.role && user.role !== "attendee" && (
        <View style={styles.rolePill}>
          <ThemedText style={styles.rolePillText}>{user.role.toUpperCase()}</ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MessagesComposeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", "compose"],
    queryFn: () => getUsers({ page_size: 100 }),
  });

  const filteredUsers = useMemo(() => {
    const users = usersData?.users ?? [];
    if (!search) return users;
    const lower = search.toLowerCase();
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(lower) ||
        (u.company && u.company.toLowerCase().includes(lower)),
    );
  }, [usersData, search]);

  const handleUserPress = useCallback(
    (user: UserListItem) => {
      router.push({
        pathname: "/dm-chat",
        params: {
          user_id: user.id.toString(),
          name: user.full_name,
        },
      });
    },
    [router],
  );

  return (
    <FeatureGate flag="direct_messages">
      <View style={styles.container}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("messages.composeTitle")}</ThemedText>
          <View style={styles.backButton} />
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <MaterialIcons
              name="search"
              size={22}
              color={colors.icon}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder={t("messages.searchPlaceholder")}
              placeholderTextColor={colors.icon}
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>
        </View>

        {/* User list */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <UserRow user={item} onPress={() => handleUserPress(item)} styles={styles} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>{t("messages.noUsersFound")}</ThemedText>
              </View>
            }
          />
        )}
      </View>
    </FeatureGate>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.gradientStart,
    },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    backButton: {
      width: 36,
      height: 36,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    listContent: {
      paddingHorizontal: 16,
    },
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    avatarPlaceholder: {
      backgroundColor: colors.cardBackground,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    avatarInitial: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    userCompany: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    rolePill: {
      backgroundColor: "rgba(139, 92, 246, 0.2)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    rolePillText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: 0.5,
    },
    emptyContainer: {
      alignItems: "center",
      paddingTop: 60,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSubtle,
    },
  });
