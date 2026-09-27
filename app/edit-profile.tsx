import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { usePatchMe } from "@/features/authentication/hooks/usePatchMe";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
export default function EditProfileScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const { mutate: patchMe, isPending } = usePatchMe();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url ?? "");
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(user?.date_of_birth ?? null);
  const [gender, setGender] = useState<"male" | "female" | "prefer_not_to_say" | null>(
    (user?.gender as "male" | "female" | "prefer_not_to_say" | null) ?? null
  );
  const [showDobPicker, setShowDobPicker] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setBio(user.bio ?? "");
      setCompany(user.company ?? "");
      setLinkedinUrl(user.linkedin_url ?? "");
      setDateOfBirth(user.date_of_birth ?? null);
      setGender((user.gender as "male" | "female" | "prefer_not_to_say" | null) ?? null);
    }
  }, [user]);

  const handleSave = () => {
    patchMe(
      {
        full_name: fullName,
        bio,
        company,
        linkedin_url: linkedinUrl,
        date_of_birth: dateOfBirth,
        gender: gender,
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: () => {
          Alert.alert("Error", "Failed to save profile. Please try again.");
        },
      }
    );
  };

  const formatDobDisplay = (dob: string) => {
    const parts = dob.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dob;
  };

  const genderLabels: Record<string, string> = {
    male: "Male",
    female: "Female",
    prefer_not_to_say: "Prefer not to say",
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Edit Profile",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isPending}
              style={styles.headerSave}
            >
              <ThemedText style={[styles.saveText, isPending && styles.saveTextDim]}>
                {isPending ? "Saving..." : "Save"}
              </ThemedText>
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Full Name</ThemedText>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Bio */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Bio</ThemedText>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about yourself"
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Company */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Company</ThemedText>
            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
              placeholder="Your company or organization"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* LinkedIn URL */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>LinkedIn URL</ThemedText>
            <View style={styles.socialRow}>
              <Ionicons name="logo-linkedin" size={18} color={colors.link} />
              <TextInput
                style={styles.socialInput}
                value={linkedinUrl}
                onChangeText={setLinkedinUrl}
                placeholder="https://linkedin.com/in/yourprofile"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          {/* Demographics Section */}
          <ThemedText style={styles.sectionHeading}>Demographics (optional)</ThemedText>

          {/* Date of Birth */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Date of Birth</ThemedText>
            <TouchableOpacity
              style={styles.dobButton}
              onPress={() => setShowDobPicker(true)}
              activeOpacity={0.7}
            >
              <ThemedText style={dateOfBirth ? styles.dobValueText : styles.dobPlaceholderText}>
                {dateOfBirth ? formatDobDisplay(dateOfBirth) : "Select date"}
              </ThemedText>
            </TouchableOpacity>
            {showDobPicker && (
              <DateTimePicker
                value={dateOfBirth ? new Date(dateOfBirth) : new Date(1990, 0, 1)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDobPicker(Platform.OS === "ios");
                  if (event.type === "set" && selectedDate) {
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
                    const day = String(selectedDate.getDate()).padStart(2, "0");
                    setDateOfBirth(`${year}-${month}-${day}`);
                  }
                }}
              />
            )}
            {dateOfBirth ? (
              <TouchableOpacity onPress={() => setDateOfBirth(null)}>
                <ThemedText style={styles.clearText}>Clear</ThemedText>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Gender */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Gender</ThemedText>
            <View style={styles.genderChipsRow}>
              {(["male", "female", "prefer_not_to_say"] as const).map((genderOption) => {
                const isSelected = gender === genderOption;
                return (
                  <TouchableOpacity
                    key={genderOption}
                    style={[styles.genderChip, isSelected && styles.genderChipSelected]}
                    onPress={() => setGender(isSelected ? null : genderOption)}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <ThemedText style={[styles.genderChipText, isSelected && styles.genderChipTextSelected]}>
                      {genderLabels[genderOption]}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isPending && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isPending}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.saveButtonText}>
              {isPending ? "Saving..." : "Save Changes"}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
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
    scrollContent: {
      padding: 16,
      gap: 16,
    },
    headerBack: {
      paddingHorizontal: 4,
    },
    headerSave: {
      paddingHorizontal: 4,
    },
    saveText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
    },
    saveTextDim: {
      opacity: 0.5,
    },
    fieldGroup: {
      gap: 6,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.text,
    },
    bioInput: {
      height: 100,
      paddingTop: 13,
    },
    socialRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 2,
      gap: 10,
    },
    socialInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 13,
    },
    sectionHeading: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginTop: 8,
    },
    dobButton: {
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    dobValueText: {
      fontSize: 15,
      color: colors.text,
    },
    dobPlaceholderText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    clearText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    genderChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    genderChip: {
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    genderChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "20",
    },
    genderChipText: {
      fontSize: 13,
      color: colors.text,
    },
    genderChipTextSelected: {
      color: colors.primary,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
  });
