import { createSession, getSpeakers, getVenues } from "@/api/features/program";
import { SessionCreateInput, SpeakerBriefOut, VenueOut } from "@/api/schemas";
import { useGetAvailableInterests } from "@/features/onboarding/hooks/useGetAvailableInterests";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

export default function CreateSessionScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const backgroundColor = colors.surfacePrimary;
  const textColor = colors.text;
  const textSecondary = colors.textSecondary;
  const borderColor = colors.border;
  const inputBg = colors.inputBackground;
  const avatarPlaceholderBg = colors.surfaceSecondary;
  const avatarPlaceholderText = colors.textSecondary;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("talk");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 60 * 60 * 1000),
  );
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState<number[]>([]);
  const [speakerSearch, setSpeakerSearch] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const { data: availableInterests = [] } = useGetAvailableInterests();

  const [locations, setLocations] = useState<VenueOut[]>([]);
  const [speakers, setSpeakers] = useState<SpeakerBriefOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

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

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t("exhibitor.createSession.alertValidation"), "Please enter a session title.");
      return;
    }
    if (!type) {
      Alert.alert(t("exhibitor.createSession.alertValidation"), "Please select a session type.");
      return;
    }
    if (endDate <= startDate) {
      Alert.alert(t("exhibitor.createSession.alertValidation"), "End time must be after start time.");
      return;
    }

    const sessionData: SessionCreateInput = {
      title: title.trim(),
      description: description.trim() || null,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      type,
      topic_tags: selectedTopics.length > 0 ? selectedTopics : null,
      venue_id: selectedVenueId,
      speaker_ids: selectedSpeakerIds.length > 0 ? selectedSpeakerIds : null,
      image_url: imageUri || null,
    };

    setLoading(true);
    try {
      await createSession(sessionData);
      Alert.alert(t("exhibitor.createSession.alertSuccess"), t("exhibitor.createSession.alertSuccessMsg"), [
        { text: t("exhibitor.createSession.alertOk"), onPress: () => router.back() },
      ]);
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.detail || e?.message || "Failed to create session";
      Alert.alert(t("exhibitor.createSession.alertError"), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowStartPicker(false);
    }
    if (selectedDate) {
      if (pickerMode === "date") {
        const newDate = new Date(startDate);
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
        setStartDate(newDate);
        if (Platform.OS === "android") {
          setPickerMode("time");
          setShowStartPicker(true);
        }
      } else {
        const newDate = new Date(startDate);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        setStartDate(newDate);
        setShowStartPicker(false);
        setPickerMode("date");
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowEndPicker(false);
    }
    if (selectedDate) {
      if (pickerMode === "date") {
        const newDate = new Date(endDate);
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
        setEndDate(newDate);
        if (Platform.OS === "android") {
          setPickerMode("time");
          setShowEndPicker(true);
        }
      } else {
        const newDate = new Date(endDate);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        setEndDate(newDate);
        setShowEndPicker(false);
        setPickerMode("date");
      }
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const toggleSpeaker = (speakerId: number) => {
    setSelectedSpeakerIds((prev) =>
      prev.includes(speakerId)
        ? prev.filter((id) => id !== speakerId)
        : [...prev, speakerId],
    );
  };

  const filteredSpeakers = speakers.filter(
    (speaker) =>
      speaker.full_name.toLowerCase().includes(speakerSearch.toLowerCase()) ||
      speaker.company?.toLowerCase().includes(speakerSearch.toLowerCase()),
  );

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        t("exhibitor.createSession.alertPermission"),
        t("exhibitor.createSession.alertPermissionMsg"),
      );
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
    <View style={[styles.container, { backgroundColor }]}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>{t("exhibitor.createSession.title")}</ThemedText>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.keyboardView}
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
                {t("exhibitor.createSession.fieldTitle")} <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: inputBg, borderColor, color: textColor },
                ]}
                placeholder={t("exhibitor.createSession.titlePlaceholder")}
                placeholderTextColor={textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                {t("exhibitor.createSession.fieldDescription")}
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: inputBg, borderColor, color: textColor },
                ]}
                placeholder={t("exhibitor.createSession.descPlaceholder")}
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
                {t("exhibitor.createSession.fieldType")} <ThemedText style={styles.required}>*</ThemedText>
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
                    <ThemedText
                      style={[
                        styles.typeChipText,
                        { color: type === t ? COLOR_WHITE_ON_ACCENT : textColor },
                      ]}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Start Time */}
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                {t("exhibitor.createSession.fieldStartTime")} <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  { backgroundColor: inputBg, borderColor },
                ]}
                onPress={() => {
                  setPickerMode("date");
                  setShowStartPicker(true);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={textSecondary}
                />
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
                {t("exhibitor.createSession.fieldEndTime")} <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  { backgroundColor: inputBg, borderColor },
                ]}
                onPress={() => {
                  setPickerMode("date");
                  setShowEndPicker(true);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={textSecondary}
                />
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
              <ThemedText style={[styles.label, { color: textColor }]}>
                {t("exhibitor.createSession.fieldTopicTags")}
              </ThemedText>
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
                      <ThemedText
                        style={[
                          styles.topicBadgeText,
                          { color: isSelected ? COLOR_WHITE_ON_ACCENT : textColor },
                        ]}
                      >
                        {interest.name}
                      </ThemedText>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={COLOR_WHITE_ON_ACCENT}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Venue */}
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: textColor }]}>{t("exhibitor.createSession.fieldVenue")}</ThemedText>
              {dataLoading ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                >
                  <TouchableOpacity
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor:
                          selectedVenueId === null ? colors.brand : inputBg,
                        borderColor:
                          selectedVenueId === null ? colors.brand : borderColor,
                      },
                    ]}
                    onPress={() => setSelectedVenueId(null)}
                  >
                    <ThemedText
                      style={[
                        styles.optionChipText,
                        {
                          color:
                            selectedVenueId === null ? COLOR_WHITE_ON_ACCENT : textColor,
                        },
                      ]}
                    >
                      {t("exhibitor.createSession.venueNone")}
                    </ThemedText>
                  </TouchableOpacity>
                  {locations.map((loc) => (
                    <TouchableOpacity
                      key={loc.id}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor:
                            selectedVenueId === loc.id ? colors.brand : inputBg,
                          borderColor:
                            selectedVenueId === loc.id
                              ? colors.brand
                              : borderColor,
                        },
                      ]}
                      onPress={() => setSelectedVenueId(loc.id)}
                    >
                      <ThemedText
                        style={[
                          styles.optionChipText,
                          {
                            color:
                              selectedVenueId === loc.id
                                ? COLOR_WHITE_ON_ACCENT
                                : textColor,
                          },
                        ]}
                      >
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
                {t("exhibitor.createSession.fieldSpeakers")}{" "}
                {selectedSpeakerIds.length > 0 &&
                  `(${selectedSpeakerIds.length} ${t("exhibitor.createSession.selected")})`}
              </ThemedText>

              {dataLoading ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : speakers.length > 0 ? (
                <View style={styles.speakersSection}>
                  <View
                    style={[
                      styles.searchBar,
                      { backgroundColor: inputBg, borderColor },
                    ]}
                  >
                    <Ionicons name="search" size={20} color={textSecondary} />
                    <TextInput
                      style={[styles.searchInput, { color: textColor }]}
                      placeholder={t("exhibitor.createSession.searchSpeakers")}
                      placeholderTextColor={textSecondary}
                      value={speakerSearch}
                      onChangeText={setSpeakerSearch}
                    />
                    {speakerSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setSpeakerSearch("")}>
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={textSecondary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  <ScrollView
                    style={[styles.speakersList, { borderColor }]}
                    nestedScrollEnabled={true}
                  >
                    {filteredSpeakers.length > 0 ? (
                      filteredSpeakers.map((speaker) => {
                        const id = speaker.user_id;
                        const isSelected = selectedSpeakerIds.includes(id);
                        return (
                          <TouchableOpacity
                            key={id}
                            style={[
                              styles.speakerItem,
                              { borderBottomColor: borderColor },
                            ]}
                            onPress={() => toggleSpeaker(id)}
                          >
                            <View style={styles.speakerInfo}>
                              <View
                                style={[
                                  styles.speakerAvatar,
                                  {
                                    backgroundColor: isSelected
                                      ? colors.brand
                                      : avatarPlaceholderBg,
                                  },
                                ]}
                              >
                                {speaker.avatar_url ? (
                                  <Image
                                    source={{ uri: speaker.avatar_url }}
                                    style={styles.speakerAvatarImage}
                                  />
                                ) : (
                                  <ThemedText
                                    style={[
                                      styles.speakerInitial,
                                      {
                                        color: isSelected
                                          ? COLOR_WHITE_ON_ACCENT
                                          : avatarPlaceholderText,
                                      },
                                    ]}
                                  >
                                    {(speaker.full_name || "?").charAt(0).toUpperCase()}
                                  </ThemedText>
                                )}
                              </View>
                              <View style={styles.speakerDetails}>
                                <ThemedText
                                  style={[
                                    styles.speakerName,
                                    { color: textColor },
                                  ]}
                                >
                                  {speaker.full_name}
                                </ThemedText>
                                {speaker.company && (
                                  <ThemedText
                                    style={[
                                      styles.speakerCompany,
                                      { color: textSecondary },
                                    ]}
                                  >
                                    {speaker.company}
                                  </ThemedText>
                                )}
                              </View>
                            </View>
                            <View
                              style={[
                                styles.checkbox,
                                {
                                  backgroundColor: isSelected
                                    ? colors.brand
                                    : "transparent",
                                  borderColor: isSelected
                                    ? colors.brand
                                    : borderColor,
                                },
                              ]}
                            >
                              {isSelected && (
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color={COLOR_WHITE_ON_ACCENT}
                                />
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <ThemedText
                        style={[styles.noResultsText, { color: textSecondary }]}
                      >
                        {t("exhibitor.createSession.noSpeakersFound")}
                      </ThemedText>
                    )}
                  </ScrollView>
                </View>
              ) : (
                <ThemedText style={[styles.noDataText, { color: textSecondary }]}>
                  {t("exhibitor.createSession.noSpeakersAvailable")}
                </ThemedText>
              )}
            </View>

            {/* Session Image */}
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                {t("exhibitor.createSession.fieldSessionImage")}
              </ThemedText>

              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <View style={styles.imagePreviewActions}>
                    <TouchableOpacity
                      style={[styles.changeImageButton, { borderColor }]}
                      onPress={pickImage}
                    >
                      <Ionicons name="images-outline" size={20} color={colors.brand} />
                      <ThemedText style={styles.changeImageText}>{t("exhibitor.createSession.changeImage")}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setImageUri(null)}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  <Image
                    source={{ uri: imageUri }}
                    style={[styles.imagePreview, { borderColor }]}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    { backgroundColor: inputBg, borderColor },
                  ]}
                  onPress={pickImage}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={32}
                    color={colors.brand}
                  />
                  <ThemedText style={[styles.uploadButtonText, { color: textColor }]}>
                    {t("exhibitor.createSession.uploadImage")}
                  </ThemedText>
                  <ThemedText
                    style={[styles.uploadButtonHint, { color: textSecondary }]}
                  >
                    {t("exhibitor.createSession.tapSelectImage")}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Submit */}
          <View style={styles.footer}>
            <Pressable
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLOR_WHITE_ON_ACCENT} />
              ) : (
                <>
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={COLOR_WHITE_ON_ACCENT}
                  />
                  <ThemedText style={styles.submitButtonText}>{t("exhibitor.createSession.createBtn")}</ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },
  safeArea: {
    backgroundColor: colors.surfaceSecondary,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  required: {
    color: colors.error,
  },
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
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  dateButtonText: {
    fontSize: 16,
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  topicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  topicBadgeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  speakersSection: {
    gap: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  speakersList: {
    borderWidth: 1,
    borderRadius: 12,
    height: 300,
  },
  speakerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
  },
  speakerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  speakerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  speakerAvatarImage: {
    width: 40,
    height: 40,
  },
  speakerInitial: {
    fontSize: 16,
    fontWeight: "700",
  },
  speakerDetails: {
    flex: 1,
  },
  speakerName: {
    fontSize: 15,
    fontWeight: "600",
  },
  speakerCompany: {
    fontSize: 13,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsText: {
    padding: 16,
    textAlign: "center",
    fontSize: 14,
  },
  uploadButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: "dashed",
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  uploadButtonHint: {
    fontSize: 13,
  },
  imagePreviewContainer: {
    flexDirection: "column",
    gap: 8,
  },
  imagePreview: {
    width: "100%",
    height: 180,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreviewActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  imagePreviewText: {
    fontSize: 14,
    fontWeight: "500",
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  changeImageText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "500",
  },
  removeImageButton: {
    padding: 8,
  },
  noDataText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  footer: {
    marginTop: 32,
  },
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
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 16,
    fontWeight: "700",
  },
});
