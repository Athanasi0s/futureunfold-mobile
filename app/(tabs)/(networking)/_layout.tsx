import { ThemedText } from "@/components/themed-text";
import { useDrawerStore } from "@/components/drawer/drawer-store";
import { getDefaultScreenOptions } from "@/constants/navigationOptions";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

function NetworkingHeader() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const openDrawer = useDrawerStore((s) => s.openDrawer);
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
        <Ionicons name="menu" size={24} color={colors.text} />
      </TouchableOpacity>

      <ThemedText style={styles.headerTitle}>{t("networking.headerTitle")}</ThemedText>

      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => router.push("/profile")}
      >
        {user?.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons
              name="person"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function NetworkingLayout() {
  const { t } = useTranslation();
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        ...getDefaultScreenOptions(colors),
        headerShown: true,
        header: () => <NetworkingHeader />,
      }}
    >
      <Stack.Screen name="index" options={{ title: t("networking.headerTitle") }} />
      <Stack.Screen name="schedule" options={{ title: t("networking.schedule.headerSchedule"), headerShown: false }} />
      <Stack.Screen
        name="userinfo"
        options={{ title: t("networking.userinfo.profileHeader"), headerShown: true }}
      />
    </Stack>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: colors.gradientStart,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    menuButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    avatarPlaceholder: {
      backgroundColor: colors.cardBackground,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
  });
