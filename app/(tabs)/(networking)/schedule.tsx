import { ThemedText } from "@/components/themed-text";
import { UIButton } from "@/components/ui/ui-button";
import { LocationPicker } from "@/features/matching/components/LocationPicker";
import { ScheduleOverlapBox } from "@/features/matching/components/ScheduleOverlapBox";
import { TimeSlotGrid } from "@/features/matching/components/TimeSlotGrid";
import { WeekDayPicker } from "@/features/matching/components/WeekDayPicker";
import { CalendarHeader } from "@/features/networking/components/CalendarHeader";
import { Legend } from "@/features/networking/components/Legend";
import { ScheduleUserCard } from "@/features/networking/components/ScheduleUserCard";
import { ConfirmMeetingBottomSheet } from "@/features/scheduling/components/ConfirmMeetingBottomSheet";
import { GCalPromptCard } from "@/features/scheduling/components/GCalPromptCard";
import {
  useCreateMeeting,
  useGetAvailability,
  useGetConflicts,
  useGetLocations,
  useRescheduleMeeting,
} from "@/features/scheduling/hooks";
import type { FestivalDay } from "@/features/scheduling/types";
import { useColors } from "@/hooks/use-colors";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

function formatMonthLabel(fullDate: string | undefined): string {
  if (!fullDate) return "";
  const date = new Date(fullDate);
  return date
    .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();
}

function buildISODateTime(fullDate: string, time: string): string {
  // fullDate: "2026-05-20", time: "10:00"
  return `${fullDate}T${time}:00Z`;
}

