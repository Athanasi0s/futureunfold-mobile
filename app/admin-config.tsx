import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { useConfigStore } from "@/features/config/stores/config-store";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  getAdminConfig,
  setAdminConfig,
} from "@/features/admin/api-config";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
type ConfigField = { key: string; label: string; type: "string" | "number"; helper?: string };

type ConfigSection = {
  title: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  configKey: string; // The single AppConfig key this section saves to
  fields: ConfigField[];
};

const CONFIG_SECTIONS: ConfigSection[] = [
  {
    title: "Meeting Scheduling Config",
    description: "Configure the daily meeting time slots and festival date range for scheduling.",
    icon: "calendar",
    configKey: "schedule_config",
    fields: [
      { key: "festival_start", label: "Festival Start Date", type: "string", helper: "Format: YYYY-MM-DD" },
      { key: "festival_end", label: "Festival End Date", type: "string", helper: "Format: YYYY-MM-DD" },
      { key: "slot_start_hour", label: "Daily Start Time (hour)", type: "number", helper: "0-23, e.g. 9 for 9:00 AM" },
      { key: "slot_start_minute", label: "Daily Start Time (minute)", type: "number", helper: "0-59, e.g. 0 or 30" },
      { key: "slot_end_hour", label: "Daily End Time (hour)", type: "number", helper: "0-23, e.g. 18 for 6:00 PM" },
      { key: "slot_end_minute", label: "Daily End Time (minute)", type: "number", helper: "0-59, e.g. 0 or 30" },
      { key: "slot_duration_minutes", label: "Meeting Slot Duration (minutes)", type: "number", helper: "Length of each meeting slot" },
      { key: "meeting_hold_minutes", label: "Meeting Hold Duration (minutes)", type: "number", helper: "How long a pending meeting request is held" },
    ],
  },
  {
    title: "Matching Weights",
    description: "Control how the matching algorithm scores user compatibility.",
    icon: "git-compare",
    configKey: "matching_weights",
    fields: [
      { key: "max_interest_points", label: "Max Points from Shared Interests", type: "number" },
      { key: "complementary_role_points", label: "Points for Complementary Roles", type: "number" },
      { key: "same_role_points", label: "Points for Same Role", type: "number" },
      { key: "points_per_group", label: "Points per Shared Group", type: "number" },
      { key: "max_group_points", label: "Max Points from Groups", type: "number" },
      { key: "points_per_session", label: "Points per Shared Session", type: "number" },
      { key: "max_session_points", label: "Max Points from Sessions", type: "number" },
    ],
  },
  {
    title: "Reward Points",
    icon: "trophy",
    configKey: "reward_points",
    fields: [
      { key: "ATTEND_SESSION", label: "Attend Session", type: "number" },
      { key: "ONBOARDING", label: "Complete Onboarding", type: "number" },
      { key: "RATE_SESSION", label: "Rate Session", type: "number" },
      { key: "JOIN_GROUP", label: "Join Group", type: "number" },
      { key: "POLL_VOTE", label: "Vote in Poll", type: "number" },
      { key: "NETWORKING", label: "Networking (DM)", type: "number" },
      { key: "GROUP_CHAT", label: "Group Chat Post", type: "number" },
      { key: "MAP_CHECKIN", label: "Map Check-in", type: "number" },
      { key: "QR_SCAN", label: "QR Scan", type: "number" },
    ],
  },
  {
    title: "DM Daily Limit",
    icon: "chatbubble",
    configKey: "dm_daily_limit",
    fields: [
      { key: "dm_daily_limit", label: "Max DMs Per Day", type: "number" },
    ],
  },
  {
    title: "Density Thresholds",
    icon: "speedometer",
    configKey: "density_thresholds",
    fields: [
      { key: "green", label: "Green (max ratio)", type: "number" },
      { key: "yellow", label: "Yellow (max ratio)", type: "number" },
      { key: "orange", label: "Orange (max ratio)", type: "number" },
    ],
  },
  {
    title: "WiFi Credentials",
    description: "Set the festival WiFi network name and password shown to attendees.",
    icon: "wifi",
    configKey: "wifi_ssid",
    fields: [
      { key: "wifi_ssid", label: "Network name (SSID)", type: "string" },
    ],
  },
  {
    title: "WiFi Password",
    icon: "key",
    configKey: "wifi_password",
    fields: [
      { key: "wifi_password", label: "Password", type: "string" },
    ],
  },
];

