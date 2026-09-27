import { UIButton } from "@/components/ui/ui-button";
import { useColors } from "@/hooks/use-colors";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  StyleSheet,
  View,
} from "react-native";
import { MatchBadge } from "./MatchBadge";
import { UserInfo } from "./UserInfo";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";

export function MatchCard({
  user,
}: {
  user: {
    user_id: number;
    full_name: string;
    avatar_url?: string | null;
    role: string;
    company: string | null;
    match_score: number;
  };
}) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View style={[styles.card, { backgroundColor: colors.inputBackground }]}>
      <View style={[styles.imageContainer, { backgroundColor: colors.border }]}>
        {user.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={styles.profileImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <ThemedText style={styles.avatarInitial}>{(user.full_name || "?").charAt(0)}</ThemedText>
          </View>
        )}
        <MatchBadge matchScore={user.match_score} />
      </View>
      <View style={styles.cardContent}>
        <UserInfo name={user.full_name} jobTitle={user.company ?? user.role} />
        <View style={styles.buttonContainer}>
          <UIButton
            onPress={() => router.push(`/userinfo?userId=${user.user_id}`)}
            style={styles.button}
            title={t("common.connect")}
            textStyle={[styles.buttonText, { color: colors.text }]}
          />
          <UIButton
            // TODO: Add the correct functionality to meet with the user
            onPress={() =>
              router.push({
                pathname: "/schedule",
                params: { userId: user.user_id },
              })
            }
            style={styles.button}
            title="Meet"
            variant="outlined"
            textStyle={[styles.buttonText, { color: colors.text }]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    height: 280,
    marginRight: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.6)",
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
