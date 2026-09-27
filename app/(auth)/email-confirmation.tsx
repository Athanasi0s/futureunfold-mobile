import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { UIButton } from "@/components/ui/ui-button";
import { UIVerticalSpacer } from "@/components/ui/UIVerticalSpacer";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EmailConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const openEmailApp = () => {
    Linking.openURL("mailto:");
  };

  return (
    <ThemedView style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
        >
          <MaterialIcons
            name="chevron-left"
            size={28}
            color={colors.textPrimary}
          />
        </Pressable>

        <UIVerticalSpacer height={24} />

        <View style={styles.headerSection}>
          <View
            style={[styles.iconContainer, { backgroundColor: colors.primary }]}
          >
            <MaterialIcons name="inbox" size={48} color={colors.white} />
          </View>

          <UIVerticalSpacer height={32} />

          <ThemedText type="title" style={styles.title}>
            {t("auth.emailConfirmation.title")}
          </ThemedText>

          <UIVerticalSpacer height={12} />

          <ThemedText
            color="textSecondary"
            type="subtitle"
            style={styles.subtitle}
          >
            {t("auth.emailConfirmation.subtitle")}
          </ThemedText>
        </View>

        <UIVerticalSpacer height={40} />

        <UIButton
          title={t("auth.emailConfirmation.openEmailButton")}
          variant="basic"
          onPress={openEmailApp}
        />

        <UIVerticalSpacer height={16} />

        <UIButton title={t("auth.emailConfirmation.resendButton")} variant="outlined" onPress={() => {}} />

        <UIVerticalSpacer height={24} />

        <Pressable
          style={styles.backToLogin}
          onPress={() => router.replace("/login")}
        >
          <ThemedText color="textSecondary" type="default">
            {t("auth.emailConfirmation.backToLogin")}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },
  scroll: {
    paddingHorizontal: 24,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  backToLogin: {
    alignSelf: "center",
  },
});
