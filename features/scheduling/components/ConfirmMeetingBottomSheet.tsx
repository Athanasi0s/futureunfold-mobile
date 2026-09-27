import { ThemedText } from "@/components/themed-text";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { UIButton } from "@/components/ui/ui-button";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { MeetingLocationOut, TargetUser } from "../types";

type ConfirmMeetingBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  targetUser: TargetUser;
  date: string;
  startTime: string;
  endTime: string;
  location: MeetingLocationOut | null;
};

function formatDateDisplay(fullDate: string): string {
  const date = new Date(fullDate);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}

export function ConfirmMeetingBottomSheet({
  visible,
  onClose,
  onConfirm,
  isLoading,
  targetUser,
  date,
  startTime,
  endTime,
  location,
}: ConfirmMeetingBottomSheetProps) {
  const colors = useColors();
  const { t } = useTranslation();

  const formattedDate = formatDateDisplay(date);
  const formattedStartTime = formatTimeDisplay(startTime);
  const formattedEndTime = formatTimeDisplay(endTime);
  const durationMinutes = calculateDurationMinutes(startTime, endTime);

  return (
    <BottomSheet visible={visible} onClose={onClose} showCloseButton={false}>
      <View style={styles.container}>
        {/* Header */}
        <ThemedText style={[styles.title, { color: colors.text }]}>
          Confirm Meeting Details
        </ThemedText>

        {/* User Card */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            MEETING WITH
          </ThemedText>
          <View style={[styles.userCard, { backgroundColor: colors.inputBackground }]}>
            <Image
              source={{ uri: targetUser.avatar_url || `https://i.pravatar.cc/150?img=${targetUser.id}` }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.userInfo}>
              <ThemedText style={[styles.userName, { color: colors.text }]}>
                {targetUser.name}
              </ThemedText>
              <ThemedText style={[styles.userTitle, { color: colors.textSecondary }]}>
                {targetUser.title}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Date Row */}
        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
          <View style={styles.detailIcon}>
            <MaterialIcons name="event" size={20} color={colors.lightBlue} />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={[styles.detailValue, { color: colors.text }]}>
              {formattedDate}
            </ThemedText>
            <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
              {t("schedule.meetings.dateLabel")}
            </ThemedText>
          </View>
        </View>

        {/* Time Row */}
        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
          <View style={styles.detailIcon}>
            <MaterialIcons name="schedule" size={20} color={colors.lightBlue} />
          </View>
          <View style={styles.detailContent}>
            <View style={styles.timeRow}>
              <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                {formattedStartTime} - {formattedEndTime}
              </ThemedText>
              <View style={[styles.durationBadge, { backgroundColor: colors.lightBlue }]}>
                <ThemedText style={[styles.durationText, { color: colors.white }]}>
                  {durationMinutes} MIN
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
              {t("schedule.meetings.timeLabel")}
            </ThemedText>
          </View>
        </View>

        {/* Location Row */}
        {location && (
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="location-on" size={20} color={colors.lightBlue} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                {location.name}
              </ThemedText>
              <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Assigned Location
              </ThemedText>
            </View>
          </View>
        )}

        {/* Warning Box */}
        <View style={[styles.warningBox, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
          <MaterialIcons name="info" size={18} color={colors.warning} />
          <ThemedText style={[styles.warningText, { color: colors.warning }]}>
            This slot is reserved for 120 minutes until confirmation. Please finalize your details to secure the booking.
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <UIButton
            title={isLoading ? "Sending..." : "Confirm & Send"}
            onPress={onConfirm}
            isLoading={isLoading}
            style={[styles.confirmButton, { backgroundColor: colors.lightBlue }]}
            textStyle={{ color: colors.white }}
          />
          <UIButton
            title="Change Details"
            variant="text"
            onPress={onClose}
            style={styles.changeButton}
            textStyle={{ color: colors.text }}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
  },
  userTitle: {
    fontSize: 13,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 10,
    fontWeight: "700",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  confirmButton: {
    borderRadius: 30,
    paddingVertical: 16,
  },
  changeButton: {
    paddingVertical: 12,
  },
});
