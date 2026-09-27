import { MeetingOut, MeetingUserOut } from "@/api/schemas";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  useGetMyMeetings,
  useUpdateMeetingAction,
} from "@/features/scheduling";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { useColors } from "@/hooks/use-colors";
import { useThemeColor } from "@/hooks/use-theme-color";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { AVATAR_PALETTE, SHADOW_BLACK } from "@/constants/data-colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

type MeetingStatus = "confirmed" | "pending";
type MeetingCategory = "confirmed" | "incoming" | "outgoing";

type MeetingWithCategory = {
  meeting: MeetingOut;
  category: MeetingCategory;
};

function useStatusColors(): Record<MeetingStatus, { bg: string; text: string }> {
  const colors = useColors();
  return {
    confirmed: { bg: "rgba(34, 197, 94, 0.15)", text: colors.success },
    pending: { bg: "rgba(234, 179, 8, 0.15)", text: colors.warning },
  };
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(startStr: string, endStr: string): string {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
  return `${fmt(start)} - ${fmt(end)}`;
}

function StatusToggle({
  value,
  onChange,
}: {
  value: MeetingStatus;
  onChange: (v: MeetingStatus) => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const containerBg = useThemeColor(
    { light: colors.border, dark: colors.surfacePrimary },
    "background",
  );
  const activeBg = useThemeColor(
    { light: colors.white, dark: colors.surfacePrimary },
    "background",
  );
  const activeText = useThemeColor(
    { light: colors.brand, dark: colors.white },
    "text",
  );
  const inactiveText = useThemeColor(
    { light: colors.textTertiary, dark: colors.textSecondary },
    "text",
  );

  return (
    <View style={toggleStyles.wrapper}>
      <View style={[toggleStyles.container, { backgroundColor: containerBg }]}>
        <TouchableOpacity
          style={[
            toggleStyles.option,
            value === "confirmed" && [
              toggleStyles.optionActive,
              { backgroundColor: activeBg },
            ],
          ]}
          onPress={() => onChange("confirmed")}
          activeOpacity={0.7}
        >
          <ThemedText
            style={[
              toggleStyles.optionText,
              { color: value === "confirmed" ? activeText : inactiveText },
            ]}
          >
            {t("schedule.meetings.toggleConfirmed")}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            toggleStyles.option,
            value === "pending" && [
              toggleStyles.optionActive,
              { backgroundColor: activeBg },
            ],
          ]}
          onPress={() => onChange("pending")}
          activeOpacity={0.7}
        >
          <ThemedText
            style={[
              toggleStyles.optionText,
              { color: value === "pending" ? activeText : inactiveText },
            ]}
          >
            {t("schedule.meetings.togglePending")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingVertical: 8 },
  container: {
    flexDirection: "row",
    height: 44,
    borderRadius: 12,
    padding: 4,
  },
  option: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  optionActive: {
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: { fontSize: 14, fontWeight: "600" },
});

function MeetingCard({
  meeting,
  otherUser,
  category,
  onAccept,
  onDecline,
  onCancel,
  onReschedule,
  onViewDetails,
  isActionLoading,
}: {
  meeting: MeetingOut;
  otherUser: MeetingUserOut;
  category: MeetingCategory;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onReschedule: () => void;
  onViewDetails: () => void;
  isActionLoading: boolean;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const STATUS_COLORS = useStatusColors();
  const status: MeetingStatus = category === "confirmed" ? "confirmed" : "pending";
  const cardBg = useThemeColor(
    { light: colors.white, dark: colors.cardBackground },
    "background",
  );
  const cardBorder = useThemeColor(
    { light: colors.border, dark: colors.cardBorder },
    "background",
  );
  const textColor = useThemeColor(
    { light: colors.text, dark: colors.white },
    "text",
  );
  const textSecondary = useThemeColor(
    { light: colors.textTertiary, dark: colors.textSecondary },
    "text",
  );

  const statusColor = STATUS_COLORS[status];
  const avatarColor = getAvatarColor(otherUser.name);
  const initials = getInitials(otherUser.name);

  const subtitle = [otherUser.title, otherUser.company]
    .filter(Boolean)
    .join(" · ");

  return (
    <View
      style={[
        cardStyles.card,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
    >
      {/* Header row */}
      <View style={cardStyles.headerRow}>
        <View style={[cardStyles.avatar, { backgroundColor: avatarColor }]}>
          <ThemedText style={cardStyles.avatarText}>{initials}</ThemedText>
        </View>
        <View style={cardStyles.headerInfo}>
          <ThemedText style={[cardStyles.name, { color: textColor }]}>
            {otherUser.name}
          </ThemedText>
          {subtitle ? (
            <ThemedText
              style={[cardStyles.subtitle, { color: textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
        <View
          style={[cardStyles.statusBadge, { backgroundColor: statusColor.bg }]}
        >
          <ThemedText style={[cardStyles.statusText, { color: statusColor.text }]}>
            {t(`schedule.meetings.status_${status}`)}
          </ThemedText>
        </View>
      </View>

      {/* Details */}
      <View style={cardStyles.details}>
        <View style={cardStyles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={textSecondary} />
          <ThemedText style={[cardStyles.detailText, { color: textSecondary }]}>
            {formatDate(meeting.proposed_start)}
          </ThemedText>
        </View>
        <View style={cardStyles.detailRow}>
          <Ionicons name="time-outline" size={16} color={textSecondary} />
          <ThemedText style={[cardStyles.detailText, { color: textSecondary }]}>
            {formatTime(meeting.proposed_start, meeting.proposed_end)}
          </ThemedText>
        </View>
        {meeting.location && (
          <View style={cardStyles.detailRow}>
            <Ionicons name="location-outline" size={16} color={textSecondary} />
            <ThemedText style={[cardStyles.detailText, { color: textSecondary }]}>
              {meeting.location.name}
              {meeting.location.venue_name
                ? ` · ${meeting.location.venue_name}`
                : ""}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={cardStyles.actions}>
        {category === "confirmed" && (
          <TouchableOpacity
            style={[cardStyles.viewDetailsButton, { backgroundColor: colors.brand }]}
            onPress={onViewDetails}
            activeOpacity={0.7}
          >
            <ThemedText style={cardStyles.viewDetailsText}>{t("schedule.meetings.viewDetails")}</ThemedText>
          </TouchableOpacity>
        )}
        {category === "incoming" && (
          <>
            <TouchableOpacity
              style={[
                cardStyles.acceptButton,
                isActionLoading && cardStyles.disabledButton,
              ]}
              onPress={onAccept}
              activeOpacity={0.7}
              disabled={isActionLoading}
            >
              <ThemedText style={[cardStyles.acceptText, { color: colors.success }]}>{t("schedule.meetings.accept")}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                cardStyles.declineButton,
                isActionLoading && cardStyles.disabledButton,
              ]}
              onPress={onDecline}
              activeOpacity={0.7}
              disabled={isActionLoading}
            >
              <ThemedText style={[cardStyles.declineText, { color: colors.error }]}>{t("schedule.meetings.decline")}</ThemedText>
            </TouchableOpacity>
          </>
        )}
        {category === "outgoing" && (
          <>
            <TouchableOpacity
              style={[
                cardStyles.cancelButton,
                isActionLoading && cardStyles.disabledButton,
              ]}
              onPress={onCancel}
              activeOpacity={0.7}
              disabled={isActionLoading}
            >
              <ThemedText style={[cardStyles.cancelText, { color: colors.error }]}>{t("schedule.meetings.cancel")}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={cardStyles.rescheduleButton}
              onPress={onReschedule}
              activeOpacity={0.7}
            >
              <ThemedText style={[cardStyles.rescheduleText, { color: colors.warning }]}>{t("schedule.meetings.reschedule")}</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 16,
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  details: {
    marginTop: 14,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
  },
  viewDetailsButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  viewDetailsText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 14,
    fontWeight: "600",
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  acceptText: {
    fontSize: 14,
    fontWeight: "600",
  },
  declineButton: {
    flex: 1,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  declineText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: "rgba(234, 179, 8, 0.12)",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  rescheduleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
});

function MeetingDetailsBottomSheet({
  visible,
  onClose,
  meeting,
  otherUser,
}: {
  visible: boolean;
  onClose: () => void;
  meeting: MeetingOut;
  otherUser: MeetingUserOut;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const textColor = useThemeColor(
    { light: colors.text, dark: colors.white },
    "text",
  );
  const textSecondary = useThemeColor(
    { light: colors.textTertiary, dark: colors.textSecondary },
    "text",
  );
  const cardBg = useThemeColor(
    { light: colors.chipBackground, dark: colors.exhibitorCardBackground },
    "background",
  );

  const avatarColor = getAvatarColor(otherUser.name);
  const initials = getInitials(otherUser.name);
  const subtitle = [otherUser.title, otherUser.company]
    .filter(Boolean)
    .join(" · ");

  const durationMs =
    new Date(meeting.proposed_end).getTime() -
    new Date(meeting.proposed_start).getTime();
  const durationMin = Math.round(durationMs / 60000);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={sheetStyles.container}>
        <ThemedText style={[sheetStyles.title, { color: textColor }]}>
          {t("schedule.meetings.meetingDetails")}
        </ThemedText>

        {/* Confirmed badge */}
        <View style={sheetStyles.statusRow}>
          <View style={sheetStyles.confirmedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <ThemedText style={[sheetStyles.confirmedText, { color: colors.success }]}>{t("schedule.meetings.confirmed")}</ThemedText>
          </View>
        </View>

        {/* User card */}
        <View style={[sheetStyles.userCard, { backgroundColor: cardBg }]}>
          <View
            style={[sheetStyles.avatar, { backgroundColor: avatarColor }]}
          >
            <ThemedText style={sheetStyles.avatarText}>{initials}</ThemedText>
          </View>
          <View style={sheetStyles.userInfo}>
            <ThemedText style={[sheetStyles.userName, { color: textColor }]}>
              {otherUser.name}
            </ThemedText>
            {subtitle ? (
              <ThemedText style={[sheetStyles.userSubtitle, { color: textSecondary }]}>
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
        </View>

        {/* Details */}
        <View style={sheetStyles.details}>
          <View style={sheetStyles.detailRow}>
            <View style={sheetStyles.detailIcon}>
              <Ionicons name="calendar-outline" size={20} color={colors.lightBlue} />
            </View>
            <View style={sheetStyles.detailContent}>
              <ThemedText style={[sheetStyles.detailValue, { color: textColor }]}>
                {formatDate(meeting.proposed_start)}
              </ThemedText>
              <ThemedText
                style={[sheetStyles.detailLabel, { color: textSecondary }]}
              >
                {t("schedule.meetings.dateLabel")}
              </ThemedText>
            </View>
          </View>

          <View style={sheetStyles.detailRow}>
            <View style={sheetStyles.detailIcon}>
              <Ionicons name="time-outline" size={20} color={colors.lightBlue} />
            </View>
            <View style={sheetStyles.detailContent}>
              <View style={sheetStyles.timeRow}>
                <ThemedText
                  style={[sheetStyles.detailValue, { color: textColor }]}
                >
                  {formatTime(meeting.proposed_start, meeting.proposed_end)}
                </ThemedText>
                <View style={[sheetStyles.durationBadge, { backgroundColor: colors.lightBlue }]}>
                  <ThemedText style={sheetStyles.durationText}>
                    {durationMin} MIN
                  </ThemedText>
                </View>
              </View>
              <ThemedText
                style={[sheetStyles.detailLabel, { color: textSecondary }]}
              >
                {t("schedule.meetings.timeLabel")}
              </ThemedText>
            </View>
          </View>

          {meeting.location && (
            <View style={sheetStyles.detailRow}>
              <View style={sheetStyles.detailIcon}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.lightBlue}
                />
              </View>
              <View style={sheetStyles.detailContent}>
                <ThemedText
                  style={[sheetStyles.detailValue, { color: textColor }]}
                >
                  {meeting.location.name}
                </ThemedText>
                {meeting.location.venue_name ? (
                  <ThemedText
                    style={[
                      sheetStyles.detailLabel,
                      { color: textSecondary },
                    ]}
                  >
                    {meeting.location.venue_name}
                  </ThemedText>
                ) : null}
              </View>
            </View>
          )}

          {meeting.message ? (
            <View style={sheetStyles.detailRow}>
              <View style={sheetStyles.detailIcon}>
                <Ionicons
                  name="chatbubble-outline"
                  size={20}
                  color={colors.lightBlue}
                />
              </View>
              <View style={sheetStyles.detailContent}>
                <ThemedText
                  style={[sheetStyles.detailValue, { color: textColor }]}
                >
                  {meeting.message}
                </ThemedText>
                <ThemedText
                  style={[
                    sheetStyles.detailLabel,
                    { color: textSecondary },
                  ]}
                >
                  {t("schedule.meetings.messageLabel")}
                </ThemedText>
              </View>
            </View>
          ) : null}
        </View>

        {/* Close button */}
        <TouchableOpacity
          style={sheetStyles.closeAction}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <ThemedText style={[sheetStyles.closeActionText, { color: colors.textSecondary }]}>{t("schedule.meetings.close")}</ThemedText>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const sheetStyles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  statusRow: {
    alignItems: "center",
    marginBottom: 20,
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  confirmedText: {
    fontSize: 13,
    fontWeight: "700",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 18,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
  },
  userSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  details: {
    gap: 0,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(100, 116, 139, 0.15)",
    gap: 12,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailContent: {
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  detailLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  durationText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 10,
    fontWeight: "700",
  },
  closeAction: {
    marginTop: 24,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeActionText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default function MyMeetingsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: meetings, isLoading, isError, refetch } = useGetMyMeetings();
  const meetingAction = useUpdateMeetingAction();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<MeetingStatus>("confirmed");
  const [actionMeetingId, setActionMeetingId] = useState<number | null>(null);
  const [detailsMeeting, setDetailsMeeting] = useState<MeetingOut | null>(null);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const backgroundColor = useThemeColor(
    { light: colors.background, dark: colors.surfacePrimary },
    "background",
  );
  const textColor = useThemeColor(
    { light: colors.text, dark: colors.white },
    "text",
  );
  const textSecondary = useThemeColor(
    { light: colors.textTertiary, dark: colors.textSecondary },
    "text",
  );

  const filteredMeetings = useMemo((): MeetingWithCategory[] => {
    if (!meetings) return [];
    if (statusFilter === "confirmed") {
      return (meetings.confirmed ?? []).map((m) => ({
        meeting: m,
        category: "confirmed" as const,
      }));
    }
    // Pending = incoming + outgoing
    return [
      ...(meetings.incoming ?? []).map((m) => ({
        meeting: m,
        category: "incoming" as const,
      })),
      ...(meetings.outgoing ?? []).map((m) => ({
        meeting: m,
        category: "outgoing" as const,
      })),
    ];
  }, [meetings, statusFilter]);

  const getOtherUser = useCallback(
    (meeting: MeetingOut): MeetingUserOut => {
      if (user && meeting.requester.id === user.id) {
        return meeting.recipient;
      }
      return meeting.requester;
    },
    [user],
  );

  const handleMeetingAction = useCallback(
    (meetingId: number, action: "accept" | "decline" | "cancel") => {
      const titleKeys = {
        accept: "schedule.meetings.acceptMeeting",
        decline: "schedule.meetings.declineMeeting",
        cancel: "schedule.meetings.cancelMeeting",
      };
      const confirmKeys = {
        accept: "schedule.meetings.yesAccept",
        decline: "schedule.meetings.yesDecline",
        cancel: "schedule.meetings.yesCancel",
      };
      const successKeys = {
        accept: "schedule.meetings.successAccepted",
        decline: "schedule.meetings.successDeclined",
        cancel: "schedule.meetings.successCancelled",
      };
      Alert.alert(
        t(titleKeys[action]),
        t("schedule.meetings.confirmActionMessage", { action }),
        [
          { text: t("schedule.meetings.no"), style: "cancel" },
          {
            text: t(confirmKeys[action]),
            style: action === "accept" ? "default" : "destructive",
            onPress: () => {
              setActionMeetingId(meetingId);
              meetingAction.mutate(
                { meetingId, data: { action } },
                {
                  onSuccess: () => {
                    setActionMeetingId(null);
                    Alert.alert(
                      t("schedule.meetings.successTitle"),
                      t(successKeys[action]),
                    );
                  },
                  onError: (error: any) => {
                    setActionMeetingId(null);
                    const msg =
                      error?.response?.data?.detail ||
                      error?.message ||
                      t("schedule.meetings.failedToAction", { action });
                    Alert.alert(t("schedule.meetings.errorTitle"), String(msg));
                  },
                },
              );
            },
          },
        ],
      );
    },
    [meetingAction, t],
  );

  const handleReschedule = useCallback(
    (meeting: MeetingOut) => {
      const otherUserId =
        user && meeting.requester.id === user.id
          ? meeting.recipient.id
          : meeting.requester.id;
      router.push({
        pathname: "/(tabs)/(networking)/schedule",
        params: {
          userId: String(otherUserId),
          mode: "reschedule",
          meetingId: String(meeting.id),
          proposedStart: meeting.proposed_start,
          proposedEnd: meeting.proposed_end,
          locationId: meeting.location ? String(meeting.location.id) : "",
        },
      });
    },
    [user, router],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: MeetingWithCategory }) => (
      <MeetingCard
        meeting={item.meeting}
        otherUser={getOtherUser(item.meeting)}
        category={item.category}
        onAccept={() => handleMeetingAction(item.meeting.id, "accept")}
        onDecline={() => handleMeetingAction(item.meeting.id, "decline")}
        onCancel={() => handleMeetingAction(item.meeting.id, "cancel")}
        onReschedule={() => handleReschedule(item.meeting)}
        onViewDetails={() => setDetailsMeeting(item.meeting)}
        isActionLoading={actionMeetingId === item.meeting.id}
      />
    ),
    [getOtherUser, handleMeetingAction, handleReschedule, actionMeetingId],
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={48} color={textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
        {statusFilter === "confirmed"
          ? t("schedule.meetings.noMeetingsConfirmed")
          : t("schedule.meetings.noMeetingsPending")}
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
        {statusFilter === "confirmed"
          ? t("schedule.meetings.confirmedMeetingsNote")
          : t("schedule.meetings.pendingMeetingsNote")}
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
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
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          {t("schedule.meetings.title")}
        </ThemedText>
        <View style={styles.backButton} />
      </View>

      {/* Status Toggle */}
      <StatusToggle value={statusFilter} onChange={setStatusFilter} />

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
            {t("schedule.meetings.loadingMeetings")}
          </ThemedText>
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={textSecondary}
          />
          <ThemedText style={[styles.errorText, { color: textColor }]}>
            {t("schedule.meetings.failedToLoad")}
          </ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <ThemedText style={styles.retryButtonText}>{t("schedule.meetings.retry")}</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredMeetings}
          keyExtractor={(item) => `${item.category}-${item.meeting.id}`}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brand}
            />
          }
        />
      )}

      {/* Meeting Details Bottom Sheet */}
      {detailsMeeting && (
        <MeetingDetailsBottomSheet
          visible={!!detailsMeeting}
          onClose={() => setDetailsMeeting(null)}
          meeting={detailsMeeting}
          otherUser={getOtherUser(detailsMeeting)}
        />
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
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
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.brand,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
    marginTop: 48,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
