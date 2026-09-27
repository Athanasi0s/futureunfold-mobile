import { FeatureGate } from "@/components/feature-gate";
import type { GroupMessage } from "@/api/schemas";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import {
  useGetGroupMessages,
  useSendGroupMessage,
  useDeleteGroupMessage,
  useCreateGroupPoll,
} from "@/features/home/hooks";
import { AttachActionSheet } from "@/features/home/components/AttachActionSheet";
import { CreatePollModal } from "@/features/home/components/CreatePollModal";
import { ImageBubble } from "@/features/home/components/ImageBubble";
import { FileBubble } from "@/features/home/components/FileBubble";
import { PollBubble } from "@/features/home/components/PollBubble";
import { uploadFile } from "@/api/features/upload";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import EmojiPicker, { type EmojiType } from "rn-emoji-keyboard";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
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

function SystemMessage({ message }: { message: GroupMessage }) {
  const colors = useColors();
  const isLocation =
    message.extra_data &&
    (message.extra_data as Record<string, unknown>).type === "location_sharing";
  // `systemMessageStyles.text` is module-scope and has no color — we tint
  // it here so the system-message grey resolves from the active theme.
  const systemTextColor = { color: colors.textSecondary };

  return (
    <View style={systemMessageStyles.row}>
      {isLocation && (
        <Ionicons
          name="location"
          size={12}
          color={colors.textSubtle}
          style={{ marginRight: 4 }}
        />
      )}
      <ThemedText style={[systemMessageStyles.text, systemTextColor]}>{message.content}</ThemedText>
    </View>
  );
}

const systemMessageStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
});

type PendingUpload = {
  id: string;
  localUri: string;
  filename: string;
  mimeType: string;
  status: "uploading" | "error";
  messageType: "image" | "pdf" | "file";
  extraData: Record<string, unknown>;
};

type ChatBubbleProps = {
  message: GroupMessage;
  isOwn: boolean;
  groupId: number;
  onDelete?: (messageId: number) => void;
  styles: ReturnType<typeof createStyles>;
};

function ChatBubble({
  message,
  isOwn,
  groupId,
  onDelete,
  styles,
}: ChatBubbleProps) {
  const colors = useColors();
  const { t } = useTranslation();

  const handleLongPress = () => {
    if (!onDelete) return;
    Alert.alert(t("chat.deleteMessageTitle"), t("chat.deleteMessageConfirm"), [
      { text: t("chat.cancel"), style: "cancel" },
      {
        text: t("chat.delete"),
        style: "destructive",
        onPress: () => onDelete(message.id),
      },
    ]);
  };

  const renderContent = () => {
    switch (message.message_type) {
      case "image":
        return <ImageBubble uri={message.content} extraData={message.extra_data} />;
      case "pdf":
      case "file":
        return <FileBubble uri={message.content} extraData={message.extra_data} />;
      case "poll": {
        const pollId = (message.extra_data as Record<string, unknown>)?.poll_id as number | undefined;
        if (!pollId) return <ThemedText style={styles.messageText}>{message.content}</ThemedText>;
        return (
          <PollBubble
            pollId={pollId}
            question={message.content}
            groupId={groupId}
          />
        );
      }
      default:
        return <ThemedText style={styles.messageText}>{message.content}</ThemedText>;
    }
  };

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
            <Ionicons
              name="person"
              size={16}
              color={colors.textSecondary}
            />
          </View>
        )}
      </View>

      {/* Content */}
      <TouchableOpacity
        style={styles.bubbleContent}
        activeOpacity={0.8}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        {/* Sender name + badge */}
        <View style={styles.senderRow}>
          <ThemedText style={styles.senderName}>
            {message.sender.full_name ?? "Unknown"}
          </ThemedText>
        </View>

        {/* Message bubble */}
        <View
          style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
        >
          {renderContent()}
        </View>

        {/* Time */}
        <ThemedText style={styles.timeText}>{formatTime(message.created_at)}</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

// Pending upload bubble rendered for optimistic UI during / after upload failure
type PendingBubbleProps = {
  upload: PendingUpload;
  onRetry: (upload: PendingUpload) => void;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useColors>;
};

