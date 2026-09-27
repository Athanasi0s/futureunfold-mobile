import { getSpeakers, getVenues } from "@/api/features/program";
import { useTranslation } from "react-i18next";
import type { SpeakerBriefOut, VenueOut } from "@/api/schemas";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { useGetExhibitorSessions } from "@/features/exhibitors/hooks/useGetExhibitorSessions";
import { usePatchSession } from "@/features/exhibitors/hooks/usePatchSession";
import { useGetAvailableInterests } from "@/features/onboarding/hooks/useGetAvailableInterests";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
const SESSION_TYPES = [
  "keynote",
  "workshop",
  "panel",
  "talk",
  "networking",
  "break",
];

export default function EditSessionScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const id = Number(sessionId);

  const user = useAuthStore((s) => s.user);
  const { data: sessions = [] } = useGetExhibitorSessions(user?.id);
  const session = sessions.find((s) => s.id === id);

  const textColor = colors.text;
  const textSecondary = colors.textSecondary;
  const borderColor = colors.border;
  const inputBg = colors.inputBackground;
  const avatarPlaceholderBg = colors.surfaceSecondary;
  const avatarPlaceholderText = colors.textSecondary;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("talk");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState<number[]>([]);
  const [speakerSearch, setSpeakerSearch] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [locations, setLocations] = useState<VenueOut[]>([]);
  const [speakers, setSpeakers] = useState<SpeakerBriefOut[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");

  const { data: availableInterests = [] } = useGetAvailableInterests();
  const patchSession = usePatchSession(id);
  const prefilledSessionId = useRef<number | null>(null);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  // Pre-fill form once session data is available
  useEffect(() => {
    if (!session || prefilledSessionId.current === session.id) return;
    prefilledSessionId.current = session.id;
    setTitle(session.title);
    setDescription(session.description ?? "");
    setType(session.type ?? "talk");
    setStartDate(new Date(session.start_time));
    setEndDate(new Date(session.end_time));
    setSelectedTopics(session.topic_tags ?? []);
    setSelectedVenueId(session.venue?.id ?? null);
    setSelectedSpeakerIds(session.speakers.map((s) => s.user_id));
    setImageUri(session.image_url ?? null);
  }, [session]);

  // Load venues + speakers
  useEffect(() => {
    async function loadData() {
      try {
        const [locationsData, speakersData] = await Promise.all([
          getVenues().catch(() => []),
          getSpeakers().catch(() => []),
        ]);
        setLocations(locationsData);
        setSpeakers(speakersData);
      } catch (e) {
        console.error("Failed to load form data:", e);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert(t("exhibitor.editSession.alertValidation"), t("exhibitor.editSession.alertTitleRequired"));
      return;
    }
    if (!type) {
      Alert.alert(t("exhibitor.editSession.alertValidation"), t("exhibitor.editSession.alertTypeRequired"));
      return;
    }
    if (endDate <= startDate) {
      Alert.alert(t("exhibitor.editSession.alertValidation"), t("exhibitor.editSession.alertEndTime"));
      return;
    }

    patchSession.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        type,
        topic_tags: selectedTopics.length > 0 ? selectedTopics : null,
        venue_id: selectedVenueId,
        speaker_ids: selectedSpeakerIds.length > 0 ? selectedSpeakerIds : undefined,
        image_url: imageUri || null,
      },
      {
        onSuccess: () => router.back(),
        onError: (e: any) => {
          const msg = e?.response?.data?.detail || e?.message || "Failed to save session";
          Alert.alert(t("exhibitor.editSession.alertError"), msg);
        },
      },
    );
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowStartPicker(false);
    if (selectedDate) {
      if (pickerMode === "date") {
        const d = new Date(startDate);
        d.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setStartDate(d);
        if (Platform.OS === "android") { setPickerMode("time"); setShowStartPicker(true); }
      } else {
        const d = new Date(startDate);
        d.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        setStartDate(d);
        setShowStartPicker(false);
        setPickerMode("date");
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowEndPicker(false);
    if (selectedDate) {
      if (pickerMode === "date") {
        const d = new Date(endDate);
        d.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setEndDate(d);
        if (Platform.OS === "android") { setPickerMode("time"); setShowEndPicker(true); }
      } else {
        const d = new Date(endDate);
        d.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        setEndDate(d);
        setShowEndPicker(false);
        setPickerMode("date");
      }
    }
  };

  const formatDateTime = (date: Date) =>
    date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const toggleTopic = (topic: string) =>
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );

  const toggleSpeaker = (speakerId: number) =>
    setSelectedSpeakerIds((prev) =>
      prev.includes(speakerId)
        ? prev.filter((id) => id !== speakerId)
        : [...prev, speakerId],
    );

  const filteredSpeakers = speakers.filter(
    (s) =>
      s.full_name.toLowerCase().includes(speakerSearch.toLowerCase()) ||
      s.company?.toLowerCase().includes(speakerSearch.toLowerCase()),
  );

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("exhibitor.editSession.alertPermission"), t("exhibitor.editSession.alertPermissionMsg"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
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

      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={COLOR_WHITE_ON_ACCENT} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("exhibitor.editSession.title")}</ThemedText>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                {t("exhibitor.editSession.fieldTitle")} <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder={t("exhibitor.editSession.titlePlaceholder")}
                placeholderTextColor={textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: textColor }]}>{t("exhibitor.editSession.fieldDescription")}</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder={t("exhibitor.editSession.descPlaceholder")}
                placeholderTextColor={textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Type */}
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                {t("exhibitor.editSession.fieldType")} <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <View style={styles.typeGrid}>
                {SESSION_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: type === t ? colors.brand : inputBg,
                        borderColor: type === t ? colors.brand : borderColor,
                      },
                    ]}
                    onPress={() => setType(t)}
                  >
                    <ThemedText style={[styles.typeChipText, { color: type === t ? COLOR_WHITE_ON_ACCENT : textColor }]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Start Time */}
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                {t("exhibitor.editSession.fieldStartTime")} <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: inputBg, borderColor }]}
                onPress={() => {
                  if (showStartPicker) {
                    setShowStartPicker(false);
                    setPickerMode("date");
                  } else {
                    setShowEndPicker(false);
                    setPickerMode("date");
                    setShowStartPicker(true);
                  }
                }}
              >
                <Ionicons name="calendar-outline" size={20} color={textSecondary} />
                <ThemedText style={[styles.dateButtonText, { color: textColor }]}>
                  {formatDateTime(startDate)}
                </ThemedText>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode={pickerMode}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onStartDateChange}
                />
              )}
            </View>

            {/* End Time */}
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                {t("exhibitor.editSession.fieldEndTime")} <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: inputBg, borderColor }]}
                onPress={() => {
                  if (showEndPicker) {
                    setShowEndPicker(false);
                    setPickerMode("date");
                  } else {
                    setShowStartPicker(false);
                    setPickerMode("date");
                    setShowEndPicker(true);
                  }
                }}
              >
                <Ionicons name="calendar-outline" size={20} color={textSecondary} />
                <ThemedText style={[styles.dateButtonText, { color: textColor }]}>
                  {formatDateTime(endDate)}
                </ThemedText>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode={pickerMode}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onEndDateChange}
                />
              )}
            </View>

            {/* Topic Tags */}
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: textColor }]}>{t("exhibitor.editSession.fieldTopicTags")}</ThemedText>
              <View style={styles.topicGrid}>
                {availableInterests.map((interest) => {
                  const isSelected = selectedTopics.includes(interest.name);
                  return (
                    <TouchableOpacity
                      key={interest.id}
                      style={[
                        styles.topicBadge,
                        {
                          backgroundColor: isSelected ? colors.brand : inputBg,
                          borderColor: isSelected ? colors.brand : borderColor,
                        },
                      ]}
                      onPress={() => toggleTopic(interest.name)}
                    >
                      <ThemedText style={[styles.topicBadgeText, { color: isSelected ? COLOR_WHITE_ON_ACCENT : textColor }]}>
                        {interest.name}
                      </ThemedText>
                      {isSelected && <Ionicons name="checkmark-circle" size={16} color={COLOR_WHITE_ON_ACCENT} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Venue */}
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: textColor }]}>{t("exhibitor.editSession.fieldVenue")}</ThemedText>
              {dataLoading ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  <TouchableOpacity
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: selectedVenueId === null ? colors.brand : inputBg,
                        borderColor: selectedVenueId === null ? colors.brand : borderColor,
                      },
                    ]}
                    onPress={() => setSelectedVenueId(null)}
                  >
                    <ThemedText style={[styles.optionChipText, { color: selectedVenueId === null ? COLOR_WHITE_ON_ACCENT : textColor }]}>
                      {t("exhibitor.editSession.venueNone")}
                    </ThemedText>
                  </TouchableOpacity>
                  {locations.map((loc) => (
                    <TouchableOpacity
                      key={loc.id}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: selectedVenueId === loc.id ? colors.brand : inputBg,
                          borderColor: selectedVenueId === loc.id ? colors.brand : borderColor,
                        },
                      ]}
                      onPress={() => setSelectedVenueId(loc.id)}
                    >
                      <ThemedText style={[styles.optionChipText, { color: selectedVenueId === loc.id ? COLOR_WHITE_ON_ACCENT : textColor }]}>
                        {loc.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Speakers */}
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                {t("exhibitor.editSession.fieldSpeakers")}{selectedSpeakerIds.length > 0 && ` (${selectedSpeakerIds.length} ${t("exhibitor.editSession.selected")})`}
              </ThemedText>
              {dataLoading ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : speakers.length > 0 ? (
                <View style={styles.speakersSection}>
                  <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor }]}>
                    <Ionicons name="search" size={20} color={textSecondary} />
                    <TextInput
                      style={[styles.searchInput, { color: textColor }]}
                      placeholder={t("exhibitor.editSession.searchSpeakers")}
                      placeholderTextColor={textSecondary}
                      value={speakerSearch}
                      onChangeText={setSpeakerSearch}
                    />
                    {speakerSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setSpeakerSearch("")}>
                        <Ionicons name="close-circle" size={20} color={textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView style={[styles.speakersList, { borderColor }]} nestedScrollEnabled>
                    {filteredSpeakers.length > 0 ? (
                      filteredSpeakers.map((speaker) => {
                        const isSelected = selectedSpeakerIds.includes(speaker.user_id);
                        return (
                          <TouchableOpacity
                            key={speaker.user_id}
                            style={[styles.speakerItem, { borderBottomColor: borderColor }]}
                            onPress={() => toggleSpeaker(speaker.user_id)}
                          >
                            <View style={styles.speakerInfo}>
                              <View style={[styles.speakerAvatar, { backgroundColor: isSelected ? colors.brand : avatarPlaceholderBg }]}>
                                {speaker.avatar_url ? (
                                  <Image source={{ uri: speaker.avatar_url }} style={styles.speakerAvatarImage} />
                                ) : (
                                  <ThemedText style={[styles.speakerInitial, { color: isSelected ? COLOR_WHITE_ON_ACCENT : avatarPlaceholderText }]}>
                                    {(speaker.full_name || "?").charAt(0).toUpperCase()}
                                  </ThemedText>
                                )}
                              </View>
                              <View style={styles.speakerDetails}>
                                <ThemedText style={[styles.speakerName, { color: textColor }]}>{speaker.full_name}</ThemedText>
                                {speaker.company && (
                                  <ThemedText style={[styles.speakerCompany, { color: textSecondary }]}>{speaker.company}</ThemedText>
                                )}
                              </View>
                            </View>
                            <View
                              style={[
                                styles.checkbox,
                                {
                                  backgroundColor: isSelected ? colors.brand : "transparent",
                                  borderColor: isSelected ? colors.brand : borderColor,
                                },
                              ]}
                            >
                              {isSelected && <Ionicons name="checkmark" size={16} color={COLOR_WHITE_ON_ACCENT} />}
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <ThemedText style={[styles.noResultsText, { color: textSecondary }]}>{t("exhibitor.editSession.noSpeakersFound")}</ThemedText>
                    )}
                  </ScrollView>
                </View>
              ) : (
                <ThemedText style={[styles.noDataText, { color: textSecondary }]}>{t("exhibitor.editSession.noSpeakersAvailable")}</ThemedText>
              )}
            </View>

            {/* Session Image */}
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: textColor }]}>{t("exhibitor.editSession.fieldSessionImage")}</ThemedText>
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <View style={[styles.imagePreview, { borderColor }]}>
                    <ThemedText style={[styles.imagePreviewText, { color: textSecondary }]}>{t("exhibitor.editSession.imageSelected")}</ThemedText>
                  </View>
                  <TouchableOpacity style={[styles.changeImageButton, { borderColor }]} onPress={pickImage}>
                    <Ionicons name="images-outline" size={20} color={colors.brand} />
                    <ThemedText style={styles.changeImageText}>{t("exhibitor.editSession.changeImage")}</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: inputBg, borderColor }]}
                  onPress={pickImage}
                >
                  <Ionicons name="cloud-upload-outline" size={32} color={colors.brand} />
                  <ThemedText style={[styles.uploadButtonText, { color: textColor }]}>{t("exhibitor.editSession.uploadImage")}</ThemedText>
                  <ThemedText style={[styles.uploadButtonHint, { color: textSecondary }]}>{t("exhibitor.editSession.tapSelectImage")}</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.submitButton, patchSession.isPending && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={patchSession.isPending}
            >
              {patchSession.isPending ? (
                <ActivityIndicator color={COLOR_WHITE_ON_ACCENT} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={COLOR_WHITE_ON_ACCENT} />
                  <ThemedText style={styles.submitButtonText}>{t("exhibitor.editSession.saveChanges")}</ThemedText>
                </>
              )}
            </Pressable>

            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={patchSession.isPending}>
              <ThemedText style={[styles.cancelButtonText, { color: textSecondary }]}>{t("common.cancel")}</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

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
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  form: { gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600" },
  required: { color: colors.error },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  typeChipText: { fontSize: 14, fontWeight: "500" },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  dateButtonText: { fontSize: 16 },
  horizontalScroll: { flexGrow: 0 },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  optionChipText: { fontSize: 14, fontWeight: "500" },
  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  topicBadgeText: { fontSize: 14, fontWeight: "500" },
  speakersSection: { gap: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  speakersList: { borderWidth: 1, borderRadius: 12, height: 300 },
  speakerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
  },
  speakerInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  speakerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  speakerAvatarImage: { width: 40, height: 40 },
  speakerInitial: { fontSize: 16, fontWeight: "700" },
  speakerDetails: { flex: 1 },
  speakerName: { fontSize: 15, fontWeight: "600" },
  speakerCompany: { fontSize: 13, marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsText: { padding: 16, textAlign: "center", fontSize: 14 },
  uploadButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: "dashed",
    gap: 8,
  },
  uploadButtonText: { fontSize: 16, fontWeight: "600" },
  uploadButtonHint: { fontSize: 13 },
  imagePreviewContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  imagePreview: { flex: 1, padding: 16, borderWidth: 1, borderRadius: 12, alignItems: "center" },
  imagePreviewText: { fontSize: 14, fontWeight: "500" },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  changeImageText: { color: colors.brand, fontSize: 14, fontWeight: "500" },
  removeImageButton: { padding: 8 },
  noDataText: { fontSize: 14, fontStyle: "italic" },
  footer: { marginTop: 32, gap: 12, alignItems: "center" },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: COLOR_WHITE_ON_ACCENT, fontSize: 16, fontWeight: "700" },
  cancelButton: { paddingVertical: 8 },
  cancelButtonText: { fontSize: 16, fontWeight: "500" },
});
