import { useDrawerStore } from "@/components/drawer/drawer-store";
import { ThemedText } from "@/components/themed-text";
import { getDefaultScreenOptions } from "@/constants/navigationOptions";
import { getTenantLogoSource } from "@/constants/tenant-assets";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useColors } from "@/hooks/use-colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

function ScheduleHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const { toggleDrawer } = useDrawerStore();
  const appName = useConfigStore((s) => s.appName);
  const appLogoUrl = useConfigStore((s) => s.appLogoUrl);
  const logoSource = appLogoUrl ? { uri: appLogoUrl } : getTenantLogoSource();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity style={styles.menuButton} onPress={toggleDrawer}>
        <Ionicons name="menu" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        {logoSource ? (
          <Image
            source={logoSource}
            style={styles.logoImage}
            contentFit="contain"
          />
        ) : (
          <View style={styles.logoIcon}>
            <MaterialIcons
              name="account-balance"
              size={20}
              color={colors.primary}
            />
          </View>
        )}
        {!logoSource && <ThemedText style={styles.logoText}>{appName}</ThemedText>}
      </View>

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
            <Ionicons name="person" size={18} color={colors.textSecondary} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function ScheduleLayout() {
  const { t } = useTranslation();
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        ...getDefaultScreenOptions(colors),
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: true, header: () => <ScheduleHeader /> }}
      />
      <Stack.Screen name="my-meetings" options={{ title: t("schedule.meetings.title") }} />
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
    menuButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    logoContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    logoIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.primaryLight,
      justifyContent: "center",
      alignItems: "center",
    },
    logoImage: {
      width: 150,
      height: 48,
    },
    logoText: {
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 1,
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
