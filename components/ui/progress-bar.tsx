import { useColors } from "@/hooks/use-colors";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";

type ProgressBarProps = {
  title: string;
  steps: number;
  curStep: number;
};

export function ProgressBar({ title, steps, curStep }: ProgressBarProps) {
  const colors = useColors();
  const progress = steps > 0 ? curStep / steps : 0;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={[styles.stepText, { color: colors.textSecondary }]}>
          Step {curStep} of {steps}
        </ThemedText>
      </ThemedView>
      <View style={[styles.track, { backgroundColor: colors.trackBackground }]}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  stepText: {
    fontSize: 14,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
});
