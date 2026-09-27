import { ThemedText } from "@/components/themed-text";
import type { MeetingLocationOut } from "@/features/scheduling/types";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

type LocationPickerProps = {
  locations: MeetingLocationOut[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export function LocationPicker({
  locations,
  selectedId,
  onSelect,
}: LocationPickerProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const selected = locations.find((l) => l.id === selectedId);

  return (
    <View style={styles.wrapper}>
      <ThemedText style={[styles.label, { color: colors.icon }]}>{t("networking.schedule.meetingLocation")}</ThemedText>
      <Pressable style={[styles.picker, { borderBottomColor: colors.cardBorder }]} onPress={() => setIsOpen(!isOpen)}>
        <View style={styles.pickerContent}>
          <View style={[styles.dot, { backgroundColor: colors.lightBlue }]} />
          <ThemedText style={[styles.pickerText, { color: colors.text }]}>
            {selected?.name ?? t("networking.schedule.selectLocation")}
          </ThemedText>
        </View>
        <MaterialIcons
          name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={22}
          color={colors.icon}
        />
      </Pressable>
      {isOpen && (
        <View style={[styles.dropdown, { backgroundColor: colors.dropdownBackground }]}>
          {locations.map((location) => {
            const isSelected = location.id === selectedId;
            return (
              <Pressable
                key={location.id}
                style={[styles.option, isSelected && { backgroundColor: colors.selectedBackground }]}
                onPress={() => {
                  onSelect(location.id);
                  setIsOpen(false);
                }}
              >
                <View style={[styles.dot, { backgroundColor: isSelected ? colors.lightBlue : colors.icon }]} />
                <ThemedText
                  style={[
                    styles.optionText,
                    { color: colors.icon },
                    isSelected && { color: colors.text, fontWeight: "500" },
                  ]}
                >
                  {location.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 10,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  pickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pickerText: {
    fontSize: 14,
  },
  wrapper: {
    zIndex: 10,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 10,
    overflow: "hidden",
    zIndex: 20,
    elevation: 5,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionText: {
    fontSize: 14,
  },
});
