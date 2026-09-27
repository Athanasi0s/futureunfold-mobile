import { useColors } from "@/hooks/use-colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
function PlusTabButton({ onPress, colors }: { onPress?: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.plusButtonWrapper}
      activeOpacity={0.85}
    >
      <View style={[styles.plusButton, { backgroundColor: colors.primary, borderColor: colors.surfacePrimary, shadowColor: colors.primary }]}>
        <Ionicons name="add" size={30} color={COLOR_WHITE_ON_ACCENT} />
      </View>
    </TouchableOpacity>
  );
}

export default function ExhibitorTabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: 60 + insets.bottom, paddingBottom: insets.bottom + 6, backgroundColor: colors.surfaceSecondary }],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="kiosk/index"
        options={{
          title: t("exhibitor.layout.kiosk"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leads/index"
        options={{
          title: t("exhibitor.layout.leads"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create/index"
        options={{
          title: "",
          tabBarButton: ({ onPress }) => (
            <PlusTabButton onPress={onPress as () => void} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="report/index"
        options={{
          title: t("exhibitor.layout.report"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="chart-bar"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t("exhibitor.layout.admin"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  plusButtonWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    top: -16,
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
});
