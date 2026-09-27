import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { UIButton } from "@/components/ui/ui-button";
import { UITextInput } from "@/components/ui/ui-textinput";
import { UIVerticalSpacer } from "@/components/ui/UIVerticalSpacer";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useTranslation();
  const { control } = useForm({
    defaultValues: {
      email: "",
    },
  });
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

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
            style={[
              styles.logoContainer,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <MaterialIcons
              name="account-balance"
              size={24}
              color={colors.primary}
            />
          </View>

          <UIVerticalSpacer height={16} />

          <ThemedText type="title" style={styles.title}>
            {t("auth.resetPassword.title")}
          </ThemedText>
          <UIVerticalSpacer height={8} />
          <ThemedText color="textSecondary" type="subtitle" style={styles.subtitle}>
            {t("auth.resetPassword.subtitle")}
          </ThemedText>
        </View>

        <UIVerticalSpacer height={32} />

        <UITextInput
          control={control}
          name="email"
          label={t("auth.resetPassword.emailLabel")}
          placeholder={t("auth.resetPassword.emailPlaceholder")}
          labelColor="label"
          backroundColor="inputBackground"
          placeholderTextColor="placeholder"
          borderColor="primary"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <UIVerticalSpacer height={32} />

        <UIButton
          title={t("auth.resetPassword.sendButton")}
          variant="basic"
          onPress={() => router.push("/email-confirmation")}
        />

        <UIVerticalSpacer height={24} />

        <Pressable
          style={styles.backToLogin}
          onPress={() => router.replace("/login")}
        >
          <ThemedText color="primary" type="link">
            {t("auth.resetPassword.backToLogin")}
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
