import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";
import { StyleSheet, View } from "react-native";

export function InterestLabel({ interest }: { interest: string }) {
  const colors = useColors();

  return (
    <View style={[styles.interestLabel, { backgroundColor: colors.lightBlue }]}>
      <ThemedText style={[styles.interestLabelText, { color: colors.white }]}>{interest}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  interestLabel: {
    alignSelf: "flex-start",
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  interestLabelText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
