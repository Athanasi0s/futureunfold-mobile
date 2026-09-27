import { useFeatureEnabled, type FeatureFlag } from "@/features/config/hooks/useFeatureEnabled";
import { ThemedText } from "@/components/themed-text";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export function FeatureGate({ flag, children }: { flag: FeatureFlag; children: React.ReactNode }) {
  const enabled = useFeatureEnabled(flag);
  const colors = useColors();

  if (!enabled) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]} accessibilityLabel="Feature unavailable">
        <Ionicons name="lock-closed" size={48} color={colors.textSecondary} />
        <ThemedText style={styles.title}>Feature Unavailable</ThemedText>
        <ThemedText style={styles.subtitle}>
          This feature is currently disabled by the event organizers.
        </ThemedText>
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  title: { fontSize: 20, fontWeight: "600", marginTop: 16 },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 8, opacity: 0.7 },
});
