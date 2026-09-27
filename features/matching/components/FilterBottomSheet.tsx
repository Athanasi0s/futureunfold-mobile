import { UserRole } from "@/api/schemas";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useColors } from "@/hooks/use-colors";
import { useGetAvailableInterests } from "@/features/onboarding/hooks/useGetAvailableInterests";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const VISIBLE_SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;
const HANDLE_HEIGHT = 24;


export type FilterState = {
  role: UserRole | null;
  interests: string[];
  availableForMeetings: boolean;
};

export const INITIAL_FILTER_STATE: FilterState = {
  role: null,
  interests: [],
  availableForMeetings: false,
};

type FilterBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  activeFilters: FilterState;
};

export function FilterBottomSheet({
  visible,
  onClose,
  onApply,
  activeFilters,
}: FilterBottomSheetProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FilterState>(activeFilters);
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const ROLE_LABELS: Partial<Record<UserRole, string>> = {
    [UserRole.attendee]: t("matching.filterSheet.roleAttendee"),
    [UserRole.speaker]: t("matching.filterSheet.roleSpeaker"),
    [UserRole.exhibitor]: t("matching.filterSheet.roleExhibitor"),
    [UserRole.admin]: t("matching.filterSheet.roleAdmin"),
  };

  // Sync local state when the sheet opens
  useEffect(() => {
    if (visible) setFilters(activeFilters);
  }, [visible]);

  const { data: availableInterests, isLoading: isLoadingInterests } =
    useGetAvailableInterests();

  const handleRolePress = (role: UserRole) => {
    setFilters((prev) => ({
      ...prev,
      role: prev.role === role ? null : role,
    }));
  };

  const handleInterestPress = (interest: string) => {
    setFilters((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTER_STATE);
    onApply(INITIAL_FILTER_STATE);
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      showCloseButton={false}
      contentStyle={{ maxHeight: VISIBLE_SHEET_HEIGHT - HANDLE_HEIGHT }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleCancel} hitSlop={8}>
          <ThemedText style={styles.cancelText}>{t("matching.filterSheet.cancel")}</ThemedText>
        </Pressable>
        <ThemedText style={styles.headerTitle}>{t("matching.filterSheet.title")}</ThemedText>
        <Pressable onPress={handleReset} hitSlop={8}>
          <ThemedText style={styles.resetText}>{t("matching.filterSheet.reset")}</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ROLE */}
        <ThemedText style={styles.sectionTitle}>{t("matching.filterSheet.roleSection")}</ThemedText>
        <View style={styles.chipsContainer}>
          {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
            const isActive = filters.role === role;
            return (
              <Pressable
                key={role}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => handleRolePress(role)}
              >
                <ThemedText
                  style={[styles.chipText, isActive && styles.chipTextActive]}
                >
                  {ROLE_LABELS[role]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* INTERESTS */}
        <ThemedText style={styles.sectionTitle}>{t("matching.filterSheet.interestsSection")}</ThemedText>
        {isLoadingInterests ? (
          <ActivityIndicator size="small" style={{ paddingVertical: 12 }} />
        ) : (
          <View style={styles.interestsGrid}>
            {(availableInterests ?? []).map((interest) => {
              const isSelected = filters.interests.includes(interest.name);
              return (
                <Pressable
                  key={interest.id}
                  style={[
                    styles.interestCard,
                    isSelected && styles.interestCardActive,
                  ]}
                  onPress={() => handleInterestPress(interest.name)}
                >
                  <MaterialIcons
                    name={
                      isSelected ? "check-box" : "check-box-outline-blank"
                    }
                    size={20}
                    color={
                      isSelected
                        ? colors.lightBlue
                        : colors.textSecondary
                    }
                  />
                  <ThemedText
                    style={[
                      styles.interestText,
                      isSelected && styles.interestTextActive,
                    ]}
                  >
                    {interest.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* AVAILABILITY */}
        <ThemedText style={styles.sectionTitle}>{t("matching.filterSheet.availabilitySection")}</ThemedText>
        <View style={styles.toggleRow}>
          <ThemedText style={styles.toggleLabel}>{t("matching.filterSheet.availableForMeetings")}</ThemedText>
          <Switch
            value={filters.availableForMeetings}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, availableForMeetings: value }))
            }
            trackColor={{
              false: colors.switchTrackOff,
              true: colors.lightBlue,
            }}
            thumbColor={colors.white}
          />
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable style={styles.applyButton} onPress={handleApply}>
          <ThemedText style={styles.applyButtonText}>{t("matching.filterSheet.applyFilters")}</ThemedText>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cancelText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
    },
    resetText: {
      fontSize: 15,
      color: colors.lightBlue,
      fontWeight: "500",
    },
    scrollContent: {
      paddingBottom: 16,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: 1,
      marginTop: 20,
      marginBottom: 12,
    },
    chipsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.lightBlue,
      borderColor: colors.lightBlue,
    },
    chipText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.white,
      fontWeight: "500",
    },
    interestsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    interestCard: {
      width: "48%",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    interestCardActive: {
      borderColor: colors.lightBlue,
      backgroundColor: colors.selectedBackground,
    },
    interestText: {
      fontSize: 13,
      color: colors.textSecondary,
      flexShrink: 1,
    },
    interestTextActive: {
      color: colors.text,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    toggleLabel: {
      fontSize: 15,
      color: colors.text,
    },
    footer: {
      paddingTop: 12,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    applyButton: {
      backgroundColor: colors.lightBlue,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    applyButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.white,
    },
  });