const SECTION_TITLE_KEYS: Record<string, string> = {
  "Meeting Scheduling Config": "admin.config.sections.scheduleConfig.title",
  "Matching Weights": "admin.config.sections.matchingWeights.title",
  "Reward Points": "admin.config.sections.rewardPoints.title",
  "DM Daily Limit": "admin.config.sections.dmDailyLimit.title",
  "Density Thresholds": "admin.config.sections.densityThresholds.title",
  "WiFi Credentials": "admin.config.sections.wifiCredentials.title",
  "WiFi Password": "admin.config.sections.wifiPassword.title",
};

const FIELD_LABEL_KEYS: Record<string, string> = {
  festival_start: "admin.config.sections.scheduleConfig.fields.festivalStart",
  festival_end: "admin.config.sections.scheduleConfig.fields.festivalEnd",
  slot_start_hour: "admin.config.sections.scheduleConfig.fields.slotStartHour",
  slot_start_minute: "admin.config.sections.scheduleConfig.fields.slotStartMinute",
  slot_end_hour: "admin.config.sections.scheduleConfig.fields.slotEndHour",
  slot_end_minute: "admin.config.sections.scheduleConfig.fields.slotEndMinute",
  slot_duration_minutes: "admin.config.sections.scheduleConfig.fields.slotDuration",
  meeting_hold_minutes: "admin.config.sections.scheduleConfig.fields.meetingHold",
  max_interest_points: "admin.config.sections.matchingWeights.fields.maxInterestPoints",
  complementary_role_points: "admin.config.sections.matchingWeights.fields.complementaryRolePts",
  same_role_points: "admin.config.sections.matchingWeights.fields.sameRolePoints",
  points_per_group: "admin.config.sections.matchingWeights.fields.pointsPerGroup",
  max_group_points: "admin.config.sections.matchingWeights.fields.maxGroupPoints",
  points_per_session: "admin.config.sections.matchingWeights.fields.pointsPerSession",
  max_session_points: "admin.config.sections.matchingWeights.fields.maxSessionPoints",
  ATTEND_SESSION: "admin.config.sections.rewardPoints.fields.attendSession",
  ONBOARDING: "admin.config.sections.rewardPoints.fields.onboarding",
  RATE_SESSION: "admin.config.sections.rewardPoints.fields.rateSession",
  JOIN_GROUP: "admin.config.sections.rewardPoints.fields.joinGroup",
  POLL_VOTE: "admin.config.sections.rewardPoints.fields.pollVote",
  NETWORKING: "admin.config.sections.rewardPoints.fields.networking",
  GROUP_CHAT: "admin.config.sections.rewardPoints.fields.groupChat",
  MAP_CHECKIN: "admin.config.sections.rewardPoints.fields.mapCheckin",
  QR_SCAN: "admin.config.sections.rewardPoints.fields.qrScan",
  dm_daily_limit: "admin.config.sections.dmDailyLimit.fields.maxDmsPerDay",
  green: "admin.config.sections.densityThresholds.fields.green",
  yellow: "admin.config.sections.densityThresholds.fields.yellow",
  orange: "admin.config.sections.densityThresholds.fields.orange",
  wifi_ssid: "admin.config.sections.wifiCredentials.fields.wifi_ssid",
  wifi_password: "admin.config.sections.wifiPassword.fields.wifi_password",
};

