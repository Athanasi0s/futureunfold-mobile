import { useColors } from "@/hooks/use-colors";
import { getApiBaseUrl } from "@/api/base-url";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
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
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { uploadFile } from "@/api/features/upload";
import { useConfigStore } from "@/features/config/stores/config-store";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { CERTIFICATE_PALETTE, CERTIFICATE_DEFAULTS } from "@/constants/data-colors";
const DEFAULT_TEMPLATE = {
  version: 1,
  festival_name: "",                   // populated at runtime from the tenant's appName (see buildDefaultTemplate)
  tagline: "Innovation Meets Tradition",
  logo_url: "",
  primary_color: CERTIFICATE_DEFAULTS.primary,
  secondary_color: CERTIFICATE_DEFAULTS.secondary,
  accent_color: CERTIFICATE_DEFAULTS.accent,
  background_gradient: [CERTIFICATE_DEFAULTS.gradientStart, CERTIFICATE_DEFAULTS.gradientEnd],
  border_color: CERTIFICATE_DEFAULTS.border,
  orientation: "landscape" as "landscape" | "portrait",
  milestone_titles: {} as Record<string, string>,
};

const MILESTONE_CATEGORIES: { key: string; defaultLabel: string; icon: string; description: string }[] = [
  { key: "session_explorer", defaultLabel: "Session Explorer", icon: "calendar-outline", description: "Number of sessions added to agenda" },
  { key: "social_butterfly", defaultLabel: "Social Butterfly", icon: "qr-code-outline", description: "Number of QR codes scanned" },
  { key: "network_builder", defaultLabel: "Network Builder", icon: "people-outline", description: "Number of groups joined" },
  { key: "community_leader", defaultLabel: "Community Leader", icon: "chatbubbles-outline", description: "Group chat + direct messages sent" },
  { key: "meeting_master", defaultLabel: "Meeting Master", icon: "handshake-outline", description: "Number of confirmed 1:1 meetings" },
  { key: "early_bird", defaultLabel: "Early Bird", icon: "sunny-outline", description: "Engagement on day 1 of the festival" },
  { key: "poll_champion", defaultLabel: "Poll Champion", icon: "bar-chart-outline", description: "Number of polls voted on" },
  { key: "festival_veteran", defaultLabel: "Festival Veteran", icon: "trophy-outline", description: "Total reward points earned" },
  { key: "curious_mind", defaultLabel: "Curious Mind", icon: "bulb-outline", description: "Distinct session types attended" },
  { key: "team_player", defaultLabel: "Team Player", icon: "megaphone-outline", description: "Groups where user sent 3+ messages" },
];

type FieldDef = {
  key: string;
  label: string;
  type: "string" | "number" | "color";
  placeholder?: string;
};

const FIELDS: FieldDef[] = [
  { key: "festival_name", label: "Festival Name", type: "string", placeholder: "Festival 2026" },
  { key: "tagline", label: "Tagline", type: "string", placeholder: "Innovation Meets Tradition" },
  { key: "primary_color", label: "Primary Color", type: "color", placeholder: CERTIFICATE_DEFAULTS.primary },
  { key: "secondary_color", label: "Secondary Color", type: "color", placeholder: CERTIFICATE_DEFAULTS.secondary },
  { key: "accent_color", label: "Accent Color", type: "color", placeholder: CERTIFICATE_DEFAULTS.accent },
  { key: "border_color", label: "Border Color", type: "color", placeholder: CERTIFICATE_DEFAULTS.border },
];

const FIELD_LABEL_KEYS: Record<string, string> = {
  festival_name: "admin.certificate.fields.festivalName",
  tagline: "admin.certificate.fields.tagline",
  primary_color: "admin.certificate.fields.primaryColor",
  secondary_color: "admin.certificate.fields.secondaryColor",
  accent_color: "admin.certificate.fields.accentColor",
  border_color: "admin.certificate.fields.borderColor",
};

const HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const COLOR_PALETTE = CERTIFICATE_PALETTE;

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const colors = useColors();
  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {COLOR_PALETTE.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => onChange(c)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: c,
              borderWidth: value === c ? 3 : 1,
              borderColor: value === c ? colors.primary : "rgba(128,128,128,0.3)",
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: HEX_REGEX.test(value) ? value : CERTIFICATE_DEFAULTS.placeholderBg,
            borderWidth: 1,
            borderColor: "rgba(128,128,128,0.3)",
          }}
        />
        <TextInput
          style={{
            flex: 1,
            backgroundColor: colors.inputBackground,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 14,
            color: colors.text,
          }}
          value={value}
          onChangeText={onChange}
          placeholder={CERTIFICATE_DEFAULTS.placeholderText}
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

export default function AdminCertificateScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const qc = useQueryClient();

  const appName = useConfigStore((s) => s.appName);
  const defaultFestivalName = `${appName} 2026`;

  const [values, setValues] = useState<Record<string, string>>({});
  const [gradientStart, setGradientStart] = useState("");
  const [gradientEnd, setGradientEnd] = useState("");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [milestoneTitles, setMilestoneTitles] = useState<Record<string, string>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data: configData, isLoading } = useQuery({
    queryKey: ["admin", "config"],
    queryFn: getAdminConfig,
  });

  useEffect(() => {
    if (!configData) return;
    const entry = configData.find((e) => e.key === "certificate_template");
    const tmpl = (entry?.value as Record<string, unknown>) ?? DEFAULT_TEMPLATE;

    const map: Record<string, string> = {};
    for (const field of FIELDS) {
      map[field.key] = String((tmpl[field.key] as string) ?? "");
    }
    map["version"] = String(tmpl.version ?? 1);
    map["logo_url"] = String((tmpl["logo_url"] as string) ?? "");
    setValues(map);

    const grad = (tmpl.background_gradient as string[]) ?? DEFAULT_TEMPLATE.background_gradient;
    setGradientStart(grad[0] ?? CERTIFICATE_DEFAULTS.gradientStart);
    setGradientEnd(grad[1] ?? CERTIFICATE_DEFAULTS.gradientEnd);

    setOrientation((tmpl.orientation as "landscape" | "portrait") ?? "landscape");
    setMilestoneTitles((tmpl.milestone_titles as Record<string, string>) ?? {});
  }, [configData]);

  const handlePickLogo = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please grant access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingLogo(true);
    try {
      const uploaded = await uploadFile(
        asset.uri,
        asset.fileName || "logo.png",
        asset.mimeType || "image/png",
      );
      setValues((prev) => ({ ...prev, logo_url: uploaded.url }));
    } catch {
      Alert.alert("Upload failed", "Could not upload logo image.");
    } finally {
      setUploadingLogo(false);
    }
  }, []);

  const handleSave = useCallback(
    async (bumpVersion: boolean) => {
      // Validate color fields
      const fieldLabelKeys: Record<string, string> = {
        festival_name: t("admin.certificate.fields.festivalName"),
        tagline: t("admin.certificate.fields.tagline"),
        primary_color: t("admin.certificate.fields.primaryColor"),
        secondary_color: t("admin.certificate.fields.secondaryColor"),
        accent_color: t("admin.certificate.fields.accentColor"),
        border_color: t("admin.certificate.fields.borderColor"),
      };
      for (const field of FIELDS) {
        if (field.type === "color") {
          const val = values[field.key] ?? "";
          if (val && !HEX_REGEX.test(val)) {
            Alert.alert(t("admin.certificate.alert.validationTitle"), t("admin.certificate.alert.colorError", { label: fieldLabelKeys[field.key] ?? field.label }));
            return;
          }
        }
      }
      if (gradientStart && !HEX_REGEX.test(gradientStart)) {
        Alert.alert(t("admin.certificate.alert.validationTitle"), t("admin.certificate.alert.gradientStartError"));
        return;
      }
      if (gradientEnd && !HEX_REGEX.test(gradientEnd)) {
        Alert.alert(t("admin.certificate.alert.validationTitle"), t("admin.certificate.alert.gradientEndError"));
        return;
      }

      setSaving(true);
      try {
        const currentVersion = parseInt(values.version ?? "1", 10);
        const obj: Record<string, unknown> = {
          version: bumpVersion ? currentVersion + 1 : currentVersion,
          festival_name: values.festival_name || defaultFestivalName,
          tagline: values.tagline || DEFAULT_TEMPLATE.tagline,
          logo_url: values.logo_url || null,
          primary_color: values.primary_color || DEFAULT_TEMPLATE.primary_color,
          secondary_color: values.secondary_color || DEFAULT_TEMPLATE.secondary_color,
          accent_color: values.accent_color || DEFAULT_TEMPLATE.accent_color,
          background_gradient: [
            gradientStart || DEFAULT_TEMPLATE.background_gradient[0],
            gradientEnd || DEFAULT_TEMPLATE.background_gradient[1],
          ],
          border_color: values.border_color || DEFAULT_TEMPLATE.border_color,
          orientation: orientation,
          milestone_titles: Object.fromEntries(
            Object.entries(milestoneTitles).filter(([k, v]) => {
              const trimmed = v.trim();
              if (trimmed === "") return false;
              const def = MILESTONE_CATEGORIES.find((c) => c.key === k)?.defaultLabel;
              return trimmed !== def;
            })
          ),
        };

        await setAdminConfig("certificate_template", obj);
        qc.invalidateQueries({ queryKey: ["admin", "config"] });
        qc.invalidateQueries({ queryKey: ["certificate-data"] });

        if (bumpVersion) {
          setValues((prev) => ({ ...prev, version: String(currentVersion + 1) }));
        }

        Alert.alert(
          t("admin.certificate.alert.savedTitle"),
          bumpVersion
            ? t("admin.certificate.alert.savedBumpedMessage", { version: currentVersion + 1 })
            : t("admin.certificate.alert.savedKeptMessage"),
        );
      } catch {
        Alert.alert(t("admin.certificate.alert.errorTitle"), t("admin.certificate.alert.errorMessage"));
      } finally {
        setSaving(false);
      }
    },
    [values, gradientStart, gradientEnd, orientation, milestoneTitles, qc, t, defaultFestivalName],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("admin.certificate.title") }} />
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
            {/* Preview */}
            <View style={styles.previewCard}>
              <ThemedText style={styles.previewLabel}>{t("admin.certificate.previewLabel")}</ThemedText>
              <View style={[styles.previewContainer, { height: orientation === "portrait" ? 220 : 160 }]}>
                <LinearGradient
                  colors={[
                    HEX_REGEX.test(gradientStart) ? gradientStart : CERTIFICATE_DEFAULTS.gradientStart,
                    HEX_REGEX.test(gradientEnd) ? gradientEnd : CERTIFICATE_DEFAULTS.gradientEnd,
                  ]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View
                  style={[
                    styles.previewBorder,
                    {
                      borderColor: HEX_REGEX.test(values.border_color ?? "")
                        ? values.border_color
                        : CERTIFICATE_DEFAULTS.disabledSurface,
                    },
                  ]}
                >
                  {values.logo_url ? (
                    <Image
                      source={{
                        uri: values.logo_url.startsWith("/")
                          ? `${getApiBaseUrl()}${values.logo_url}`
                          : values.logo_url,
                      }}
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        width: 36,
                        height: 36,
                        borderRadius: 6,
                      }}
                      contentFit="contain"
                    />
                  ) : null}
                  <ThemedText
                    style={[
                      styles.previewFestivalName,
                      {
                        color: HEX_REGEX.test(values.primary_color ?? "")
                          ? values.primary_color
                          : colors.brand,
                      },
                    ]}
                  >
                    {values.festival_name || t("admin.certificate.previewFestivalNameFallback")}
                  </ThemedText>
                  <ThemedText style={[styles.previewTagline, {
                    color: HEX_REGEX.test(values.secondary_color ?? "") ? values.secondary_color : "rgba(0,0,0,0.5)",
                  }]}>
                    {values.tagline || t("admin.certificate.previewTaglineFallback")}
                  </ThemedText>
                  <ThemedText style={[styles.previewCert, {
                    color: HEX_REGEX.test(values.secondary_color ?? "") ? `${values.secondary_color}99` : "rgba(0,0,0,0.4)",
                  }]}>{t("admin.certificate.previewCertText")}</ThemedText>
                  <ThemedText style={styles.previewUserName}>{t("admin.certificate.previewUserName")}</ThemedText>
                  <View
                    style={[
                      styles.previewMilestone,
                      {
                        borderColor: HEX_REGEX.test(values.accent_color ?? "")
                          ? `${values.accent_color}40`
                          : CERTIFICATE_DEFAULTS.milestoneUnlockedFill,
                      },
                    ]}
                  >
                    <Ionicons
                      name="trophy-outline"
                      size={12}
                      color={
                        HEX_REGEX.test(values.accent_color ?? "")
                          ? values.accent_color
                          : CERTIFICATE_DEFAULTS.milestoneUnlockedText
                      }
                    />
                    <ThemedText style={styles.previewMilestoneText}>
                      {t("admin.certificate.previewTopMilestone")}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Version info */}
            <View style={styles.versionCard}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <ThemedText style={styles.versionText}>
                Current version: <ThemedText style={styles.versionBold}>v{values.version ?? "1"}</ThemedText>
                {"\n"}Bump version to force all users to regenerate their cached certificates.
              </ThemedText>
            </View>

            {/* Logo Upload */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="image" size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>Certificate Logo</ThemedText>
              </View>
              {values.logo_url ? (
                <View style={{ alignItems: "center", marginBottom: 12 }}>
                  <Image
                    source={{ uri: values.logo_url.startsWith("/") ? `${getApiBaseUrl()}${values.logo_url}` : values.logo_url }}
                    style={{ width: 120, height: 120, borderRadius: 12 }}
                    contentFit="contain"
                  />
                </View>
              ) : null}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.textSecondary }]}
                onPress={handlePickLogo}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <ActivityIndicator size="small" color={COLOR_WHITE_ON_ACCENT} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={16} color={COLOR_WHITE_ON_ACCENT} />
                    <ThemedText style={styles.saveButtonText}>
                      {values.logo_url ? "Change Logo" : "Upload Logo"}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Orientation Toggle */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="resize-outline" size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>Orientation</ThemedText>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["landscape", "portrait"] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setOrientation(opt)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: orientation === opt ? colors.primary : colors.cardBorder,
                      backgroundColor: orientation === opt ? `${colors.primary}15` : colors.cardBackground,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name={opt === "landscape" ? "tablet-landscape-outline" : "tablet-portrait-outline"}
                      size={24}
                      color={orientation === opt ? colors.primary : colors.textSecondary}
                    />
                    <ThemedText style={{ fontSize: 13, fontWeight: "600", color: orientation === opt ? colors.primary : colors.textSecondary, marginTop: 4 }}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Fields */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="text" size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>{t("admin.certificate.sections.text")}</ThemedText>
              </View>
              {FIELDS.filter((f) => f.type === "string").map((field) => (
                <View key={field.key} style={styles.configRow}>
                  <ThemedText style={styles.configLabel}>{t(FIELD_LABEL_KEYS[field.key] ?? field.label)}</ThemedText>
                  <TextInput
                    style={styles.configInput}
                    value={values[field.key] ?? ""}
                    onChangeText={(text) =>
                      setValues((prev) => ({ ...prev, [field.key]: text }))
                    }
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="color-palette" size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>{t("admin.certificate.sections.colors")}</ThemedText>
              </View>
              {FIELDS.filter((f) => f.type === "color").map((field) => (
                <View key={field.key} style={styles.configRow}>
                  <ThemedText style={styles.configLabel}>{t(FIELD_LABEL_KEYS[field.key] ?? field.label)}</ThemedText>
                  <ColorPicker
                    value={values[field.key] ?? ""}
                    onChange={(text) =>
                      setValues((prev) => ({ ...prev, [field.key]: text }))
                    }
                  />
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="color-filter" size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>{t("admin.certificate.sections.backgroundGradient")}</ThemedText>
              </View>
              <View style={styles.configRow}>
                <ThemedText style={styles.configLabel}>{t("admin.certificate.fields.gradientStart")}</ThemedText>
                <ColorPicker value={gradientStart} onChange={setGradientStart} />
              </View>
              <View style={styles.configRow}>
                <ThemedText style={styles.configLabel}>{t("admin.certificate.fields.gradientEnd")}</ThemedText>
                <ColorPicker value={gradientEnd} onChange={setGradientEnd} />
              </View>
            </View>

            {/* Milestone Titles Editor */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trophy" size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>Milestone Titles</ThemedText>
              </View>
              <ThemedText style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
                Customize category titles shown on certificates. Leave blank to use defaults.
              </ThemedText>
              {MILESTONE_CATEGORIES.map((cat) => (
                <View key={cat.key} style={styles.configRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <Ionicons name={cat.icon as any} size={16} color={colors.primary} />
                    <ThemedText style={styles.configLabel}>{cat.defaultLabel}</ThemedText>
                  </View>
                  <ThemedText style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6, fontStyle: "italic" }}>
                    {cat.description}
                  </ThemedText>
                  <TextInput
                    style={styles.configInput}
                    value={milestoneTitles[cat.key] ?? cat.defaultLabel}
                    onChangeText={(text) =>
                      setMilestoneTitles((prev) => ({ ...prev, [cat.key]: text }))
                    }
                    placeholder={cat.defaultLabel}
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
              ))}
            </View>

            {/* Save buttons */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLOR_WHITE_ON_ACCENT} />
              ) : (
                <ThemedText style={styles.saveButtonText}>{t("admin.certificate.saveKeepVersion")}</ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, styles.bumpButton]}
              onPress={() => {
                Alert.alert(
                  t("admin.certificate.alert.bumpTitle"),
                  t("admin.certificate.alert.bumpMessage"),
                  [
                    { text: t("admin.certificate.alert.bumpCancel"), style: "cancel" },
                    { text: t("admin.certificate.alert.bumpConfirm"), onPress: () => handleSave(true) },
                  ],
                );
              }}
              disabled={saving}
            >
              <Ionicons name="refresh" size={16} color={COLOR_WHITE_ON_ACCENT} />
              <ThemedText style={styles.saveButtonText}>
                {t("admin.certificate.saveBumpVersion", { version: parseInt(values.version ?? "1", 10) + 1 })}
              </ThemedText>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
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

    // Preview
    previewCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
      marginBottom: 12,
    },
    previewLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    previewContainer: {
      borderRadius: 12,
      overflow: "hidden",
    },
    previewBorder: {
      flex: 1,
      margin: 6,
      borderWidth: 2,
      borderRadius: 10,
      padding: 12,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    previewFestivalName: {
      fontSize: 16,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    previewTagline: {
      fontSize: 9,
      color: "rgba(0,0,0,0.5)",
    },
    previewCert: {
      fontSize: 8,
      color: "rgba(0,0,0,0.4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginTop: 6,
    },
    previewUserName: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.background,
    },
    previewMilestone: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(0,0,0,0.04)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 4,
      borderWidth: 1,
    },
    previewMilestoneText: {
      fontSize: 9,
      color: colors.background,
      fontWeight: "600",
    },

    // Version
    versionCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: `${colors.primary}15`,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
    },
    versionText: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    versionBold: {
      fontWeight: "800",
      color: colors.primary,
    },

    // Sections
    sectionCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
      marginBottom: 12,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    configRow: {
      marginBottom: 12,
    },
    configLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.label,
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
    colorInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    // Save
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 10,
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    bumpButton: {
      backgroundColor: colors.warning,
    },
    saveButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
  });
