import { useColors } from "@/hooks/use-colors";

type ColorsPalette = ReturnType<typeof useColors>;

export const getDefaultScreenOptions = (colors: ColorsPalette) => ({
  contentStyle: { backgroundColor: colors.background },
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerTitleStyle: { color: colors.text, fontSize: 17, fontWeight: "600" as const },
  headerBackTitleVisible: false,
  headerShadowVisible: false,
});

export const getDefaultTabBarOptions = (colors: ColorsPalette) => ({
  tabBarStyle: { backgroundColor: colors.background },
  tabBarActiveTintColor: colors.lightBlue,
  tabBarInactiveTintColor: colors.border,
});
