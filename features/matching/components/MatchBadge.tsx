import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";
import { StyleSheet, View } from "react-native";

export function MatchBadge({ matchScore }: { matchScore: number }) {
  const colors = useColors();

  return (
    <View style={[styles.matchBadge, { backgroundColor: colors.lightBlue }]}>
      <ThemedText style={[styles.matchBadgeText, { color: colors.white }]}>
        {Math.round(matchScore)}% Match
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  matchBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
