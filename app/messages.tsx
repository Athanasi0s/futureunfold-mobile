import type { Conversation, UserListItem, UsersListResponse } from "@/api/schemas";
import { api } from "@/api/client";
import { FeatureGate } from "@/components/feature-gate";
import { ROLE_COLORS } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { useGetInbox } from "@/features/messaging/hooks";
import { useColors } from "@/hooks/use-colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
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

type RoleFilter = "all" | "speaker" | "exhibitor" | "attendee";

function getRoleBadgeConfig(role: string) {
  switch (role) {
    case "speaker":
      return { label: "SPEAKER", color: ROLE_COLORS.speaker };
    case "exhibitor":
      return { label: "EXHIBITOR", color: ROLE_COLORS.exhibitor };
    default:
      return null;
  }
}

function formatMessageTime(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ConversationRow({
  conversation,
  onPress,
  styles,
}: {
  conversation: Conversation;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const { t } = useTranslation();
  const { other_user } = conversation;
  const badge = getRoleBadgeConfig(other_user.role);
  const initial = (other_user.full_name ?? "?")[0].toUpperCase();

  return (
    <TouchableOpacity
      style={styles.conversationRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {other_user.avatar_url ? (
        <Image
          source={{ uri: other_user.avatar_url }}
          style={styles.avatar}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <ThemedText style={styles.avatarInitial}>{initial}</ThemedText>
        </View>
      )}

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.userName} numberOfLines={1}>
              {other_user.full_name}
            </ThemedText>
            {badge && (
              <View
                style={[styles.roleBadge, { backgroundColor: badge.color }]}
              >
                <ThemedText style={styles.roleBadgeText}>{badge.label}</ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={styles.timeText}>
            {formatMessageTime(conversation.last_message_at)}
          </ThemedText>
        </View>
        <ThemedText style={styles.lastMessage} numberOfLines={1}>
          {conversation.last_message ?? t("messages.noMessagesYet")}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

function UserSearchRow({
  user,
  onPress,
  styles,
}: {
  user: UserListItem;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const initial = (user.full_name ?? "?")[0].toUpperCase();
  const badge = getRoleBadgeConfig(user.role);

  return (
    <TouchableOpacity
      style={styles.conversationRow}
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
      <View style={styles.conversationContent}>
        <View style={styles.nameRow}>
          <ThemedText style={styles.userName} numberOfLines={1}>
            {user.full_name}
          </ThemedText>
          {badge && (
            <View
              style={[styles.roleBadge, { backgroundColor: badge.color }]}
            >
              <ThemedText style={styles.roleBadgeText}>{badge.label}</ThemedText>
            </View>
          )}
        </View>
        {user.company && (
          <ThemedText style={styles.lastMessage} numberOfLines={1}>
            {user.company}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<RoleFilter>("all");
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const ROLE_CHIPS: { label: string; value: RoleFilter }[] = [
    { label: t("messages.filterAll"), value: "all" },
    { label: t("messages.filterSpeakers"), value: "speaker" },
    { label: t("messages.filterExhibitors"), value: "exhibitor" },
    { label: t("messages.filterAttendees"), value: "attendee" },
  ];

  const { data: conversations, isLoading } = useGetInbox();

  const searchTrimmed = search.trim();
  const isSearching = searchTrimmed.length > 0;

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", "dm-search", searchTrimmed],
    queryFn: () =>
      api.auth<UsersListResponse>({
        url: `/users?page_size=100&search=${encodeURIComponent(searchTrimmed)}`,
        method: "GET",
      }),
    enabled: isSearching,
  });

  const searchResults = usersData?.users ?? [];

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    let filtered = conversations;
    if (activeFilter !== "all") {
      filtered = filtered.filter((c) => c.other_user.role === activeFilter);
    }
    return [...filtered].sort((a, b) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [conversations, activeFilter]);

  const handleConversationPress = useCallback(
    (conversation: Conversation) => {
      router.push({
        pathname: "/dm-chat",
        params: {
          conversation_id: conversation.id.toString(),
          user_id: conversation.other_user.id.toString(),
          name: conversation.other_user.full_name,
        },
      });
    },
    [router],
  );

  const handleUserPress = useCallback(
    (user: UserListItem) => {
      setSearch("");
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
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("messages.title")}</ThemedText>
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
            />
            {isSearching && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={20} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isSearching ? (
          /* User search results */
          isLoadingUsers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <UserSearchRow
                  user={item}
                  onPress={() => handleUserPress(item)}
                  styles={styles}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>{t("messages.noUsersFound")}</ThemedText>
                </View>
              }
            />
          )
        ) : (
          <>
            {/* Filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={styles.chipsContainer}
            >
              {ROLE_CHIPS.map((chip) => {
                const isActive = activeFilter === chip.value;
                return (
                  <TouchableOpacity
                    key={chip.value}
                    style={[
                      styles.chip,
                      isActive
                        ? { backgroundColor: colors.lightBlue }
                        : { borderColor: colors.border, borderWidth: 1 },
                    ]}
                    onPress={() => setActiveFilter(chip.value)}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        {
                          color: isActive
                            ? colors.white
                            : colors.textSecondary,
                        },
                        isActive && styles.chipTextActive,
                      ]}
                    >
                      {chip.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Conversation list */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            ) : (
              <FlatList
                data={filteredConversations}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <ConversationRow
                    conversation={item}
                    onPress={() => handleConversationPress(item)}
                    styles={styles}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={48}
                      color={colors.textSubtle}
                    />
                    <ThemedText style={styles.emptyText}>{t("messages.noConversationsYet")}</ThemedText>
                    <ThemedText style={styles.emptySubtext}>
                      {t("messages.startConversationHint")}
                    </ThemedText>
                  </View>
                }
              />
            )}
          </>
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
      paddingBottom: 8,
    },
    backButton: {
      width: 36,
      height: 36,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
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
    chipsContainer: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      height: 32,
      paddingHorizontal: 14,
      borderRadius: 16,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "500",
    },
    chipTextActive: {
      fontWeight: "600",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },
    conversationRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    avatarPlaceholder: {
      backgroundColor: colors.cardBackground,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    avatarInitial: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    conversationContent: {
      flex: 1,
    },
    conversationHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
      marginRight: 8,
    },
    userName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      flexShrink: 1,
    },
    roleBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    roleBadgeText: {
      fontSize: 9,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
      letterSpacing: 0.5,
    },
    timeText: {
      fontSize: 12,
      color: colors.textSubtle,
    },
    lastMessage: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    emptyContainer: {
      alignItems: "center",
      paddingTop: 80,
      gap: 12,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    emptySubtext: {
      fontSize: 13,
      color: colors.textSubtle,
      textAlign: "center",
    },
  });
