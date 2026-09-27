import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { UIButton } from "@/components/ui/ui-button";
import { UITextInput } from "@/components/ui/ui-textinput";
import { UIVerticalSpacer } from "@/components/ui/UIVerticalSpacer";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { useColors } from "@/hooks/use-colors";
import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const passwordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function CreateNewPasswordScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { control } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });
  const { t } = useTranslation();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const toggleNewPassword = () => setShowNewPassword((prev) => !prev);
  const toggleConfirmPassword = () => setShowConfirmPassword((prev) => !prev);

  const password = useWatch({ control, name: "newPassword" }) ?? "";
  const hasMinLength = password.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);

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

          <UIVerticalSpacer height={32} />

          <View
            style={[styles.iconContainer, { backgroundColor: colors.primary }]}
          >
            <MaterialIcons name="lock" size={48} color={colors.white} />
          </View>

          <UIVerticalSpacer height={32} />

          <ThemedText type="title" style={styles.title}>
            {t("auth.createNewPassword.title")}
          </ThemedText>

          <UIVerticalSpacer height={8} />

          <ThemedText
            color="textSecondary"
            type="subtitle"
            style={styles.subtitle}
          >
            {t("auth.createNewPassword.subtitle")}
          </ThemedText>
        </View>

        <UIVerticalSpacer height={32} />

        <UITextInput
          control={control}
          name="newPassword"
          label={t("auth.createNewPassword.newPasswordLabel")}
          placeholder={t("auth.createNewPassword.newPasswordPlaceholder")}
          labelColor="label"
          backroundColor="inputBackground"
          placeholderTextColor="placeholder"
          borderColor="primary"
          secureTextEntry={!showNewPassword}
          rightElement={
            <Pressable onPress={toggleNewPassword}>
              <MaterialIcons
                name={showNewPassword ? "visibility" : "visibility-off"}
                size={20}
                color={colors.placeholder}
              />
            </Pressable>
          }
        />

        <UIVerticalSpacer height={20} />

        <UITextInput
          control={control}
          name="confirmPassword"
          label={t("auth.createNewPassword.confirmPasswordLabel")}
          placeholder={t("auth.createNewPassword.confirmPasswordPlaceholder")}
          labelColor="label"
          backroundColor="inputBackground"
          placeholderTextColor="placeholder"
          borderColor="primary"
          secureTextEntry={!showConfirmPassword}
          rightElement={
            <Pressable onPress={toggleConfirmPassword}>
              <MaterialIcons
                name={showConfirmPassword ? "visibility" : "visibility-off"}
                size={20}
                color={colors.placeholder}
              />
            </Pressable>
          }
        />

        <UIVerticalSpacer height={24} />

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

        <UIVerticalSpacer height={32} />

        <UIButton
          title={t("auth.createNewPassword.updateButton")}
          variant="basic"
          icon="check"
          onPress={() => router.replace("/login")}
        />

        <UIVerticalSpacer height={16} />

        <Pressable
          style={styles.cancelButton}
          onPress={() => router.replace("/login")}
        >
          <ThemedText color="textSecondary" type="default">
            {t("auth.createNewPassword.cancelLink")}
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
  cancelButton: {
    alignSelf: "center",
  },
});
