import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";
import { Pressable, StyleSheet, View } from "react-native";

type CalendarHeaderProps = {
  monthLabel: string;
  linkText?: string;
  onLinkPress?: () => void;
};

export function CalendarHeader({
  monthLabel,
  linkText = "Festival Days",
  onLinkPress,
}: CalendarHeaderProps) {
  const colors = useColors();

  return (
    <View style={styles.calendarHeader}>
      <ThemedText style={[styles.monthLabel, { color: colors.icon }]}>
        {monthLabel}
      </ThemedText>
      {linkText && (
        <Pressable onPress={onLinkPress}>
          <ThemedText style={[styles.festivalDaysLink, { color: colors.lightBlue }]}>
            {linkText}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  festivalDaysLink: {
    fontSize: 12,
    fontWeight: "500",
  },
});
