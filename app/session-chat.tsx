import type { SessionChatMessage } from "@/api/schemas";
import { FeatureGate } from "@/components/feature-gate";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { useGetSessionChat, useSendSessionChat } from "@/features/home/hooks";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
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
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

type ChatBubbleProps = {
  message: SessionChatMessage;
  isOwn: boolean;
  styles: ReturnType<typeof createStyles>;
};

function ChatBubble({ message, isOwn, styles }: ChatBubbleProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View style={styles.bubbleRow}>
      {/* Avatar */}
      <View style={styles.avatarCol}>
        {message.sender.avatar_url ? (
          <Image
            source={{ uri: message.sender.avatar_url }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={16} color={colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.bubbleContent}>
        {/* Sender name */}
        <View style={styles.senderRow}>
          <ThemedText style={styles.senderName}>
            {message.sender.full_name ?? t("chat.unknownSender")}
          </ThemedText>
        </View>

        {/* Message bubble */}
        <View
          style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
        >
          <ThemedText style={styles.messageText}>{message.content}</ThemedText>
        </View>

        {/* Time */}
        <ThemedText style={styles.timeText}>{formatTime(message.created_at)}</ThemedText>
      </View>
    </View>
  );
}

export default function SessionChatScreen() {
  return (
    <FeatureGate flag="session_chat">
      <SessionChatContent />
    </FeatureGate>
  );
}

function SessionChatContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    session_id: string;
    title: string;
  }>();
  const sessionId = Number(params.session_id);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    return () => sub.remove();
  }, []);

  const { data: messagesData, isLoading } = useGetSessionChat(sessionId);
  const sendMessage = useSendSessionChat(sessionId);

  // Reverse messages so oldest appear at top (API returns newest first)
  const messages = useMemo(
    () => [...(messagesData?.messages ?? [])].reverse(),
    [messagesData],
  );

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    sendMessage.mutate({ content: trimmed });
  }, [text, sendMessage]);

  return (
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
            {params.title}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {t("chat.messagesCount", { count: messagesData?.total ?? 0 })}
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Messages + Input */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            style={styles.flex}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                isOwn={item.sender.id === user?.id}
                styles={styles}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={48}
                  color={colors.textSubtle}
                />
                <ThemedText style={styles.emptyText}>
                  {t("chat.noMessagesYet")}
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
              placeholder={t("chat.messageSessionPlaceholder")}
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
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
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
      gap: 16,
    },
    bubbleRow: {
      flexDirection: "row",
      gap: 10,
    },
    avatarCol: {
      paddingTop: 2,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    avatarPlaceholder: {
      backgroundColor: colors.cardBackground,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    bubbleContent: {
      flex: 1,
      maxWidth: "80%",
    },
    senderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 4,
    },
    senderName: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
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
      borderTopLeftRadius: 4,
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
