import { ThemedText } from "@/components/themed-text";
import type { ScheduleOverlapOut } from "@/features/scheduling/types";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

type ScheduleOverlapBoxProps = {
  overlap: ScheduleOverlapOut;
};

export function ScheduleOverlapBox({ overlap }: ScheduleOverlapBoxProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <MaterialIcons name="event-busy" size={20} color={colors.warning} />
        <ThemedText style={[styles.title, { color: colors.warning }]}>{t("matching.scheduleOverlap.title")}</ThemedText>
      </View>
      <ThemedText style={[styles.description, { color: colors.textMuted }]}>
        You have "{overlap.event_name}" at {overlap.time}. {overlap.person_name} is
        free later:
      </ThemedText>
      <View style={styles.alternatives}>
        {overlap.alternative_times.map((time) => (
          <View key={time} style={[styles.altChip, { backgroundColor: colors.chipBackground }]}>
            <ThemedText style={[styles.altChipText, { color: colors.white }]}>{time}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  alternatives: {
    flexDirection: "row",
    gap: 8,
  },
  altChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  altChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
