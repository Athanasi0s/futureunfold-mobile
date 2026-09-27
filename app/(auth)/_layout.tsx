import { getDefaultScreenOptions } from "@/constants/navigationOptions";
import { useColors } from "@/hooks/use-colors";
import { Stack } from "expo-router";

export default function AuthLayout() {
  const colors = useColors();
  return (
    <Stack screenOptions={{ ...getDefaultScreenOptions(colors), headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="email-confirmation" />
      <Stack.Screen name="create-new-password" />
    </Stack>
  );
}
