import { UIButton } from "@/components/ui/ui-button";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import type { MatchingUser } from "../get-matching-users";
import { MatchBadge } from "./MatchBadge";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";

type MatchReason = { label: string; detail: string };

function buildMatchReasons(user: MatchingUser): MatchReason[] {
  const reasons: MatchReason[] = [];

  if (user.common_interests.length > 0) {
    reasons.push({
      label: "Shared Interests",
      detail: user.common_interests.join(", "),
    });
  }

  if (user.common_groups.length > 0) {
    const [first, ...rest] = user.common_groups;
    let detail = first;
    if (rest.length > 0) {
      detail += `. Both looking for ${rest.join(", ")} networking.`;
    }
    reasons.push({ label: "Shared Group", detail });
  }

  return reasons;
}

export function MatchCardLarge({ user }: { user: MatchingUser }) {
  const colors = useColors();
  const { t } = useTranslation();
  const reasons = buildMatchReasons(user);

  const navigateToProfile = () => {
    router.push(`/user/${user.user_id}`);
  };

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.inputBackground }]}
      onPress={navigateToProfile}
    >
      {/* Image section */}
      <View style={[styles.imageContainer, { backgroundColor: colors.border }]}>
        {user.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <ThemedText style={styles.avatarInitial}>
              {(user.full_name || "?").charAt(0)}
            </ThemedText>
          </View>
        )}
        <MatchBadge matchScore={user.match_score} />
      </View>

      {/* Info section */}
      <View style={styles.infoSection}>
        <View style={styles.nameRow}>
          <View style={styles.nameBlock}>
            <ThemedText style={[styles.name, { color: colors.text }]}>
              {user.full_name}
            </ThemedText>
            <ThemedText style={[styles.role, { color: colors.lightBlue }]}>
              {user.role}
              {user.company ? ` at ${user.company}` : ""}
            </ThemedText>
          </View>
          <Pressable
            style={[styles.personButton, { borderColor: colors.border }]}
            onPress={navigateToProfile}
          >
            <MaterialIcons name="person" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Match reasons */}
        {reasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            <ThemedText
              style={[styles.reasonsLabel, { color: colors.textSecondary }]}
            >
              MATCHES BECAUSE
            </ThemedText>
            {reasons.map((reason, i) => (
              <ThemedText
                key={i}
                style={[styles.reasonText, { color: colors.textMuted }]}
              >
                <ThemedText style={{ color: colors.lightBlue, fontWeight: "600" }}>
                  {reason.label}
                </ThemedText>
                : {reason.detail}
              </ThemedText>
            ))}
          </View>
        )}

        {/* Action row */}
        <View style={styles.actionRow}>
          <UIButton
            title={t("common.connect")}
            onPress={navigateToProfile}
            style={[styles.connectButton, { backgroundColor: colors.lightBlue }]}
            textStyle={[styles.connectText, { color: colors.white }]}
          />
          <Pressable
            style={[styles.messageButton, { borderColor: colors.border }]}
            onPress={(e) => {
              e.stopPropagation();
              router.push({
                pathname: "/dm-chat",
                params: {
                  user_id: String(user.user_id),
                  name: user.full_name,
                },
              });
            }}
          >
            <MaterialIcons name="chat-bubble-outline" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 16 / 10,
    overflow: "hidden",
  },
  image: {
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
    fontSize: 64,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.6)",
  },
  infoSection: {
    padding: 16,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameBlock: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  role: {
    fontSize: 13,
    marginTop: 2,
  },
  personButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  reasonsContainer: {
    marginTop: 12,
  },
  reasonsLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  connectButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  connectText: {
    fontSize: 15,
    fontWeight: "600",
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
