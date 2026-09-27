import { DigitalIdCard, UserAvatarSection } from "@/components/digital-id";
import { FeatureGate } from "@/components/feature-gate";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { ThemedText } from "@/components/themed-text";
import { useDrawerStore } from "@/components/drawer/drawer-store";
import { GoogleWalletButton } from "@/components/wallet/GoogleWalletButton";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useColors } from "@/hooks/use-colors";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
export default function DigitalIdScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const openDrawer = useDrawerStore((s) => s.openDrawer);
  const appName = useConfigStore((s) => s.appName);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const handleShare = async () => {
    if (!user) return;

    try {
      await Share.share({
        message: t("digitalId.shareMessage", { id: user.id, appName }),
        title: t("digitalId.shareTitle"),
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (isLoadingUser) {
    return (
      <SafeAreaView testID="badge-screen" style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand} />
        <ThemedText style={styles.loadingText}>
          {t("digitalId.loadingBadge")}
        </ThemedText>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView testID="badge-screen" style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <ThemedText style={styles.errorText}>
          {t("digitalId.errorLoadProfile")}
        </ThemedText>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.retryButtonText}>{t("digitalId.goBack")}</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <FeatureGate flag="digital_id">
      <View testID="badge-screen" style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={openDrawer} style={styles.headerButton}>
              <Ionicons name="menu" size={26} color={COLOR_WHITE_ON_ACCENT} />
            </TouchableOpacity>

            <ThemedText style={styles.headerTitle}>{t("digitalId.headerTitle")}</ThemedText>

            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <Ionicons name="share-outline" size={24} color={COLOR_WHITE_ON_ACCENT} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Tenant background overlay */}
          {hasBackgroundArt && (
            <TenantBackgroundArt
              variant="secondary"
              style={[
                styles.patternOverlay,
                { width, height: artworkHeight },
              ]}
            />
          )}

          {/* User Avatar Section */}
          <UserAvatarSection user={user} />

          {/* Digital ID Card */}
          <View style={styles.cardWrapper}>
            <DigitalIdCard user={user} />
          </View>

          {/* Phase 13 GWLT-01 — Android-only "Add to Google Wallet" CTA.
              Renders null on iOS (Apple Wallet/PassKit deferred to a future phase). */}
          <GoogleWalletButton />

          {/* Help text */}
          <View style={styles.helpSection}>
            <ThemedText style={styles.helpText}>
              {t("digitalId.helpText")}
            </ThemedText>
          </View>
        </ScrollView>
      </View>
    </FeatureGate>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    color: colors.error,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: colors.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontWeight: "600",
  },

  // Header
  headerSafeArea: {
    backgroundColor: colors.surfacePrimary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },

  // Scroll content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  patternOverlay: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },

  // Card wrapper
  cardWrapper: {
    marginBottom: 32,
  },

  // Help section
  helpSection: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  helpText: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
  },
});
