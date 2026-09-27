// app/me.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { UIButton } from "@/components/ui/ui-button";
import { useAuth } from "@/features/authentication/hooks/useAuth";


export default function MeScreen() {
  const { user, isLoadingUser, logout, isLoggingOut, refetchUser } = useAuth();

  return (
    <ThemedView style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
      <ThemedText style={{ fontSize: 22, fontWeight: "700" }}>/me</ThemedText>

      <ThemedText style={{ fontSize: 16 }}>
        {isLoadingUser ? "Loading..." : JSON.stringify(user, null, 2)}
      </ThemedText>

      <UIButton
        title="REFRESH /me"
        variant="outlined"
        onPress={() => refetchUser()}
      />

      <UIButton
        title="LOGOUT"
        variant="outlined"
        onPress={logout}
        isLoading={isLoggingOut}
      />
    </ThemedView>
  );
}
