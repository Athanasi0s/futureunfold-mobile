import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";
import { StyleSheet, View } from "react-native";

type LegendItem = {
  label: string;
  colorKey: "success" | "icon" | "error" | "warning";
};

const legendItems: LegendItem[] = [
  { label: "MUTUAL FREE", colorKey: "success" },
  { label: "THEM ONLY", colorKey: "icon" },
  { label: "MY CALENDAR", colorKey: "warning" },
  { label: "CONFLICT", colorKey: "error" },
];

export function Legend() {
  const colors = useColors();

  return (
    <View style={styles.legend}>
      {legendItems.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors[item.colorKey] }]} />
          <ThemedText style={[styles.legendText, { color: colors.icon }]}>
            {item.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 20,
    marginBottom: 18,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
