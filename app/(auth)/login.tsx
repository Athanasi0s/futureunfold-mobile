import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FadeText } from "@/components/ui/fade-text";
import { UIButton } from "@/components/ui/ui-button";
import { UITextInput } from "@/components/ui/ui-textinput";
import { UIVerticalSpacer } from "@/components/ui/UIVerticalSpacer";
import { FUTURE_UNFOLD_ARTWORK_BACKGROUND } from "@/constants/theme";
import {
  getTenantBackgroundSource,
  getTenantLogoSource,
} from "@/constants/tenant-assets";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { useLoginForm } from "@/features/authentication/hooks/useLoginForm";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { width } = useWindowDimensions();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useLoginForm();
  const { login, isLoggingIn } = useAuth();
  const { t } = useTranslation();
  const appName = useConfigStore((s) => s.appName);
  const appLogoUrl = useConfigStore((s) => s.appLogoUrl);
  const logoSource = appLogoUrl ? { uri: appLogoUrl } : getTenantLogoSource();
  const backgroundSource = getTenantBackgroundSource();
  const artworkHeight = width * (1864 / 2100);
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword((prev) => !prev);

  const titleWordDelay = 200;
  const titleDuration = 800;
  const titleWordCount = t("auth.login.title").split(" ").length;
  const subtitleDelay = (titleWordCount - 1) * titleWordDelay + titleDuration;

  const onLogin = (data: { email: string; password: string }) => {
    login(data.email, data.password);
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: backgroundSource
            ? FUTURE_UNFOLD_ARTWORK_BACKGROUND
            : colors.background,
        },
      ]}
      testID="login-screen"
    >
      {backgroundSource && (
        <TenantBackgroundArt
          style={[styles.backgroundImage, { width, height: artworkHeight }]}
        />
      )}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          {logoSource ? (
            <Image
              source={logoSource}
              style={styles.logoImage}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <MaterialIcons
                name="account-balance"
                size={24}
                color={colors.primary}
              />
            </View>
          )}

          <UIVerticalSpacer height={16} />

          <FadeText
            inputs={[t("auth.login.title")]}
            fontSize={32}
            fontWeight="bold"
            color={colors.text}
            blurTint="default"
            wordDelay={200}
            duration={800}
          />
          <UIVerticalSpacer height={8} />
          <FadeText
            inputs={[t("auth.login.subtitle", { appName })]}
            fontSize={20}
            fontWeight="bold"
            color={colors.textSecondary}
            blurTint="default"
            wordDelay={200}
            duration={800}
            initialDelay={subtitleDelay}
          />
        </View>

        <UIVerticalSpacer height={32} />

        <UITextInput
          testID="login-email-input"
          control={control}
          name="email"
          label={t("auth.login.emailLabel")}
          placeholder={t("auth.login.emailPlaceholder")}
          labelColor="label"
          backroundColor="inputBackground"
          placeholderTextColor="placeholder"
          borderColor="primary"
          hasError={!!errors.email}
          errorMessage={errors.email?.message}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <UIVerticalSpacer height={20} />

        <UITextInput
          testID="login-password-input"
          control={control}
          name="password"
          label={t("auth.login.passwordLabel")}
          placeholder={t("auth.login.passwordPlaceholder")}
          labelColor="label"
          backroundColor="inputBackground"
          placeholderTextColor="placeholder"
          borderColor="primary"
          hasError={!!errors.password}
          errorMessage={errors.password?.message}
          secureTextEntry={!showPassword}
          rightElement={
            <Pressable onPress={togglePassword}>
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={20}
                color={colors.placeholder}
              />
            </Pressable>
          }
        />

        <UIVerticalSpacer height={12} />

        <Pressable
          style={styles.forgotPassword}
          onPress={() => router.push("/reset-password")}
        >
          <ThemedText color="primary" type="link">
            {t("auth.login.forgotPassword")}
          </ThemedText>
        </Pressable>

        <UIVerticalSpacer height={28} />

        <UIButton
          testID="login-submit-button"
          title={t("auth.login.loginButton")}
          variant="basic"
          onPress={handleSubmit(onLogin)}
          isLoading={isLoggingIn}
        />

        <UIVerticalSpacer height={20} />

        <View style={styles.footerRow}>
          <ThemedText color="textSecondary" type="default">
            {t("auth.login.noAccountPrefix")}
          </ThemedText>
          <Pressable onPress={() => router.replace("/")}>
            <ThemedText color="primary" type="link">
              {t("auth.login.signUpLink")}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: "absolute",
    top: "32%",
    opacity: 0.9,
  },
  scroll: {
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 240,
    height: 80,
  },
  forgotPassword: {
    alignSelf: "flex-end",
  },
  footerRow: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});
