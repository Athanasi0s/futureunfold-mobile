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
import { useRegister } from "@/features/authentication/hooks/useRegister";
import { useRegisterForm } from "@/features/authentication/hooks/useRegisterForm";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useState } from "react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const appName = useConfigStore((s) => s.appName);
  const logoSource = getTenantLogoSource();
  const backgroundSource = getTenantBackgroundSource();
  const artworkHeight = width * (1864 / 2100);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useRegisterForm();
  const { login, isLoggingIn } = useAuth();

  const { mutate: register, isPending: isRegistering } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const togglePassword = () => setShowPassword((prev) => !prev);
  const toggleAgreed = () => setAgreed((prev) => !prev);

  const titleWordDelay = 200;
  const titleDuration = 800;
  const titleWordCount = t("auth.signup.title").split(" ").length;
  const subtitleDelay = (titleWordCount - 1) * titleWordDelay + titleDuration;

  const password = useWatch({ control, name: "password" }) ?? "";
  const hasMinLength = password.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);

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
      testID="signup-screen"
    >
      {backgroundSource && (
        <TenantBackgroundArt
          style={[styles.backgroundImage, { width, height: artworkHeight }]}
        />
      )}
      <KeyboardAwareScrollView
        bottomOffset={175}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          {logoSource ? (
            <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <MaterialIcons name="event" size={24} color={colors.primary} />
            </View>
          )}

          <UIVerticalSpacer height={16} />

          <FadeText
            inputs={[t("auth.signup.title")]}
            fontSize={32}
            fontWeight="bold"
            color={colors.text}
            blurTint="default"
            wordDelay={200}
            duration={800}
          />
          <UIVerticalSpacer height={8} />
          <FadeText
            inputs={[t("auth.signup.subtitle", { appName })]}
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
          control={control}
          name="full_name"
          label={t("auth.signup.fullNameLabel")}
          placeholder={t("auth.signup.fullNamePlaceholder")}
          labelColor="label"
          backroundColor="inputBackground"
          placeholderTextColor="placeholder"
          borderColor="primary"
          hasError={!!errors.full_name}
          errorMessage={errors.full_name?.message}
          autoCapitalize="words"
        />

        <UIVerticalSpacer height={20} />

        <UITextInput
          control={control}
          name="email"
          label={t("auth.signup.emailLabel")}
          placeholder={t("auth.signup.emailPlaceholder")}
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
          control={control}
          name="company"
          label={t("auth.signup.companyLabel")}
          placeholder={t("auth.signup.companyPlaceholder")}
          labelColor="label"
          backroundColor="inputBackground"
          placeholderTextColor="placeholder"
          borderColor="primary"
          hasError={!!errors.company}
          errorMessage={errors.company?.message}
        />

        <UIVerticalSpacer height={20} />

        <UITextInput
          control={control}
          name="password"
          label={t("auth.signup.passwordLabel")}
          placeholder={t("auth.signup.passwordPlaceholder")}
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

        <UIVerticalSpacer height={16} />

        <View style={styles.requirementsContainer}>
          <ThemedText
            color="textSecondary"
            type="default"
            style={styles.requirementsTitle}
          >
            {t("auth.security.title")}
          </ThemedText>
          <UIVerticalSpacer height={12} />
          <View style={styles.requirementRow}>
            <MaterialIcons
              name={hasMinLength ? "check-circle" : "radio-button-unchecked"}
              size={18}
              color={hasMinLength ? colors.success : colors.textSecondary}
            />
            <ThemedText
              color={hasMinLength ? "success" : "textSecondary"}
              type="default"
              style={styles.requirementText}
            >
              {t("auth.security.minLength")}
            </ThemedText>
          </View>
          <UIVerticalSpacer height={8} />
          <View style={styles.requirementRow}>
            <MaterialIcons
              name={hasSpecialChar ? "check-circle" : "radio-button-unchecked"}
              size={18}
              color={hasSpecialChar ? colors.success : colors.textSecondary}
            />
            <ThemedText
              color={hasSpecialChar ? "success" : "textSecondary"}
              type="default"
              style={styles.requirementText}
            >
              {t("auth.security.specialChar")}
            </ThemedText>
          </View>
          <UIVerticalSpacer height={8} />
          <View style={styles.requirementRow}>
            <MaterialIcons
              name={hasUppercase ? "check-circle" : "radio-button-unchecked"}
              size={18}
              color={hasUppercase ? colors.success : colors.textSecondary}
            />
            <ThemedText
              color={hasUppercase ? "success" : "textSecondary"}
              type="default"
              style={styles.requirementText}
            >
              {t("auth.security.uppercase")}
            </ThemedText>
          </View>
        </View>

        <UIVerticalSpacer height={20} />

        <Pressable style={styles.checkboxRow} onPress={toggleAgreed}>
          <View
            style={[
              styles.checkbox,
              { borderColor: colors.border },
              agreed && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            {agreed && (
              <MaterialIcons
                name="check"
                size={14}
                color={colors.textPrimary}
              />
            )}
          </View>
          <View style={styles.checkboxTextContainer}>
            <ThemedText color="textSecondary" type="default">
              {t("auth.signup.agreePrefix")}{" "}
              <ThemedText color="primary" type="link">
                {t("auth.signup.termsLink")}
              </ThemedText>{" "}
              {t("auth.signup.and")}{" "}
              <ThemedText color="primary" type="link">
                {t("auth.signup.privacyLink")}
              </ThemedText>
            </ThemedText>
          </View>
        </Pressable>

        <UIVerticalSpacer height={28} />

        <UIButton
          title={t("auth.signup.createButton")}
          variant="basic"
          onPress={handleSubmit((data) =>
            register(data, {
              onSuccess: () => {
                login(data.email, data.password);
              },
            }),
          )}
          disabled={!agreed || isRegistering || isLoggingIn}
          isLoading={isRegistering || isLoggingIn}
        />

        <UIVerticalSpacer height={20} />

        <View style={styles.footerRow}>
          <ThemedText color="textSecondary" type="default">
            {t("auth.signup.hasAccountPrefix")}{" "}
          </ThemedText>
          <Pressable
            accessibilityLabel="auth-signup-login-link"
            onPress={() => router.replace("/login")}
          >
            <ThemedText color="primary" type="link">
              {t("auth.signup.loginLink")}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
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
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxTextContainer: {
    flex: 1,
  },
  link: {
    fontSize: 14,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
  },
  requirementsContainer: {
    paddingLeft: 4,
  },
  requirementsTitle: {
    fontSize: 12,
    letterSpacing: 1,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
  },
});