export default function AdminConfigScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const qc = useQueryClient();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data: configData, isLoading } = useQuery({
    queryKey: ["admin", "config"],
    queryFn: getAdminConfig,
  });

  // Initialize local values from server data — expand nested config objects
  useEffect(() => {
    if (configData) {
      const map: Record<string, string> = {};
      for (const entry of configData) {
        if (typeof entry.value === "object" && entry.value !== null) {
          // Nested config (e.g., schedule_config, matching_weights)
          for (const [k, v] of Object.entries(entry.value)) {
            map[k] = String(v ?? "");
          }
        } else {
          map[entry.key] = String(entry.value ?? "");
        }
      }
      setValues(map);
    }
  }, [configData]);

  const toggleSection = useCallback(
    (title: string) => {
      setExpandedSection((prev) => (prev === title ? null : title));
    },
    [],
  );

  const handleSaveSection = useCallback(
    (section: ConfigSection) => {
      // Validate all number fields
      for (const field of section.fields) {
        const raw = values[field.key] ?? "";
        if (field.type === "number") {
          const num = parseFloat(raw);
          if (isNaN(num)) {
            Alert.alert(t("admin.config.alert.validationTitle"), t("admin.config.mustBeNumber", { label: t(FIELD_LABEL_KEYS[field.key] ?? field.label) }));
            return;
          }
        }
      }
      setSavingKey(section.title);
      (async () => {
        try {
          // Build the nested object and save as a single config key
          if (section.fields.length === 1 && section.fields[0].key === section.configKey) {
            // Simple scalar value (e.g., dm_daily_limit)
            const raw = values[section.fields[0].key] ?? "";
            const parsed = section.fields[0].type === "number" ? parseFloat(raw) : raw;
            await setAdminConfig(section.configKey, parsed);
          } else {
            // Nested dict value
            const obj: Record<string, any> = {};
            for (const field of section.fields) {
              const raw = values[field.key] ?? "";
              obj[field.key] = field.type === "number" ? parseFloat(raw) : raw;
            }
            await setAdminConfig(section.configKey, obj);
          }
          qc.invalidateQueries({ queryKey: ["admin", "config"] });
          // Refresh public /config store so consumers (drawer, modals) see updates immediately
          await useConfigStore.getState().fetchAndCacheConfig();
          Alert.alert(t("admin.config.alert.savedTitle"), t("admin.config.alert.savedMessage", { title: t(SECTION_TITLE_KEYS[section.title] ?? section.title) }));
        } catch {
          Alert.alert(t("admin.config.alert.errorTitle"), t("admin.config.alert.errorMessage"));
        } finally {
          setSavingKey(null);
        }
      })();
    },
    [values, qc, t],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("admin.config.title") }} />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
            {CONFIG_SECTIONS.map((section) => {
              const isExpanded = expandedSection === section.title;
              return (
                <View key={section.title} style={styles.sectionCard}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => toggleSection(section.title)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sectionHeaderLeft}>
                      <Ionicons
                        name={section.icon}
                        size={20}
                        color={colors.primary}
                      />
                      <ThemedText style={styles.sectionTitle}>
                        {t(SECTION_TITLE_KEYS[section.title] ?? section.title)}
                      </ThemedText>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.sectionBody}>
                      {section.description && (
                        <ThemedText style={styles.sectionDescription}>
                          {section.description}
                        </ThemedText>
                      )}
                      {section.fields.map((entry) => (
                        <View key={entry.key} style={styles.configRow}>
                          <ThemedText style={styles.configLabel}>
                            {t(FIELD_LABEL_KEYS[entry.key] ?? entry.label)}
                          </ThemedText>
                          {entry.helper && (
                            <ThemedText style={styles.configHelper}>
                              {entry.helper}
                            </ThemedText>
                          )}
                          <TextInput
                            style={styles.configInput}
                            value={values[entry.key] ?? ""}
                            onChangeText={(text) =>
                              setValues((prev) => ({
                                ...prev,
                                [entry.key]: text,
                              }))
                            }
                            keyboardType={
                              entry.type === "number" ? "decimal-pad" : "default"
                            }
                            placeholder={values[entry.key] ? undefined : "Not set"}
                            placeholderTextColor={colors.placeholder}
                          />
                        </View>
                      ))}
                      <TouchableOpacity
                        style={styles.sectionSaveButton}
                        onPress={() => handleSaveSection(section)}
                        disabled={savingKey === section.title}
                      >
                        {savingKey === section.title ? (
                          <ActivityIndicator size="small" color={COLOR_WHITE_ON_ACCENT} />
                        ) : (
                          <ThemedText style={styles.saveButtonText}>
                            {t("admin.config.saveSectionButton", { title: t(SECTION_TITLE_KEYS[section.title] ?? section.title) })}
                          </ThemedText>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 40,
    },
    scrollContent: {
      padding: 16,
    },
    sectionCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 12,
      overflow: "hidden",
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
    },
    sectionHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    sectionBody: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    sectionDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 14,
      lineHeight: 18,
    },
    configRow: {
      marginBottom: 12,
    },
    configLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.label,
      marginBottom: 4,
    },
    configHelper: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    configInput: {
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
    },
    sectionSaveButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 4,
    },
    saveButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
  });
