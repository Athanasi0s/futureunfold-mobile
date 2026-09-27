import { UserRole } from "@/api/schemas";
import { DrawerWrapper } from "@/components/drawer/drawer-wrapper";
import {
  getDefaultScreenOptions,
  getDefaultTabBarOptions,
} from "@/constants/navigationOptions";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { useFeatureEnabled } from "@/features/config/hooks/useFeatureEnabled";
import { useColors } from "@/hooks/use-colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isSpeaker = user?.role === UserRole.speaker;
  const colors = useColors();

  const scheduleEnabled = useFeatureEnabled("schedule");
  const mapEnabled = useFeatureEnabled("map");
  const digitalIdEnabled = useFeatureEnabled("digital_id");
  const networkingEnabled = useFeatureEnabled("networking");

  return (
    <DrawerWrapper>
      <Tabs
        screenOptions={{
          ...getDefaultScreenOptions(colors),
          ...getDefaultTabBarOptions(colors),
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: t("tabs.home"),
            tabBarButtonTestID: "tab-home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(schedule)"
          options={{
            title: t("tabs.schedule"),
            href: scheduleEnabled ? undefined : null,
            tabBarButtonTestID: "tab-schedule",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: t("tabs.map"),
            href: mapEnabled ? undefined : null,
            tabBarButtonTestID: "tab-map",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="digital-id"
          options={{
            title: t("tabs.badge"),
            href: digitalIdEnabled ? undefined : null,
            tabBarButtonTestID: "tab-badge",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="qrcode" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="tickets" options={{ href: null }} />
        <Tabs.Screen
          name="(networking)"
          options={{
            title: t("tabs.networking"),
            href: networkingEnabled ? undefined : null,
            tabBarButtonTestID: "tab-networking",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account-group"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="speaker-settings"
          options={{
            title: t("tabs.profile"),
            href: isSpeaker ? undefined : null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    </DrawerWrapper>
  );
}
