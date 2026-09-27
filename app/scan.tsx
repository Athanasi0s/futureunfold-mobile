import { FeatureGate } from "@/components/feature-gate";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useScanQr } from "@/features/points/hooks";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Linking,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";

import { CAMERA_VIEWFINDER_BLACK } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
export default function ScanScreen() {
  return (
    <FeatureGate flag="digital_id">
      <ScanContent />
    </FeatureGate>
  );
}

function ScanContent() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const router = useRouter();
  const { user } = useAuth();
  const appName = useConfigStore((s) => s.appName);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const scanMutation = useScanQr();
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  // Check if user is exhibitor (can scan for leads/check-in)
  const isExhibitor = user?.role === "exhibitor" || user?.role === "admin";

  // Play scan success sound
  const playSuccessSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        {
          uri: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
        },
        { shouldPlay: true },
      );
      await sound.playAsync();
      // Unload sound after playing
      setTimeout(() => sound.unloadAsync(), 1000);
    } catch {
      // Sound playback failed silently
    }
  };

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned) return;
    setScanned(true);

    // Parse festapp:// URL format
    const festappMatch = data.match(/^festapp:\/\/user\/(\d+)$/);

    if (festappMatch) {
      const userId = Number(festappMatch[1]);

      // Play success sound
      playSuccessSound();

      // Record scan on backend
      scanMutation.mutate(userId, {
        onSuccess: (result) => {
          Alert.alert(
            t("scan.alertSuccess"),
            `${result.scanned_user_name} ${t("scan.alertEarned")} ${result.points_awarded} ${t("scan.alertPoints")}.`,
            [
              {
                text: t("scan.alertViewProfile"),
                onPress: () =>
                  router.push({
                    pathname: "/user/[id]",
                    params: { id: String(userId) },
                  }),
              },
              { text: t("scan.alertScanAgain"), onPress: () => setScanned(false) },
            ],
          );
        },
        onError: (error: any) => {
          const status = error?.response?.status;
          if (status === 409) {
            Alert.alert(
              t("scan.alertAlreadyScanned"),
              t("scan.alertAlreadyScannedMsg"),
              [{ text: t("scan.alertOk"), onPress: () => setScanned(false) }],
            );
          } else if (status === 400) {
            Alert.alert(t("scan.alertInvalidScan"), t("scan.alertOwnBadge"), [
              { text: t("scan.alertOk"), onPress: () => setScanned(false) },
            ]);
          } else {
            Alert.alert(t("scan.alertScanError"), t("scan.alertScanErrorMsg"), [
              { text: t("scan.alertOk"), onPress: () => setScanned(false) },
            ]);
          }
        },
      });
    } else {
      // Invalid QR code
      Alert.alert(
        t("scan.alertInvalidQr"),
        t("scan.alertInvalidQrMsg", { appName }),
        [
          {
            text: t("scan.alertScanAgain"),
            onPress: () => setScanned(false),
          },
        ],
      );
    }
  };

  const handleClose = () => {
    router.back();
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  // Permission not yet determined
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ThemedText style={styles.permissionText}>
            {t("scan.requestingPermission")}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Ionicons name="close" size={28} color={COLOR_WHITE_ON_ACCENT} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("scan.title")}</ThemedText>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={64} color={colors.textTertiary} />
          <ThemedText style={styles.permissionTitle}>{t("scan.cameraRequired")}</ThemedText>
          <ThemedText style={styles.permissionText}>
            {t("scan.cameraMsg")}
          </ThemedText>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <ThemedText style={styles.permissionButtonText}>{t("scan.grantPermission")}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => Linking.openSettings()}
          >
            <ThemedText style={styles.settingsButtonText}>{t("scan.openSettings")}</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <StatusBar barStyle="light-content" />

      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Ionicons name="close" size={28} color={COLOR_WHITE_ON_ACCENT} />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>
              {isExhibitor ? t("scan.scanVisitor") : t("scan.title")}
            </ThemedText>
            <TouchableOpacity onPress={toggleFlash} style={styles.headerButton}>
              <Ionicons
                name={flashOn ? "flash" : "flash-outline"}
                size={24}
                color={COLOR_WHITE_ON_ACCENT}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Scan Frame */}
        <View style={styles.scanFrameContainer}>
          <View style={styles.scanFrame}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {/* Bottom section */}
        <SafeAreaView style={styles.bottomSection}>
          <View style={styles.instructionBox}>
            <Ionicons name="qr-code-outline" size={24} color={colors.brand} />
            <ThemedText style={styles.instructionText}>
              {t("scan.pointCamera")}
            </ThemedText>
          </View>

          {isExhibitor && (
            <View style={styles.exhibitorBadge}>
              <Ionicons name="storefront-outline" size={16} color={colors.warning} />
              <ThemedText style={styles.exhibitorText}>{t("scan.exhibitorMode")}</ThemedText>
            </View>
          )}

          {scanned && (
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
            >
              <Ionicons name="refresh" size={20} color={COLOR_WHITE_ON_ACCENT} />
              <ThemedText style={styles.scanAgainText}>{t("scan.tapToScanAgain")}</ThemedText>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CAMERA_VIEWFINDER_BLACK,
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    color: COLOR_WHITE_ON_ACCENT,
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  // Scan frame
  scanFrameContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: colors.brand,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },

  // Bottom section
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  instructionBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.background,
  },
  exhibitorBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    alignSelf: "center",
  },
  exhibitorText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.warning,
    letterSpacing: 0.5,
  },
  scanAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  scanAgainText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
  },

  // Permission states
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: colors.brand,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
  },
  settingsButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
});
