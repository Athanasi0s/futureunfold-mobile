import { getDefaultScreenOptions } from "@/constants/navigationOptions";
import { useColors } from "@/hooks/use-colors";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function OnboardingLayout() {
  const colors = useColors();
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        ...getDefaultScreenOptions(colors),
      }}
    >
      <Stack.Screen name="index" options={{ title: "Personalize" }} />
      <Stack.Screen
        name="create-session"
        options={{ title: t("festival.adminCreate.title") }}
      />
      <Stack.Screen
        name="completion"
        options={{
          title: t("common.done"),
          headerShown: false,
        }}
      />
    </Stack>
  );
}
