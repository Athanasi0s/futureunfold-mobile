import { UserListItem } from "@/api/schemas";
import { UIButton } from "@/components/ui/ui-button";
import { useColors } from "@/hooks/use-colors";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { UserInfo } from "./UserInfo";
import { ThemedText } from "@/components/themed-text";

export function AttendeeRow({ user }: { user: UserListItem }) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {user.avatar_url ? (
        <Image
          source={{ uri: user.avatar_url }}
          style={styles.avatar}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <ThemedText style={styles.avatarInitial}>
            {(user.full_name || "?").charAt(0)}
          </ThemedText>
        </View>
      )}
      <View style={styles.info}>
        <UserInfo name={user.full_name} jobTitle={user.company ?? t("matching.attendeeRow.attendeeFallback")} />
        <View style={styles.buttonContainer}>
          <UIButton
            onPress={() => router.push(`/userinfo?userId=${user.id}`)}
            style={styles.button}
            title={t("matching.attendeeRow.connect")}
            textStyle={styles.buttonText}
          />
          <UIButton
            onPress={() =>
              router.push({
                pathname: "/dm-chat",
                params: {
                  user_id: String(user.id),
                  name: user.full_name,
                },
              })
            }
            style={styles.button}
            title={t("matching.attendeeRow.message")}
            variant="outlined"
            textStyle={styles.buttonText}
          />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      marginBottom: 10,
    },
    avatar: {
      width: 75,
      height: 75,
      borderRadius: 14,
      marginRight: 14,
    },
    avatarPlaceholder: {
      backgroundColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarInitial: {
      fontSize: 28,
      fontWeight: "700",
      color: "rgba(255, 255, 255, 0.6)",
    },
    info: {
      flex: 1,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 8,
      marginTop: 4,
    },
    button: {
      paddingVertical: 2,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    buttonText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
  });
