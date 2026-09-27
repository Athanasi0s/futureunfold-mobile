import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import React from "react";
import { ThemedText } from "@/components/themed-text";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

interface DateItem {
  date: string; // ISO date string (YYYY-MM-DD)
  label: string; // Display label like "Mon 12"
}

interface DateScrollerProps {
  dates: DateItem[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function DateScroller({
  dates,
  selectedDate,
  onSelectDate,
}: DateScrollerProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const unselectedBg = colors.chipBackground;
  const unselectedText = colors.label;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {dates.map((item) => {
        const isSelected = item.date === selectedDate;
        return (
          <TouchableOpacity
            key={item.date}
            style={[
              styles.dateChip,
              {
                backgroundColor: isSelected ? colors.brand : unselectedBg,
              },
              isSelected && styles.dateChipSelected,
            ]}
            onPress={() => onSelectDate(item.date)}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[
                styles.dateText,
                {
                  color: isSelected ? COLOR_WHITE_ON_ACCENT : unselectedText,
                  fontWeight: isSelected ? "700" : "500",
                },
              ]}
            >
              {item.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// Helper function to generate date labels
export function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  return `${dayName} ${dayNum}`;
}

// Helper to extract unique dates from sessions
export function extractUniqueDates(
  sessions: { start_time: string }[],
): DateItem[] {
  const dateSet = new Set<string>();

  sessions.forEach((session) => {
    const date = session.start_time.split("T")[0];
    dateSet.add(date);
  });

  return Array.from(dateSet)
    .sort()
    .map((date) => ({
      date,
      label: formatDateLabel(date),
    }));
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dateChip: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dateChipSelected: {
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dateText: {
    fontSize: 14,
  },
});