function PendingBubble({ upload, onRetry, styles, colors }: PendingBubbleProps) {
  const { t } = useTranslation();
  const isImage = upload.messageType === "image";

  return (
    <View style={styles.bubbleRow}>
      {/* Spacer for avatar column */}
      <View style={[styles.avatarCol, { width: 36 }]} />

      <View style={styles.bubbleContent}>
        <View style={[styles.bubble, styles.bubbleOwn]}>
          {isImage ? (
            <View style={pendingStyles.imagePreviewContainer}>
              <Image
                source={{ uri: upload.localUri }}
                style={pendingStyles.imagePreview}
                contentFit="cover"
              />
              {upload.status === "uploading" && (
                <View style={pendingStyles.overlay}>
                  <ActivityIndicator color={COLOR_WHITE_ON_ACCENT} size="small" />
                  <ThemedText style={pendingStyles.uploadingLabel}>
                    {t("chat.uploading", "Uploading...")}
                  </ThemedText>
                </View>
              )}
              {upload.status === "error" && (
                <View style={[pendingStyles.overlay, pendingStyles.errorOverlay]}>
                  <TouchableOpacity
                    onPress={() => onRetry(upload)}
                    style={pendingStyles.retryButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="refresh" size={20} color={COLOR_WHITE_ON_ACCENT} />
                    <ThemedText style={pendingStyles.retryLabel}>
                      {t("chat.retry", "Retry")}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={pendingStyles.fileRow}>
              <Ionicons
                name={upload.messageType === "pdf" ? "document-text-outline" : "document-outline"}
                size={24}
                color={colors.primary}
              />
              <ThemedText
                style={[pendingStyles.fileLabel, { color: colors.text }]}
                numberOfLines={1}
              >
                {upload.filename}
              </ThemedText>
              {upload.status === "uploading" && (
                <ActivityIndicator color={colors.primary} size="small" />
              )}
              {upload.status === "error" && (
                <TouchableOpacity onPress={() => onRetry(upload)} hitSlop={8}>
                  <Ionicons name="refresh" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        {upload.status === "error" && (
          <ThemedText style={[pendingStyles.errorText, { color: colors.error }]}>
            {t("chat.uploadFailed", "Upload failed. Tap to retry.")}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const pendingStyles = StyleSheet.create({
  imagePreviewContainer: {
    borderRadius: 10,
    overflow: "hidden",
    width: "100%",
    height: 160,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  errorOverlay: {
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  uploadingLabel: {
    fontSize: 12,
    color: COLOR_WHITE_ON_ACCENT,
    fontWeight: "500",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryLabel: {
    fontSize: 13,
    color: COLOR_WHITE_ON_ACCENT,
    fontWeight: "600",
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fileLabel: {
    flex: 1,
    fontSize: 13,
  },
  errorText: {
    fontSize: 11,
    marginTop: 3,
    textAlign: "right",
  },
});

export default function GroupChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const colors = useColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);
  const params = useLocalSearchParams<{
    group_id: string;
    title: string;
  }>();
  const groupId = Number(params.group_id);

  const [text, setText] = useState("");
  const [attachVisible, setAttachVisible] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pollModalVisible, setPollModalVisible] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    return () => sub.remove();
  }, []);

  const {
    data: messagesData,
    isLoading,
  } = useGetGroupMessages(groupId);
  const sendMessage = useSendGroupMessage(groupId);
  const deleteMessage = useDeleteGroupMessage(groupId);
  const createGroupPoll = useCreateGroupPoll(groupId);

  // Reverse messages so oldest appear at top (API returns newest first)
  const messages = useMemo(
    () => [...(messagesData?.messages ?? [])].reverse(),
    [messagesData]
  );

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    sendMessage.mutate({ content: trimmed });
  }, [text, sendMessage]);

  const handleDelete = useCallback(
    (messageId: number) => {
      deleteMessage.mutate(messageId);
    },
    [deleteMessage]
  );

  const canDelete = useCallback(
    (msg: GroupMessage) => {
      if (!user) return false;
      return msg.sender.id === user.id;
    },
    [user]
  );

  const handleEmojiSelected = useCallback((emojiObject: EmojiType) => {
    setText((prev) => prev + emojiObject.emoji);
  }, []);

  // Upload with optimistic bubble (per D-B3)
  const handleUploadAndSend = useCallback(async (
    uri: string,
    filename: string,
    mimeType: string,
    messageType: "image" | "pdf" | "file",
    extraData: Record<string, unknown>,
  ) => {
    const uploadId = String(Date.now());
    setPendingUploads((prev) => [
      ...prev,
      { id: uploadId, localUri: uri, filename, mimeType, status: "uploading", messageType, extraData },
    ]);

    try {
      const result = await uploadFile(uri, filename, mimeType);
      setPendingUploads((prev) => prev.filter((p) => p.id !== uploadId));
      sendMessage.mutate({
        content: result.url,
        message_type: messageType,
        extra_data: extraData,
      });
    } catch {
      setPendingUploads((prev) =>
        prev.map((p) => p.id === uploadId ? { ...p, status: "error" } : p)
      );
    }
  }, [sendMessage]);

  const handleRetryUpload = useCallback((upload: PendingUpload) => {
    // Remove old entry and start fresh
    setPendingUploads((prev) => prev.filter((p) => p.id !== upload.id));
    handleUploadAndSend(upload.localUri, upload.filename, upload.mimeType, upload.messageType, upload.extraData);
  }, [handleUploadAndSend]);

  const handlePickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("chat.permissionDenied", "Permission denied"), t("chat.photoPermissionMessage", "Photo library access is required."));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as unknown as ImagePicker.MediaType,
      allowsEditing: false,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await handleUploadAndSend(
      asset.uri,
      asset.fileName ?? "photo.jpg",
      asset.mimeType ?? "image/jpeg",
      "image",
      {
        original_name: asset.fileName,
        width: asset.width,
        height: asset.height,
        size_bytes: asset.fileSize,
        mime_type: asset.mimeType,
      },
    );
  }, [handleUploadAndSend, t]);

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("chat.permissionDenied", "Permission denied"), t("chat.cameraPermissionMessage", "Camera access is required."));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await handleUploadAndSend(
      asset.uri,
      asset.fileName ?? "photo.jpg",
      asset.mimeType ?? "image/jpeg",
      "image",
      {
        original_name: asset.fileName,
        width: asset.width,
        height: asset.height,
        size_bytes: asset.fileSize,
        mime_type: asset.mimeType,
      },
    );
  }, [handleUploadAndSend, t]);

  const handlePickFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "application/octet-stream";
    const messageType = mimeType === "application/pdf" ? "pdf" : "file";
    await handleUploadAndSend(
      asset.uri,
      asset.name,
      mimeType,
      messageType,
      {
        original_name: asset.name,
        size_bytes: asset.size,
        mime_type: mimeType,
      },
    );
  }, [handleUploadAndSend]);

  const handleCreatePoll = useCallback((question: string, options: string[]) => {
    setPollModalVisible(false);
    createGroupPoll.mutate({ question, options, group_id: groupId });
  }, [createGroupPoll, groupId]);

  return (
    <FeatureGate flag="group_chat">
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
              {messagesData?.total ?? 0} messages
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
              renderItem={({ item }) =>
                item.message_type === "system" ? (
                  <SystemMessage message={item} />
                ) : (
                  <ChatBubble
                    message={item}
                    isOwn={item.sender.id === user?.id}
                    groupId={groupId}
                    onDelete={canDelete(item) ? handleDelete : undefined}
                    styles={styles}
                  />
                )
              }
              ListFooterComponent={
                pendingUploads.length > 0 ? (
                  <View style={{ gap: 16 }}>
                    {pendingUploads.map((upload) => (
                      <PendingBubble
                        key={upload.id}
                        upload={upload}
                        onRetry={handleRetryUpload}
                        styles={styles}
                        colors={colors}
                      />
                    ))}
                  </View>
                ) : null
              }
              ListEmptyComponent={
                pendingUploads.length === 0 ? (
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
                ) : null
              }
            />
          )}

          {/* Input Bar */}
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setAttachVisible(true)}
            >
              <Ionicons
                name="add-circle-outline"
                size={26}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Emoji toggle button */}
            <TouchableOpacity
              style={styles.emojiButton}
              onPress={() => setEmojiOpen(true)}
            >
              <Ionicons
                name="happy-outline"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={t("chat.messageGroupPlaceholder")}
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

        {/* Modals — OUTSIDE KeyboardAvoidingView, at root level */}
        <AttachActionSheet
          visible={attachVisible}
          onClose={() => setAttachVisible(false)}
          onPickPhoto={() => { setAttachVisible(false); handlePickPhoto(); }}
          onTakePhoto={() => { setAttachVisible(false); handleTakePhoto(); }}
          onPickFile={() => { setAttachVisible(false); handlePickFile(); }}
          onCreatePoll={() => { setAttachVisible(false); setPollModalVisible(true); }}
        />
        <CreatePollModal
          visible={pollModalVisible}
          onClose={() => setPollModalVisible(false)}
          onSubmit={handleCreatePoll}
        />
        {/* EmojiPicker must be at root level — NOT inside KeyboardAvoidingView */}
        <EmojiPicker
          open={emojiOpen}
          onClose={() => setEmojiOpen(false)}
          onEmojiSelected={handleEmojiSelected}
        />
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
      gap: 6,
    },
    attachButton: {
      width: 36,
      height: 36,
      justifyContent: "center",
      alignItems: "center",
    },
    emojiButton: {
      width: 34,
      height: 36,
      justifyContent: "center",
      alignItems: "center",
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
