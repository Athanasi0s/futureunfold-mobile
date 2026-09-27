import { ThemedText } from "@/components/themed-text";
import type { TimeSlot } from "@/features/scheduling/types";
import { useColors } from "@/hooks/use-colors";
import { Pressable, StyleSheet, View } from "react-native";

type TimeSlotGridProps = {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
};

export function TimeSlotGrid({
  slots,
  selectedTime,
  onSelectTime,
}: TimeSlotGridProps) {
  const colors = useColors();

  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const isSelected = slot.time === selectedTime;
        const isConflict = slot.status === "conflict";
        const isThemOnly = slot.status === "them_only";
        const isGcalBusy = slot.status === "gcal_busy";
        const isDisabled = isConflict || isGcalBusy;

        return (
          <Pressable
            key={slot.time}
            style={[
              styles.slot,
              { borderColor: colors.lightBlue },
              isSelected && { backgroundColor: colors.lightBlue, borderColor: colors.lightBlue },
              isThemOnly && { borderColor: colors.icon, backgroundColor: colors.slotThemOnlyBackground },
              isGcalBusy && { borderColor: colors.warning, backgroundColor: "rgba(234, 179, 8, 0.1)" },
              isConflict && { borderColor: "transparent", backgroundColor: colors.slotConflictBackground },
            ]}
            onPress={() => !isDisabled && onSelectTime(slot.time)}
            disabled={isDisabled}
          >
            <ThemedText
              style={[
                styles.slotTime,
                { color: colors.lightBlue },
                isSelected && { color: colors.white },
                isThemOnly && { color: colors.icon },
                isGcalBusy && { color: colors.warning },
                isConflict && { color: colors.textDisabled },
              ]}
            >
              {slot.time}
            </ThemedText>
            <ThemedText
              style={[
                styles.slotPeriod,
                { color: colors.lightBlue },
                isSelected && { color: colors.white },
                isThemOnly && { color: colors.icon },
                isGcalBusy && { color: colors.warning },
                isConflict && { color: colors.textDisabled },
              ]}
            >
              {isConflict || isGcalBusy ? "BUSY" : slot.period}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slot: {
    width: "30%",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  slotTime: {
    fontSize: 16,
    fontWeight: "600",
  },
  slotPeriod: {
    fontSize: 10,
    marginTop: 2,
  },
});
