// app/testme.tsx
import React from "react";
import { ScrollView, StyleSheet, useWindowDimensions } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { UIButton } from "@/components/ui/ui-button";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { useColors } from "@/hooks/use-colors";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

export default function TestMeScreen() {
  const { user, isLoadingUser, logout } = useAuth();
  const colors = useColors();
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  return (
    <ThemedView style={styles.wrap}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <ThemedText style={styles.h1}>/me result</ThemedText>

      <ScrollView style={[styles.box, { borderColor: colors.border }]}>
        <ThemedText style={styles.json}>{isLoadingUser ? "Loading..." : JSON.stringify(user, null, 2)}</ThemedText>
      </ScrollView>

      <UIButton title="LOGOUT" onPress={logout} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, paddingTop: 60, gap: 12 },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },
  h1: { fontSize: 22, fontWeight: "700" },
  box: { borderWidth: 1, borderRadius: 10, padding: 12 },
  json: { fontFamily: "monospace", fontSize: 12 },
});
