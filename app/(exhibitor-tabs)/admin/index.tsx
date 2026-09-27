import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useTranslation } from "react-i18next";
import { UIButton } from "@/components/ui/ui-button";
import { UITextInput } from "@/components/ui/ui-textinput";
import { UIVerticalSpacer } from "@/components/ui/UIVerticalSpacer";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { usePatchMe } from "@/features/authentication/hooks/usePatchMe";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { useAddStaff } from "@/features/exhibitors/hooks/useAddStaff";
import { useDeleteStaff } from "@/features/exhibitors/hooks/useDeleteStaff";
import { useGetExhibitorSessions } from "@/features/exhibitors/hooks/useGetExhibitorSessions";
import { useGetStaff } from "@/features/exhibitors/hooks/useGetStaff";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { useColors } from "@/hooks/use-colors";

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
function getSessionStatus(startTime: string, endTime: string): "live" | "upcoming" | "past" {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (now >= start && now <= end) return "live";
  if (now < start) return "upcoming";
  return "past";
}

function formatStartsIn(startTime: string): string {
  const diff = new Date(startTime).getTime() - Date.now();
  const totalMins = Math.floor(diff / 60000);
  if (totalMins < 60) return `${totalMins}M`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hours}H ${mins}M` : `${hours}H`;
}

// ─── Form Schema ──────────────────────────────────────────────────────────────

const addStaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  avatar: z.string().optional(),
});

type AddStaffFormData = z.infer<typeof addStaffSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const user = useAuthStore((s) => s.user);
  const { logout, isLoggingOut } = useAuth();
  const { data: staff = [], isLoading: staffLoading } = useGetStaff();
  const { data: sessions = [], isLoading: sessionsLoading } = useGetExhibitorSessions(user?.id);
  const addStaff = useAddStaff();
  const deleteStaff = useDeleteStaff();
  const patchMe = usePatchMe();
  const [addStaffVisible, setAddStaffVisible] = useState(false);
  const [profilePhotoVisible, setProfilePhotoVisible] = useState(false);
  const [coverPhotoVisible, setCoverPhotoVisible] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddStaffFormData>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: { name: "", role: "", avatar: "" },
  });

  const boothName = user?.company || user?.full_name || "Your Company";
  const boothNumber = "BOOTH #A-12"; // mock — replace when API is ready

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAddStaff = (data: AddStaffFormData) => {
    addStaff.mutate(
      {
        full_name: data.name,
        role: data.role || undefined,
        avatar_url: data.avatar || undefined,
      },
      {
        onSuccess: () => {
          reset();
          setAddStaffVisible(false);
        },
        onError: (error: unknown) => {
          console.error("Failed to add staff member:", error);
          const message =
            error instanceof Error
              ? error.message
              : "Failed to add staff member";
          Alert.alert(t("exhibitor.admin.alertError"), message);
        },
      },
    );
  };

  const handleDeleteStaff = (id: number) => {
    Alert.alert(t("exhibitor.admin.alertRemoveStaff"), t("exhibitor.admin.alertRemoveStaffMsg"), [
      { text: t("exhibitor.admin.alertCancel"), style: "cancel" },
      {
        text: t("exhibitor.admin.alertRemove"),
        style: "destructive",
        onPress: () => deleteStaff.mutate(id),
      },
    ]);
  };

  const handleUpdateProfilePhoto = () => {
    patchMe.mutate(
      { avatar_url: profilePhotoUrl || undefined },
      {
        onSuccess: () => {
          setProfilePhotoUrl("");
          setProfilePhotoVisible(false);
        },
        onError: () => Alert.alert(t("exhibitor.admin.alertError"), "Failed to update profile photo"),
      },
    );
  };

  const handleUpdateCoverPhoto = () => {
    patchMe.mutate(
      { cover_url: coverPhotoUrl || null },
      {
        onSuccess: () => {
          setCoverPhotoUrl("");
          setCoverPhotoVisible(false);
        },
        onError: () => Alert.alert(t("exhibitor.admin.alertError"), "Failed to update cover photo"),
      },
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>{t("exhibitor.admin.title")}</ThemedText>
          <TouchableOpacity
            onPress={logout}
            disabled={isLoggingOut}
            style={styles.logoutBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <ThemedText style={styles.logoutText}>
              {isLoggingOut ? t("exhibitor.admin.loggingOut") : t("exhibitor.admin.logOut")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatarWrap}>
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={styles.profileAvatarImg}
                />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  <ThemedText style={styles.profileAvatarInitial}>
                    {boothName.charAt(0)}
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={styles.profileName}>{boothName}</ThemedText>
              <View style={styles.boothBadge}>
                <ThemedText style={styles.boothBadgeText}>{boothNumber}</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* ── Booth Staff ── */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{t("exhibitor.admin.boothStaff")}</ThemedText>
          <TouchableOpacity
            onPress={() => setAddStaffVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ThemedText style={styles.actionText}>{t("exhibitor.admin.addStaff")}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {!staffLoading && staff.length === 0 && (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>{t("exhibitor.admin.noStaff")}</ThemedText>
            </View>
          )}
          {staff.map((member, index) => (
            <View
              key={member.id}
              style={[
                styles.staffRow,
                index < staff.length - 1 && styles.staffRowBorder,
              ]}
            >
              {member.avatar_url ? (
                <Image
                  source={{ uri: member.avatar_url }}
                  style={styles.staffAvatar}
                />
              ) : (
                <View style={styles.staffAvatarPlaceholder}>
                  <ThemedText style={styles.staffAvatarInitial}>
                    {(member.full_name || "?").charAt(0)}
                  </ThemedText>
                </View>
              )}
              <View style={styles.staffInfo}>
                <ThemedText style={styles.staffName}>{member.full_name}</ThemedText>
                <ThemedText style={styles.staffRole}>{member.role ?? ""}</ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteStaff(member.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ── Media Assets ── */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{t("exhibitor.admin.mediaAssets")}</ThemedText>
        </View>

        <View style={styles.card}>
          {/* Profile Photo */}
          <View style={styles.mediaRow}>
            <View style={styles.mediaThumbWrap}>
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={styles.mediaThumb}
                />
              ) : (
                <View
                  style={[
                    styles.mediaThumb,
                    styles.mediaThumbPlaceholder,
                    { backgroundColor: "rgba(25, 79, 240, 0.1)" },
                  ]}
                >
                  <Ionicons name="person-circle-outline" size={24} color={colors.brand} />
                </View>
              )}
            </View>
            <View style={styles.mediaInfo}>
              <ThemedText style={styles.mediaTitle}>{t("exhibitor.admin.profilePhoto")}</ThemedText>
              <ThemedText style={styles.mediaSubtitle}>{t("exhibitor.admin.logoAvatar")}</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.mediaActionBtn}
              onPress={() => setProfilePhotoVisible(true)}
            >
              <ThemedText style={styles.mediaActionText}>{t("common.update")}</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Cover Photo */}
          <View style={styles.mediaRow}>
            <View style={styles.mediaThumbWrap}>
              {user?.cover_url ? (
                <Image
                  source={{ uri: user.cover_url }}
                  style={styles.mediaCoverThumb}
                />
              ) : (
                <View
                  style={[
                    styles.mediaCoverThumb,
                    styles.mediaThumbPlaceholder,
                    { backgroundColor: "rgba(99, 102, 241, 0.1)" },
                  ]}
                >
                  <Ionicons name="image-outline" size={24} color={colors.primary} />
                </View>
              )}
            </View>
            <View style={styles.mediaInfo}>
              <ThemedText style={styles.mediaTitle}>{t("exhibitor.admin.coverPhoto")}</ThemedText>
              <ThemedText style={styles.mediaSubtitle}>{t("exhibitor.admin.heroBg")}</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.mediaActionBtn}
              onPress={() => setCoverPhotoVisible(true)}
            >
              <ThemedText style={styles.mediaActionText}>{t("common.update")}</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Product Showcase */}
          <View style={styles.mediaRow}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialIcons name="view-quilt" size={24} color={colors.success} />
            </View>
            <View style={styles.mediaInfo}>
              <ThemedText style={styles.mediaTitle}>{t("exhibitor.admin.productShowcase")}</ThemedText>
              <ThemedText style={styles.mediaSubtitle}>{t("exhibitor.admin.upTo5")}</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.mediaActionBtn}
              onPress={() => router.push("/(exhibitor-tabs)/admin/showcase")}
            >
              <ThemedText style={styles.mediaActionText}>{t("common.manage")}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Booth Sessions ── */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{t("exhibitor.admin.boothSessions")}</ThemedText>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => router.push("/(exhibitor-tabs)/admin/sessions")}
          >
            <ThemedText style={styles.actionText}>{t("exhibitor.admin.viewAll")}</ThemedText>
          </TouchableOpacity>
        </View>

        {!sessionsLoading && sessions.length === 0 && (
          <View style={[styles.card, styles.emptyState]}>
            <ThemedText style={styles.emptyText}>{t("exhibitor.admin.noSessions")}</ThemedText>
          </View>
        )}

        {sessions
          .slice(0, 4)
          .map((session) => {
          const status = getSessionStatus(session.start_time, session.end_time);
          return (
            <TouchableOpacity
              key={session.id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(exhibitor-tabs)/admin/edit-session",
                  params: { sessionId: String(session.id) },
                })
              }
            >
            <View style={[styles.card, styles.sessionCard]}>
              {status === "live" ? (
                <View style={styles.liveBadgeRow}>
                  <View style={styles.liveDot} />
                  <ThemedText style={styles.liveText}>{t("exhibitor.admin.liveNow")}</ThemedText>
                </View>
              ) : (
                <View style={styles.upcomingRow}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                  <ThemedText style={styles.upcomingText}>
                    {t("exhibitor.admin.startsIn")} {formatStartsIn(session.start_time)}
                  </ThemedText>
                </View>
              )}

              <ThemedText style={styles.sessionTitle}>{session.title}</ThemedText>

              {session.speakers.length > 0 && (
                <View style={styles.speakersRow}>
                  <View style={styles.speakerStack}>
                    {session.speakers.slice(0, 3).map((sp, idx) => (
                      <View
                        key={sp.user_id}
                        style={[
                          styles.speakerAvatarWrap,
                          idx > 0 && { marginLeft: -8 },
                        ]}
                      >
                        {sp.avatar_url ? (
                          <Image
                            source={{ uri: sp.avatar_url }}
                            style={styles.speakerAvatar}
                          />
                        ) : (
                          <View
                            style={[
                              styles.speakerAvatar,
                              styles.speakerAvatarPlaceholder,
                            ]}
                          >
                            <ThemedText style={styles.speakerInitial}>
                              {(sp.full_name || "?").charAt(0)}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                  <ThemedText style={styles.speakerNames}>
                    {session.speakers.map((sp) => sp.full_name).join(" & ")}
                  </ThemedText>
                </View>
              )}

              <View style={styles.sessionActions}>
                <TouchableOpacity
                  style={styles.sessionActionBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/(exhibitor-tabs)/admin/polls",
                      params: {
                        sessionId: String(session.id),
                        sessionTitle: session.title,
                      },
                    })
                  }
                >
                  <Ionicons name="bar-chart-outline" size={20} color={colors.textSecondary} />
                  <ThemedText style={styles.sessionActionText}>{t("exhibitor.admin.pollsLabel")}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sessionActionBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/session-qa",
                      params: {
                        sessionId: String(session.id),
                        sessionTitle: session.title,
                      },
                    })
                  }
                >
                  <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
                  <ThemedText style={styles.sessionActionText}>{t("exhibitor.admin.qaLabel")}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sessionActionBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/(exhibitor-tabs)/admin/speakers",
                      params: { sessionId: String(session.id) },
                    })
                  }
                >
                  <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
                  <ThemedText style={styles.sessionActionText}>{t("exhibitor.admin.speakersLabel")}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Add Staff Bottom Sheet ── */}
      <BottomSheet
        visible={addStaffVisible}
        onClose={() => {
          reset();
          setAddStaffVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ThemedText style={styles.sheetTitle}>{t("exhibitor.admin.addStaffSheet")}</ThemedText>
          <UIVerticalSpacer height={20} />

          <UITextInput
            control={control}
            name="name"
            label={t("exhibitor.admin.fullName")}
            placeholder={t("exhibitor.admin.enterFullName")}
            labelColor="label"
            backroundColor="inputBackground"
            placeholderTextColor="placeholder"
            borderColor="primary"
            hasError={!!errors.name}
            errorMessage={errors.name?.message}
          />
          <UIVerticalSpacer height={16} />

          <UITextInput
            control={control}
            name="role"
            label={t("exhibitor.admin.roleLabel")}
            placeholder={t("exhibitor.admin.rolePlaceholder")}
            labelColor="label"
            backroundColor="inputBackground"
            placeholderTextColor="placeholder"
            borderColor="primary"
            hasError={!!errors.role}
            errorMessage={errors.role?.message}
          />
          <UIVerticalSpacer height={16} />

          <UITextInput
            control={control}
            name="avatar"
            label={t("exhibitor.admin.avatarUrl")}
            placeholder={t("common.urlPlaceholder")}
            labelColor="label"
            backroundColor="inputBackground"
            placeholderTextColor="placeholder"
            borderColor="primary"
            hasError={!!errors.avatar}
            errorMessage={errors.avatar?.message}
            autoCapitalize="none"
            keyboardType="url"
          />
          <UIVerticalSpacer height={28} />

          <UIButton
            title={addStaff.isPending ? t("exhibitor.admin.adding") : t("exhibitor.admin.addStaffSheet")}
            onPress={handleSubmit(handleAddStaff)}
          />
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* ── Profile Photo Bottom Sheet ── */}
      <BottomSheet
        visible={profilePhotoVisible}
        onClose={() => {
          setProfilePhotoUrl("");
          setProfilePhotoVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ThemedText style={styles.sheetTitle}>{t("exhibitor.admin.updateProfilePhoto")}</ThemedText>
          <ThemedText style={styles.sheetSubtitle}>{t("exhibitor.admin.pasteLogoUrl")}</ThemedText>
          <UIVerticalSpacer height={24} />

          <TextInput
            style={styles.urlInput}
            value={profilePhotoUrl}
            onChangeText={setProfilePhotoUrl}
            placeholder={t("common.urlPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            keyboardType="url"
            autoCorrect={false}
          />
          <UIVerticalSpacer height={20} />

          <UIButton
            title={patchMe.isPending ? t("exhibitor.admin.saving") : t("common.save")}
            onPress={handleUpdateProfilePhoto}
            disabled={!profilePhotoUrl.trim() || patchMe.isPending}
          />
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* ── Cover Photo Bottom Sheet ── */}
      <BottomSheet
        visible={coverPhotoVisible}
        onClose={() => {
          setCoverPhotoUrl("");
          setCoverPhotoVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ThemedText style={styles.sheetTitle}>{t("exhibitor.admin.updateCoverPhoto")}</ThemedText>
          <ThemedText style={styles.sheetSubtitle}>{t("exhibitor.admin.pasteCoverUrl")}</ThemedText>
          <UIVerticalSpacer height={24} />

          <TextInput
            style={styles.urlInput}
            value={coverPhotoUrl}
            onChangeText={setCoverPhotoUrl}
            placeholder={t("common.urlPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            keyboardType="url"
            autoCorrect={false}
          />
          <UIVerticalSpacer height={20} />

          <UIButton
            title={patchMe.isPending ? t("exhibitor.admin.saving") : t("common.save")}
            onPress={handleUpdateCoverPhoto}
            disabled={!coverPhotoUrl.trim() || patchMe.isPending}
          />
        </KeyboardAvoidingView>
      </BottomSheet>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  // Header
  headerSafeArea: {
    backgroundColor: colors.surfaceSecondary,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.error,
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  // Card
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 20,
    overflow: "hidden",
  },

  // Profile section
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  profileAvatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLOR_WHITE_ON_ACCENT,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  profileAvatarImg: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  profileAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  profileAvatarInitial: {
    fontSize: 24,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  boothBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(16,185,129,0.12)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  boothBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
    letterSpacing: 0.5,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brand,
  },

  // Staff rows
  staffRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  staffRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  staffAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  staffAvatarInitial: {
    fontSize: 16,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
    marginBottom: 2,
  },
  staffRole: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239,68,68,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Empty state
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
  },

  // Media rows
  mediaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  mediaThumbWrap: {
    borderRadius: 10,
    overflow: "hidden",
  },
  mediaThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  mediaCoverThumb: {
    width: 72,
    height: 44,
    borderRadius: 10,
  },
  mediaThumbPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  mediaInfo: {
    flex: 1,
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
    marginBottom: 2,
  },
  mediaSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  mediaActionBtn: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  mediaActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 16,
  },

  // Session card
  sessionCard: {
    padding: 16,
    marginBottom: 12,
  },
  liveBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brand,
    letterSpacing: 0.5,
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  upcomingText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    marginBottom: 10,
  },
  speakersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  speakerStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  speakerAvatarWrap: {
    borderWidth: 2,
    borderColor: colors.surfaceSecondary,
    borderRadius: 14,
  },
  speakerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  speakerAvatarPlaceholder: {
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  speakerInitial: {
    fontSize: 10,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  speakerNames: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  sessionActions: {
    flexDirection: "row",
    gap: 8,
  },
  sessionActionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  sessionActionText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },

  // Bottom sheet content
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    marginTop: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 4,
  },

  // URL input
  urlInput: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLOR_WHITE_ON_ACCENT,
  },
});
