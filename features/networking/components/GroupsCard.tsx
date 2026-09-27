import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
export type Group = {
  id: string | number;
  name: string;
  members: string;
  status: string;
  iconColor: string;
};

type GroupsCardProps = {
  group: Group;
  onPress?: (groupId: string | number) => void;
};

export function GroupsCard({ group, onPress }: GroupsCardProps) {
  const colors = useColors();

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.inputBackground }]}
      onPress={() => onPress?.(group.id)}
    >
      <View style={[styles.groupIcon, { backgroundColor: group.iconColor }]}>
        <MaterialIcons name="hub" size={20} color={COLOR_WHITE_ON_ACCENT} />
      </View>
      <View style={styles.groupInfo}>
        <ThemedText style={[styles.name, { color: colors.text }]}>
          {group.name}
        </ThemedText>
        <ThemedText style={[styles.meta, { color: colors.textSecondary }]}>
          {group.members} • {group.status}
        </ThemedText>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  groupInfo: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
  },
});
