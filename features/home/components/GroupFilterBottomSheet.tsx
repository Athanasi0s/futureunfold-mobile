import { UserRole } from "@/api/schemas";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useColors } from "@/hooks/use-colors";
import { useGetVenues } from "@/features/home/hooks";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const VISIBLE_SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;
const HANDLE_HEIGHT = 24;


export type GroupFilterState = {
  role: UserRole | null;
  venue: string | null;
};

export const INITIAL_GROUP_FILTER_STATE: GroupFilterState = {
  role: null,
  venue: null,
};

type GroupFilterBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: GroupFilterState) => void;
  activeFilters: GroupFilterState;
};

export function GroupFilterBottomSheet({
  visible,
  onClose,
  onApply,
  activeFilters,
}: GroupFilterBottomSheetProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<GroupFilterState>(activeFilters);
  const { data: venues, isLoading: isLoadingVenues } = useGetVenues();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const ROLE_LABELS: Partial<Record<UserRole, string>> = {
    [UserRole.attendee]: t("matching.filterSheet.roleAttendee"),
    [UserRole.speaker]: t("matching.filterSheet.roleSpeaker"),
    [UserRole.exhibitor]: t("matching.filterSheet.roleExhibitor"),
    [UserRole.admin]: t("matching.filterSheet.roleAdmin"),
  };

  useEffect(() => {
    if (visible) setFilters(activeFilters);
  }, [visible]);

  const handleRolePress = (role: UserRole) => {
    setFilters((prev) => ({
      ...prev,
      role: prev.role === role ? null : role,
    }));
  };

  const handleVenuePress = (venueKey: string) => {
    setFilters((prev) => ({
      ...prev,
      venue: prev.venue === venueKey ? null : venueKey,
    }));
  };

  const handleReset = () => {
    setFilters(INITIAL_GROUP_FILTER_STATE);
    onApply(INITIAL_GROUP_FILTER_STATE);
  };

  const handleApply = () => {
    onApply(filters);
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
        <Pressable onPress={onClose} hitSlop={8}>
          <ThemedText style={styles.cancelText}>{t("home.groupFilter.cancel")}</ThemedText>
        </Pressable>
        <ThemedText style={styles.headerTitle}>{t("home.groupFilter.title")}</ThemedText>
        <Pressable onPress={handleReset} hitSlop={8}>
          <ThemedText style={styles.resetText}>{t("home.groupFilter.reset")}</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ROLE */}
        <ThemedText style={styles.sectionTitle}>{t("home.groupFilter.roleSection")}</ThemedText>
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

        {/* VENUE */}
        <ThemedText style={styles.sectionTitle}>{t("home.groupFilter.venueSection")}</ThemedText>
        {isLoadingVenues ? (
          <ActivityIndicator size="small" style={{ paddingVertical: 12 }} />
        ) : (
          <View style={styles.venueList}>
            {(venues ?? []).map((venue) => {
              const isSelected = filters.venue === venue.key;
              return (
                <Pressable
                  key={venue.id}
                  style={[
                    styles.venueItem,
                    isSelected && styles.venueItemActive,
                  ]}
                  onPress={() => handleVenuePress(venue.key)}
                >
                  <ThemedText
                    style={[
                      styles.venueText,
                      isSelected && styles.venueTextActive,
                    ]}
                  >
                    {venue.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable style={styles.applyButton} onPress={handleApply}>
          <ThemedText style={styles.applyButtonText}>{t("home.groupFilter.applyFilters")}</ThemedText>
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
    venueList: {
      gap: 8,
    },
    venueItem: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    venueItemActive: {
      borderColor: colors.lightBlue,
      backgroundColor: colors.selectedBackground,
    },
    venueText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    venueTextActive: {
      color: colors.text,
      fontWeight: "500",
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
