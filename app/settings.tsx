import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { useGoogleCalendarStatus, useDisconnectGoogleCalendar } from "@/features/scheduling/hooks/useGoogleCalendar";
import { useGoogleCalendarAuth } from "@/features/scheduling/hooks/useGoogleCalendarAuth";
import { useNotificationPreferences } from "@/features/notifications/hooks/useNotificationPreferences";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
};

function SettingsRow({ icon, label, subtitle, rightElement, onPress }: SettingsRowProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <View style={styles.rowLabelContainer}>
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
        {subtitle ? (
          <ThemedText style={styles.rowSubtitle}>{subtitle}</ThemedText>
        ) : null}
      </View>
      <View style={styles.rowRight}>{rightElement}</View>
    </TouchableOpacity>
  );
}

function ChevronRight() {
  const colors = useColors();
  return (
    <Ionicons
      name="chevron-forward"
      size={18}
      color={colors.textSecondary}
    />
  );
}

function Badge({ label }: { label: string }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.badge}>
      <ThemedText style={styles.badgeText}>{label}</ThemedText>
    </View>
  );
}

function ValueText({ text }: { text: string }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <ThemedText style={styles.valueText}>{text}</ThemedText>;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const colors = useColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const appName = useConfigStore((s) => s.appName);

  const [emailUpdates, setEmailUpdates] = useState(false);
  const [locationOnMap, setLocationOnMap] = useState(true);
  const { preferences, toggle: togglePref } = useNotificationPreferences();
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const isPrefEnabled = (category: string) =>
    preferences.find((p) => p.category === category)?.enabled ?? true;

  const { data: gcalStatus } = useGoogleCalendarStatus();
  const { mutate: disconnectGcal } = useDisconnectGoogleCalendar();
  const { connect: connectGcal } = useGoogleCalendarAuth();

  const truncatedEmail = user?.email
    ? user.email.length > 16
      ? user.email.slice(0, 16) + "..."
      : user.email
    : "";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t("settings.title")}</ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons
                name="person"
                size={28}
                color={colors.textSecondary}
              />
            </View>
          )}
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>
              {user?.full_name ?? "User"}
            </ThemedText>
            <ThemedText style={styles.profileEmail}>{user?.email ?? ""}</ThemedText>
            <TouchableOpacity onPress={() => router.push("/edit-profile" as any)}>
              <ThemedText style={styles.editProfileLink}>{t("settings.editProfile")}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACCOUNT */}
        <ThemedText style={styles.sectionTitle}>{t("settings.sectionAccount")}</ThemedText>
        <View style={styles.section}>
          <SettingsRow
            icon="mail-outline"
            label={t("settings.emailLabel")}
            rightElement={
              <View style={styles.rowValueWithChevron}>
                <ValueText text={truncatedEmail} />
                <ChevronRight />
              </View>
            }
            onPress={() => Alert.alert(t("settings.emailLabel"), t("settings.emailSettingsMessage"))}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="shield-outline"
            label={t("settings.securityLabel")}
            rightElement={<ChevronRight />}
            onPress={() => Alert.alert(t("settings.securityLabel"), t("settings.securitySettingsMessage"))}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="calendar-outline"
            label={t("settings.googleCalendarLabel")}
            rightElement={
              <View style={styles.rowValueWithChevron}>
                {gcalStatus?.connected && gcalStatus.is_valid ? (
                  <View style={styles.greenBadge}>
                    <ThemedText style={styles.greenBadgeText}>{t("settings.gcalConnected")}</ThemedText>
                  </View>
                ) : gcalStatus?.connected && !gcalStatus.is_valid ? (
                  <View style={styles.orangeBadge}>
                    <ThemedText style={styles.orangeBadgeText}>{t("settings.gcalReconnect")}</ThemedText>
                  </View>
                ) : (
                  <Badge label={t("settings.gcalConnect")} />
                )}
                <ChevronRight />
              </View>
            }
            onPress={() => {
              if (gcalStatus?.connected && gcalStatus.is_valid) {
                Alert.alert(
                  t("settings.gcalDisconnectTitle"),
                  t("settings.gcalDisconnectMessage"),
                  [
                    { text: t("settings.cancel") },
                    {
                      text: t("settings.gcalDisconnect"),
                      style: "destructive",
                      onPress: () => disconnectGcal(),
                    },
                  ],
                );
              } else {
                connectGcal();
              }
            }}
          />
        </View>

        {/* ADMIN — only visible to admin users */}
        {user?.role === "admin" && (
          <>
            <ThemedText style={styles.sectionTitle}>{t("settings.sectionAdmin")}</ThemedText>
            <View style={styles.section}>
              <SettingsRow
                icon="scan-outline"
                label={t("settings.validateTicket")}
                rightElement={<ChevronRight />}
                onPress={() => router.push("/validate-ticket")}
              />
            </View>
          </>
        )}

        {/* NOTIFICATIONS */}
        <ThemedText style={styles.sectionTitle}>{t("settings.sectionNotifications")}</ThemedText>
        <View style={styles.section}>
          <SettingsRow
            icon="time-outline"
            label={t("settings.sessionReminders")}
            subtitle={t("settings.sessionRemindersSubtitle")}
            rightElement={
              <Switch
                value={isPrefEnabled("session_reminder")}
                onValueChange={(val) => togglePref("session_reminder", val)}
                trackColor={{
                  false: colors.switchTrackOff,
                  true: colors.primary,
                }}
                thumbColor={COLOR_WHITE_ON_ACCENT}
              />
            }
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="person-circle-outline"
            label={t("settings.meetingReminders")}
            subtitle={t("settings.meetingRemindersSubtitle")}
            rightElement={
              <Switch
                value={isPrefEnabled("meeting_reminder")}
                onValueChange={(val) => togglePref("meeting_reminder", val)}
                trackColor={{
                  false: colors.switchTrackOff,
                  true: colors.primary,
                }}
                thumbColor={COLOR_WHITE_ON_ACCENT}
              />
            }
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="people-outline"
            label={t("settings.friendActivity")}
            subtitle={t("settings.friendActivitySubtitle")}
            rightElement={
              <Switch
                value={isPrefEnabled("friend_activity")}
                onValueChange={(val) => togglePref("friend_activity", val)}
                trackColor={{
                  false: colors.switchTrackOff,
                  true: colors.primary,
                }}
                thumbColor={COLOR_WHITE_ON_ACCENT}
              />
            }
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="chatbubbles-outline"
            label={t("settings.groupSuggestions")}
            subtitle={t("settings.groupSuggestionsSubtitle")}
            rightElement={
              <Switch
                value={isPrefEnabled("group_suggestion")}
                onValueChange={(val) => togglePref("group_suggestion", val)}
                trackColor={{
                  false: colors.switchTrackOff,
                  true: colors.primary,
                }}
                thumbColor={COLOR_WHITE_ON_ACCENT}
              />
            }
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="trending-up-outline"
            label={t("settings.popularSessions")}
            subtitle={t("settings.popularSessionsSubtitle")}
            rightElement={
              <Switch
                value={isPrefEnabled("popular_session")}
                onValueChange={(val) => togglePref("popular_session", val)}
                trackColor={{
                  false: colors.switchTrackOff,
                  true: colors.primary,
                }}
                thumbColor={COLOR_WHITE_ON_ACCENT}
              />
            }
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="mail-unread-outline"
            label={t("settings.emailUpdates")}
            rightElement={
              <Switch
                value={emailUpdates}
                onValueChange={setEmailUpdates}
                trackColor={{
                  false: colors.switchTrackOff,
                  true: colors.primary,
                }}
                thumbColor={COLOR_WHITE_ON_ACCENT}
              />
            }
          />
        </View>

        {/* PRIVACY */}
        <ThemedText style={styles.sectionTitle}>{t("settings.sectionPrivacy")}</ThemedText>
        <View style={styles.section}>
          <SettingsRow
            icon="eye-outline"
            label={t("settings.profileVisibility")}
            rightElement={<Badge label={t("settings.visibilityPublic")} />}
            onPress={() =>
              Alert.alert(t("settings.profileVisibility"), t("settings.profileVisibilityMessage"))
            }
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="location-outline"
            label={t("settings.locationOnMap")}
            rightElement={
              <Switch
                value={locationOnMap}
                onValueChange={setLocationOnMap}
                trackColor={{
                  false: colors.switchTrackOff,
                  true: colors.primary,
                }}
                thumbColor={COLOR_WHITE_ON_ACCENT}
              />
            }
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="ban-outline"
            label={t("settings.blockedUsers")}
            subtitle={t("settings.blockedUsersSubtitle")}
            rightElement={<ChevronRight />}
            onPress={() => router.push("/blocked-users")}
          />
        </View>

        {/* APP PREFERENCES */}
        <ThemedText style={styles.sectionTitle}>{t("settings.sectionAppPreferences")}</ThemedText>
        <View style={styles.section}>
          <SettingsRow
            icon="color-palette-outline"
            label={t("settings.appAppearance")}
            subtitle={t("settings.appAppearanceSubtitle")}
            rightElement={<ChevronRight />}
            onPress={() => router.push("/settings-theme")}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="language-outline"
            label={t("settings.language")}
            rightElement={
              <View style={styles.rowValueWithChevron}>
                <ValueText text={t("settings.languageValue")} />
                <ChevronRight />
              </View>
            }
            onPress={() => Alert.alert(t("settings.language"), t("settings.languageSettingsMessage"))}
          />
        </View>

        {/* SUPPORT & LEGAL */}
        <ThemedText style={styles.sectionTitle}>{t("settings.sectionSupportLegal")}</ThemedText>
        <View style={styles.section}>
          <SettingsRow
            icon="help-circle-outline"
            label={t("settings.helpCenter")}
            rightElement={
              <Ionicons
                name="open-outline"
                size={18}
                color={colors.textSecondary}
              />
            }
            onPress={() => Alert.alert(t("settings.helpCenter"), t("settings.helpCenterMessage"))}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="document-text-outline"
            label={t("settings.termsOfService")}
            rightElement={<ChevronRight />}
            onPress={() =>
              Alert.alert(t("settings.termsOfService"), t("settings.termsOfServiceMessage"))
            }
          />
        </View>

        {/* Log Out */}
        <TouchableOpacity
          testID="settings-log-out-button"
          style={styles.logoutButton}
          onPress={logout}
        >
          <ThemedText style={styles.logoutText}>{t("settings.logOut")}</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.versionText}>
          {t("settings.versionText", { appName })}
        </ThemedText>
      </ScrollView>
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    scrollContent: {
      paddingHorizontal: 16,
    },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      marginBottom: 8,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    avatarPlaceholder: {
      backgroundColor: colors.cardBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    profileEmail: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    editProfileLink: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.lightBlue,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 1,
      marginTop: 20,
      marginBottom: 10,
      marginLeft: 4,
    },
    section: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 12,
    },
    rowLabelContainer: {
      flex: 1,
    },
    rowLabel: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.text,
    },
    rowSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    rowValueWithChevron: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    rowSeparator: {
      height: 1,
      backgroundColor: colors.cardBorder,
      marginLeft: 46,
    },
    valueText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    badge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.lightBlue,
    },
    greenBadge: {
      backgroundColor: "rgba(52, 199, 89, 0.15)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    greenBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.success,
    },
    orangeBadge: {
      backgroundColor: "rgba(255, 159, 10, 0.15)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    orangeBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.warning,
    },
    logoutButton: {
      marginTop: 28,
      borderWidth: 1.5,
      borderColor: colors.error,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    logoutText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.error,
    },
    versionText: {
      fontSize: 12,
      color: colors.textSubtle,
      textAlign: "center",
      marginTop: 16,
    },
  });