export default function Schedule() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { userId, mode, meetingId, proposedStart, locationId } =
    useLocalSearchParams<{
      userId: string;
      mode?: string;
      meetingId?: string;
      proposedStart?: string;
      locationId?: string;
    }>();
  const targetUserId = userId ? parseInt(userId, 10) : 0;
  const isReschedule = mode === "reschedule";
  const rescheduleMeetingId = meetingId ? parseInt(meetingId, 10) : 0;

  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const didPrefillReschedule = useRef(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  // Fetch availability data
  const {
    data: availabilityData,
    isLoading: isLoadingAvailability,
    error: availabilityError,
  } = useGetAvailability(targetUserId);
  console.log("🔍 → Schedule → availabilityData:", availabilityData);

  // Memoize festival days to prevent unnecessary re-renders
  const festivalDays = useMemo(
    () => availabilityData?.festival_days ?? [],
    [availabilityData?.festival_days],
  );

  // Find the current day based on selection
  const currentDay = useMemo<FestivalDay | undefined>(() => {
    if (festivalDays.length === 0) return undefined;
    if (selectedDate === null) return festivalDays[0];
    return festivalDays.find((d) => d.date === selectedDate);
  }, [festivalDays, selectedDate]);

  // Auto-select day when data loads; pre-fill from meeting in reschedule mode
  useEffect(() => {
    if (festivalDays.length === 0) return;

    if (isReschedule && proposedStart && !didPrefillReschedule.current) {
      didPrefillReschedule.current = true;
      const meetingDate = proposedStart.split("T")[0]; // "2026-05-20"
      const matchingDay = festivalDays.find((d) => d.full_date === meetingDate);
      if (matchingDay) {
        setSelectedDate(matchingDay.date);
        // Extract HH:mm from ISO string
        const timePart = new Date(proposedStart).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }); // "10:00"
        setSelectedTime(timePart);
      } else {
        setSelectedDate(festivalDays[0].date);
      }
      if (locationId) {
        setSelectedLocationId(parseInt(locationId, 10));
      }
      return;
    }

    if (selectedDate === null) {
      setSelectedDate(festivalDays[0].date);
    }
  }, [festivalDays, selectedDate, isReschedule, proposedStart, locationId]);

  // Determine if we should fetch conflicts
  const shouldFetchConflicts = useMemo(() => {
    if (!currentDay || !selectedTime) return false;
    const slot = currentDay.slots.find((s) => s.time === selectedTime);
    return slot?.status === "them_only";
  }, [currentDay, selectedTime]);
  console.log("🔍 → Schedule → shouldFetchConflicts:", shouldFetchConflicts);

  // Fetch conflicts when user selects a "them_only" slot
  const { data: conflictData } = useGetConflicts({
    userId: targetUserId,
    date: currentDay?.full_date ?? "",
    time: selectedTime ?? "",
    enabled: shouldFetchConflicts,
  });
  console.log("🔍 → Schedule → conflictData:", conflictData);

  // Fetch available locations when time is selected
  const { data: locationsData, isLoading: isLoadingLocations } =
    useGetLocations({
      date: currentDay?.full_date ?? "",
      time: selectedTime ?? "",
      enabled: !!currentDay && !!selectedTime,
    });
  console.log("🔍 → Schedule → locationsData:", locationsData);

  // Auto-select first location when locations load (skip if already prefilled)
  useEffect(() => {
    if (
      selectedLocationId === null &&
      locationsData &&
      locationsData.length > 0
    ) {
      setSelectedLocationId(locationsData[0].id);
    }
  }, [locationsData, selectedLocationId]);

  // Mutations
  const createMeetingMutation = useCreateMeeting();
  const rescheduleMeetingMutation = useRescheduleMeeting();

  // Calculate end time (30 minutes after start)
  const getEndTime = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const endMinutes = minutes + 30;
    const endHours = hours + Math.floor(endMinutes / 60);
    return `${endHours.toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;
  };

  const handleOpenConfirmSheet = () => {
    if (!currentDay || !selectedTime) {
      Alert.alert(t("networking.schedule.errorTitle"), t("networking.schedule.errorSelectDateAndTime"));
      return;
    }
    setShowConfirmSheet(true);
  };

  const handleConfirmMeeting = () => {
    if (!currentDay || !selectedTime) return;

    const startTime = buildISODateTime(currentDay.full_date, selectedTime);
    const endTime = getEndTime(selectedTime);
    const proposedEnd = buildISODateTime(currentDay.full_date, endTime);

    const onSuccess = () => {
      setShowConfirmSheet(false);
      Alert.alert(
        "Success",
        isReschedule
          ? t("networking.schedule.successRescheduled")
          : t("networking.schedule.successRequestSent"),
        [{ text: t("networking.schedule.okButton"), onPress: () => router.back() }],
      );
    };
    const onError = (error: any) => {
      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        (isReschedule
          ? t("networking.schedule.failedToReschedule")
          : t("networking.schedule.failedToSendRequest"));
      Alert.alert(t("networking.schedule.errorTitle"), String(msg));
    };

    if (isReschedule) {
      rescheduleMeetingMutation.mutate(
        {
          meetingId: rescheduleMeetingId,
          data: {
            proposed_start: startTime,
            proposed_end: proposedEnd,
            location_id: selectedLocationId ?? undefined,
            message: message.trim() || undefined,
          },
        },
        { onSuccess, onError },
      );
    } else {
      createMeetingMutation.mutate(
        {
          recipient_id: targetUserId,
          proposed_start: startTime,
          proposed_end: proposedEnd,
          location_id: selectedLocationId ?? undefined,
          message: message.trim() || undefined,
        },
        { onSuccess, onError },
      );
    }
  };

  // Loading state
  if (isLoadingAvailability) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { paddingTop: insets.top, backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.lightBlue} />
      </View>
    );
  }

  // Error state
  if (availabilityError || !availabilityData) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { paddingTop: insets.top, backgroundColor: colors.background },
        ]}
      >
        <ThemedText style={{ color: colors.text }}>
          {t("networking.schedule.failedToLoadAvailability")}
        </ThemedText>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <ThemedText style={{ color: colors.lightBlue }}>{t("networking.schedule.goBack")}</ThemedText>
        </Pressable>
      </View>
    );
  }

  const { target_user } = availabilityData;
  const monthLabel = formatMonthLabel(currentDay?.full_date);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
          {isReschedule ? t("networking.schedule.headerReschedule") : t("networking.schedule.headerSchedule")}
        </ThemedText>
        <Pressable hitSlop={8}>
          <MaterialIcons name="more-horiz" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <ScheduleUserCard
          avatarUrl={`https://i.pravatar.cc/150?img=${targetUserId}`}
          name={target_user.name}
          title={target_user.title}
          company={target_user.company}
          badge={target_user.badge}
        />

        {/* Google Calendar Prompt */}
        <GCalPromptCard />

        {/* Calendar Header */}
        <CalendarHeader monthLabel={monthLabel} linkText={t("networking.schedule.festivalDays")} />

        {/* Week Day Picker */}
        <WeekDayPicker
          days={festivalDays}
          selectedDate={selectedDate ?? festivalDays[0]?.date ?? 0}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setSelectedTime(null);
            setSelectedLocationId(null);
          }}
        />

        {/* Legend */}
        <Legend />

        {/* Time Slots */}
        {currentDay && (
          <TimeSlotGrid
            slots={currentDay.slots}
            selectedTime={selectedTime}
            onSelectTime={(time) => {
              setSelectedTime(time);
              setSelectedLocationId(null);
            }}
          />
        )}

        {/* Schedule Overlap */}
        {conflictData && (
          <View style={styles.overlapSection}>
            <ScheduleOverlapBox overlap={conflictData} />
          </View>
        )}

        {/* Location */}
        {selectedTime && (
          <View style={styles.locationSection}>
            {isLoadingLocations ? (
              <ActivityIndicator size="small" color={colors.lightBlue} />
            ) : (
              <LocationPicker
                locations={locationsData ?? []}
                selectedId={selectedLocationId}
                onSelect={setSelectedLocationId}
              />
            )}
          </View>
        )}

        {/* Send Button */}
        <UIButton
          title={isReschedule ? t("networking.schedule.rescheduleMeeting") : t("networking.schedule.sendMeetingRequest")}
          onPress={handleOpenConfirmSheet}
          style={[styles.sendButton, { backgroundColor: colors.lightBlue }]}
          textStyle={[styles.sendButtonText, { color: colors.white }]}
          disabled={!selectedTime}
        />

        {/* Message Input */}
        <TextInput
          style={[
            styles.messageInput,
            { backgroundColor: colors.inputBackground, color: colors.text },
          ]}
          placeholder={t("networking.schedule.messagePlaceholder")}
          placeholderTextColor={colors.placeholder}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={3}
        />
      </ScrollView>

      {/* Confirm Meeting Bottom Sheet */}
      {currentDay && selectedTime && (
        <ConfirmMeetingBottomSheet
          visible={showConfirmSheet}
          onClose={() => setShowConfirmSheet(false)}
          onConfirm={handleConfirmMeeting}
          isLoading={createMeetingMutation.isPending || rescheduleMeetingMutation.isPending}
          targetUser={target_user}
          date={currentDay.full_date}
          startTime={selectedTime}
          endTime={getEndTime(selectedTime)}
          location={
            locationsData?.find((l) => l.id === selectedLocationId) ?? null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  overlapSection: {
    marginTop: 18,
  },
  locationSection: {
    marginTop: 24,
  },
  sendButton: {
    marginTop: 24,
    borderRadius: 30,
    paddingVertical: 16,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  messageInput: {
    marginTop: 16,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
});
