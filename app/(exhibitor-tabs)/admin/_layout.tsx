import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="showcase" />
      <Stack.Screen name="speakers" />
      <Stack.Screen name="polls" />
      <Stack.Screen name="create-poll" />
      <Stack.Screen name="sessions" />
      <Stack.Screen name="edit-session" />
    </Stack>
  );
}
