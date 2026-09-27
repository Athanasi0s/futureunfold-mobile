import type { Conversation, DirectMessage } from "@/api/schemas";
import { FeatureGate } from "@/components/feature-gate";
import { blockUser, getInbox, reportUser } from "@/api/features/dm";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import {
  useGetConversationMessages,
  useSendDirectMessage,
} from "@/features/messaging/hooks";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return time;
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${dateStr}, ${time}`;
}

function DmBubble({
  message,
  isOwn,
  styles,
}: {
  message: DirectMessage;
  isOwn: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View
      style={[styles.bubbleWrapper, isOwn ? styles.bubbleRight : styles.bubbleLeft]}
    >
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <ThemedText style={styles.messageText}>{message.text}</ThemedText>
      </View>
      <ThemedText style={[styles.timeText, isOwn && styles.timeTextRight]}>
        {formatTime(message.created_at)}
      </ThemedText>
    </View>
  );
}

export default function DmChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    conversation_id?: string;
    user_id: string;
    name: string;
  }>();
  const otherUserId = Number(params.user_id);

  const [convoId, setConvoId] = useState(
    params.conversation_id ? Number(params.conversation_id) : 0,
  );
  const [text, setText] = useState("");
  const [localMessages, setLocalMessages] = useState<DirectMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data: messagesData, isLoading } =
    useGetConversationMessages(convoId);
  const sendMessage = useSendDirectMessage();

  // Merge server messages with local-only messages (deduped by id)
  const messages = useMemo(() => {
    const serverMsgs = messagesData ?? [];
    const serverIds = new Set(serverMsgs.map((m) => m.id));
    const uniqueLocal = localMessages.filter((m) => !serverIds.has(m.id));
    const all = [...serverMsgs, ...uniqueLocal];
    // Sort newest first for inverted FlatList
    return all.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [messagesData, localMessages]);

  // Once server data refreshes after a send, clear optimistic local messages
  useEffect(() => {
    if (messagesData && messagesData.length > 0 && localMessages.length > 0) {
      setLocalMessages([]);
    }
  }, [messagesData, localMessages.length]);

  // Resolve conversation_id from inbox
  const resolveConversationId = useCallback(async () => {
    if (convoId) return;
    try {
      const inbox = await getInbox();
      const convo = inbox.find(
        (c: Conversation) => c.other_user.id === otherUserId,
      );
      if (convo) {
        setConvoId(convo.id);
      }
    } catch {
      // Inbox fetch failed, will retry on next send
    }
  }, [convoId, otherUserId]);

  // On mount, try to load existing conversation history
  useEffect(() => {
    if (!convoId) {
      resolveConversationId();
    }
  }, [convoId, resolveConversationId]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    setText("");

    // Add optimistic local message
    const optimisticMsg: DirectMessage = {
      id: -Date.now(), // negative temp id
      sender_id: user.id,
      recipient_id: otherUserId,
      text: trimmed,
      created_at: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, optimisticMsg]);

    sendMessage.mutate(
      { to_user_id: otherUserId, text: trimmed },
      {
        onSuccess: () => {
          resolveConversationId();
        },
      },
    );
  }, [text, sendMessage, otherUserId, user, resolveConversationId]);

  const handleOptionsPress = useCallback(() => {
    Alert.alert(params.name, undefined, [
      {
        text: t("chat.blockUserTitle"),
        style: "destructive",
        onPress: () => {
          Alert.alert(
            t("chat.blockUserTitle"),
            t("chat.blockUserConfirm", { name: params.name }),
            [
              { text: t("chat.cancel"), style: "cancel" },
              {
                text: t("chat.block"),
                style: "destructive",
                onPress: () => blockUser(otherUserId),
              },
            ],
          );
        },
      },
      {
        text: t("chat.reportUserTitle"),
        onPress: () => {
          Alert.prompt?.(
            t("chat.reportUserTitle"),
            t("chat.reportUserPrompt"),
            (reason: string) => {
              if (reason?.trim()) {
                reportUser(otherUserId, reason.trim());
              }
            },
          ) ??
            Alert.alert(t("chat.reportFallbackTitle"), t("chat.reportFallbackBody"), [
              { text: t("chat.cancel"), style: "cancel" },
              {
                text: t("chat.report"),
                onPress: () => reportUser(otherUserId, t("chat.inappropriateBehavior")),
              },
            ]);
        },
      },
      { text: t("chat.cancel"), style: "cancel" },
    ]);
  }, [params.name, otherUserId, t]);

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
          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle} numberOfLines={1}>
              {params.name}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={handleOptionsPress}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Messages + Input */}
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          {isLoading && convoId ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              style={styles.flex}
              data={messages}
              inverted
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <DmBubble
                  message={item}
                  isOwn={item.sender_id === user?.id}
                  styles={styles}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={48}
                    color={colors.textSubtle}
                  />
                  <ThemedText style={styles.emptyText}>
                    {t("chat.sendEmptyHint")}
                  </ThemedText>
                </View>
              }
            />
          )}

          {/* Input Bar */}
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={t("chat.messageInputPlaceholder")}
                placeholderTextColor={colors.textSubtle}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={5000}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                !text.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!text.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? (
                <ActivityIndicator color={COLOR_WHITE_ON_ACCENT} size="small" />
              ) : (
                <Ionicons name="send" size={18} color={COLOR_WHITE_ON_ACCENT} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      backgroundColor: colors.gradientStart,
    },
    backButton: {
      width: 36,
      height: 36,
      justifyContent: "center",
      alignItems: "center",
    },
    headerCenter: {
      flex: 1,
      marginLeft: 8,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
    },
    headerAction: {
      width: 36,
      height: 36,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    messageList: {
      paddingHorizontal: 12,
      paddingVertical: 16,
      gap: 8,
    },
    bubbleWrapper: {
      maxWidth: "80%",
    },
    bubbleLeft: {
      alignSelf: "flex-start",
    },
    bubbleRight: {
      alignSelf: "flex-end",
    },
    bubble: {
      padding: 12,
      borderRadius: 14,
    },
    bubbleOther: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 4,
    },
    bubbleOwn: {
      backgroundColor: "rgba(79, 70, 229, 0.3)",
      borderTopRightRadius: 4,
    },
    messageText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    timeText: {
      fontSize: 11,
      color: colors.textSubtle,
      marginTop: 4,
    },
    timeTextRight: {
      textAlign: "right",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 100,
      gap: 12,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSubtle,
      textAlign: "center",
    },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      gap: 8,
    },
    inputContainer: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingHorizontal: 14,
      minHeight: 36,
      maxHeight: 120,
      justifyContent: "center",
    },
    textInput: {
      fontSize: 14,
      color: colors.text,
      maxHeight: 100,
      paddingTop: 0,
      paddingBottom: 0,
      textAlignVertical: "center",
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.lightBlue,
      justifyContent: "center",
      alignItems: "center",
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
  });
