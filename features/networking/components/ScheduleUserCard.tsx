import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

type ScheduleUserCardProps = {
  avatarUrl: string;
  name: string;
  title: string;
  company: string;
  badge?: string;
  isOnline?: boolean;
};

export function ScheduleUserCard({
  avatarUrl,
  name,
  title,
  company,
  badge,
  isOnline = true,
}: ScheduleUserCardProps) {
  console.log(
    "🔍 →🔍 →🔍 →🔍 →🔍 →🔍 →🔍 →🔍 → ScheduleUserCard → avatarUrl:",
    avatarUrl,
  );
  const colors = useColors();

  return (
    <View
      style={[styles.userCard, { backgroundColor: colors.inputBackground }]}
    >
      <Image
        source={{ uri: avatarUrl }}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.userInfo}>
        <ThemedText style={[styles.userName, { color: colors.text }]}>
          {name}
        </ThemedText>
        <ThemedText style={[styles.userTitle, { color: colors.icon }]}>
          {title} {"\u2022"} {company}
        </ThemedText>
        {badge && (
          <View style={styles.badgeRow}>
            {isOnline && (
              <View
                style={[styles.onlineDot, { backgroundColor: colors.success }]}
              />
            )}
            <ThemedText style={[styles.badgeText, { color: colors.icon }]}>
              {badge}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
  },
  userTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
  },
});
