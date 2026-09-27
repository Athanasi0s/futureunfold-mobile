import React, { useMemo } from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "react-i18next";
import type { LocationSharingStatus } from "@/api/schemas";
import { useMapStore } from "../stores/map-store";

import { MAP_GROUP_COLORS } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
interface GroupPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  sharingGroups: LocationSharingStatus[];
}

const MAX_GROUPS = 3;

function getGroupColor(groupId: number): string {
  return MAP_GROUP_COLORS[groupId % MAP_GROUP_COLORS.length];
}

export default function GroupPickerSheet({
  visible,
  onClose,
  sharingGroups,
}: GroupPickerSheetProps) {
  const { t } = useTranslation();
  const activeGroupIds = useMapStore((s) => s.activeGroupIds);
  const setActiveGroupIds = useMapStore((s) => s.setActiveGroupIds);
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const toggleGroup = (groupId: number) => {
    if (activeGroupIds.includes(groupId)) {
      setActiveGroupIds(activeGroupIds.filter((id) => id !== groupId));
    } else if (activeGroupIds.length < MAX_GROUPS) {
      setActiveGroupIds([...activeGroupIds, groupId]);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>{t("map.groupPicker.title")}</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {t("map.groupPicker.subtitle", { max: MAX_GROUPS })}
            </ThemedText>
          </View>

          {sharingGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="location-outline"
                size={32}
                color={colors.textSecondary}
              />
              <ThemedText style={styles.emptyText}>
                {t("map.groupPicker.emptyText")}
              </ThemedText>
              <ThemedText style={styles.emptyHint}>
                {t("map.groupPicker.emptyHint")}
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={sharingGroups}
              keyExtractor={(item) => item.group_id.toString()}
              renderItem={({ item }) => {
                const isSelected = activeGroupIds.includes(item.group_id);
                const isDisabled =
                  !isSelected && activeGroupIds.length >= MAX_GROUPS;
                return (
                  <TouchableOpacity
                    style={[styles.groupRow, isDisabled && styles.groupRowDisabled]}
                    onPress={() => toggleGroup(item.group_id)}
                    disabled={isDisabled}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: getGroupColor(item.group_id) },
                      ]}
                    />
                    <ThemedText
                      style={[
                        styles.groupName,
                        isDisabled && styles.groupNameDisabled,
                      ]}
                      numberOfLines={1}
                    >
                      {item.group_title}
                    </ThemedText>
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={22}
                      color={
                        isSelected
                          ? colors.lightBlue
                          : isDisabled
                            ? colors.textSecondary
                            : colors.text
                      }
                    />
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <ThemedText style={styles.doneButtonText}>{t("map.groupPicker.done")}</ThemedText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.gradientStart,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 34,
      maxHeight: "60%",
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 32,
      paddingHorizontal: 20,
      gap: 8,
    },
    emptyText: {
      fontSize: 15,
      color: colors.text,
      textAlign: "center",
    },
    emptyHint: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
    },
    groupRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    groupRowDisabled: {
      opacity: 0.4,
    },
    colorSwatch: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    groupName: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      fontWeight: "500",
    },
    groupNameDisabled: {
      color: colors.textSecondary,
    },
    doneButton: {
      marginHorizontal: 20,
      marginTop: 16,
      backgroundColor: colors.lightBlue,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
  });
