import { ThemedText } from "@/components/themed-text";
import type { FestivalDay } from "@/features/scheduling/types";
import { useColors } from "@/hooks/use-colors";
import { Pressable, StyleSheet, View } from "react-native";

type WeekDayPickerProps = {
  days: FestivalDay[];
  selectedDate: number;
  onSelectDate: (date: number) => void;
};

export function WeekDayPicker({
  days,
  selectedDate,
  onSelectDate,
}: WeekDayPickerProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {days.map((day) => {
        const isSelected = day.date === selectedDate;
        return (
          <Pressable
            key={day.date}
            style={[styles.dayItem, isSelected && { backgroundColor: colors.lightBlue }]}
            onPress={() => onSelectDate(day.date)}
          >
            <ThemedText style={[styles.dayLabel, { color: colors.icon }, isSelected && { color: colors.white }]}>
              {day.day_short}
            </ThemedText>
            <ThemedText style={[styles.dateLabel, { color: colors.text }, isSelected && { color: colors.white }]}>
              {day.date}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  dayItem: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 20,
    fontWeight: "700",
  },
});
