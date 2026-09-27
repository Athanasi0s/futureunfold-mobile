import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColors } from "@/hooks/use-colors";
import { StyleSheet } from "react-native";

export function UserInfo({
  name,
  jobTitle,
}: {
  name: string;
  jobTitle: string;
}) {
  const colors = useColors();

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={[styles.name, { color: colors.text }]}>{name}</ThemedText>
      <ThemedText style={[styles.title, { color: colors.icon }]}>{jobTitle}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    fontSize: 10,
  },
});
