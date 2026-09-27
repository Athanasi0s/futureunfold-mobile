import { useDrawerStore } from "@/components/drawer/drawer-store";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { usePatchMe } from "@/features/authentication/hooks/usePatchMe";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
export default function SpeakerSettingsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const { user } = useAuth();
  console.log("🔍 → SpeakerSettingsScreen → user:", user);
  const { mutate: patchMe, isPending } = usePatchMe();
  const openDrawer = useDrawerStore((s) => s.openDrawer);
  const router = useRouter();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setCompany(user.company ?? "");
      setBio(user.bio ?? "");
      setLinkedinUrl(user.linkedin_url ?? "");
      setAvatarUrl(user.avatar_url ?? "");
    }
  }, [user]);

  const handleSave = () => {
    patchMe(
      { full_name: fullName, company, bio, linkedin_url: linkedinUrl, avatar_url: avatarUrl || undefined },
      {
        onSuccess: () => {
          setSaved(true);
          if (savedTimer.current) clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => setSaved(false), 2500);
        },
        onError: () => Alert.alert(t("speakerSettings.errorSave"), t("speakerSettings.errorSaveMessage")),
      },
    );
  };

  const openAvatarModal = () => {
    setAvatarUrlDraft(avatarUrl);
    setAvatarModalVisible(true);
  };

  const confirmAvatarUrl = () => {
    setAvatarUrl(avatarUrlDraft.trim());
    setAvatarModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={openDrawer} style={styles.headerBtn}>
            <Ionicons name="menu" size={26} color={COLOR_WHITE_ON_ACCENT} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("speakerSettings.headerTitle")}</ThemedText>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerBtn}
            disabled={isPending || saved}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={colors.brand} />
            ) : saved ? (
              <View style={styles.savedWrap}>
                <Ionicons name="checkmark" size={15} color={colors.brand} />
                <ThemedText style={styles.saveText}>{t("speakerSettings.saved")}</ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.saveText}>{t("speakerSettings.save")}</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={52} color={colors.border} />
              </View>
            )}
            <TouchableOpacity style={styles.avatarEditBtn} onPress={openAvatarModal}>
              <Ionicons name="pencil" size={13} color={COLOR_WHITE_ON_ACCENT} />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.avatarHint}>
            {t("speakerSettings.avatarHint")}
          </ThemedText>
        </View>

        {/* Avatar URL Modal */}
        <Modal
          visible={avatarModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAvatarModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior="padding"
          >
            <View style={styles.modalCard}>
              <ThemedText style={styles.modalTitle}>{t("speakerSettings.avatarModalTitle")}</ThemedText>
              <TextInput
                style={styles.modalInput}
                value={avatarUrlDraft}
                onChangeText={setAvatarUrlDraft}
                placeholder={t("speakerSettings.avatarModalPlaceholder")}
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
                keyboardType="url"
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setAvatarModalVisible(false)}
                >
                  <ThemedText style={styles.modalCancelText}>{t("speakerSettings.cancel")}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmAvatarUrl}>
                  <ThemedText style={styles.modalConfirmText}>{t("speakerSettings.confirm")}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Full Name */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.label}>{t("speakerSettings.labelFullName")}</ThemedText>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder={t("speakerSettings.placeholderFullName")}
            placeholderTextColor={colors.placeholder}
          />
        </View>

        {/* Company */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.label}>{t("speakerSettings.labelCompany")}</ThemedText>
          <TextInput
            style={styles.input}
            value={company}
            onChangeText={setCompany}
            placeholder={t("speakerSettings.placeholderCompany")}
            placeholderTextColor={colors.placeholder}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/create-session")}
          >
            <MaterialCommunityIcons
              name="calendar-plus"
              size={18}
              color={colors.brand}
            />
            <ThemedText style={styles.actionBtnText}>{t("speakerSettings.createSession")}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/my-polls")}
          >
            <MaterialCommunityIcons name="poll" size={18} color={colors.brand} />
            <ThemedText style={styles.actionBtnText}>{t("speakerSettings.createPoll")}</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Bio */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.label}>{t("speakerSettings.labelBio")}</ThemedText>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder={t("speakerSettings.placeholderBio")}
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Social Presence */}
        <View style={styles.socialSection}>
          <ThemedText style={styles.label}>{t("speakerSettings.labelSocialPresence")}</ThemedText>

          <View style={styles.socialRow}>
            <View style={styles.socialIconWrap}>
              <Ionicons name="logo-linkedin" size={18} color={colors.link} />
            </View>
            <TextInput
              style={styles.socialInput}
              value={linkedinUrl}
              onChangeText={setLinkedinUrl}
              placeholder={t("speakerSettings.placeholderLinkedin")}
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>

        {/* Preview */}
        <TouchableOpacity
          style={styles.previewBtn}
          onPress={() => router.push(`/user/${user?.id}`)}
        >
          <ThemedText style={styles.previewBtnText}>{t("speakerSettings.previewPublicProfile")}</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const BORDER = "rgba(100, 116, 139, 0.25)";

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },
  headerSafe: {
    backgroundColor: colors.surfacePrimary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerBtn: {
    width: 52,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  saveText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.brand,
  },
  saveTextDim: {
    opacity: 0.5,
  },
  savedWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
    gap: 20,
  },

  // Avatar
  avatarSection: {
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: {
    position: "relative",
    width: 96,
    height: 96,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surfacePrimary,
  },
  avatarHint: {
    fontSize: 12,
    color: colors.textTertiary,
  },

  // Fields
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: COLOR_WHITE_ON_ACCENT,
  },
  bioInput: {
    height: 110,
    paddingTop: 13,
  },
  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: "rgba(25, 79, 240, 0.3)",
    borderRadius: 10,
    paddingVertical: 13,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brand,
  },

  // Social
  socialSection: {
    gap: 8,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 2,
    gap: 10,
  },
  socialIconWrap: {
    width: 24,
    alignItems: "center",
  },
  socialInput: {
    flex: 1,
    fontSize: 14,
    color: COLOR_WHITE_ON_ACCENT,
    paddingVertical: 13,
  },

  // Avatar modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  modalInput: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLOR_WHITE_ON_ACCENT,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    fontSize: 15,
    color: colors.textTertiary,
  },
  modalConfirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.brand,
  },

  // Preview
  previewBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  previewBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
