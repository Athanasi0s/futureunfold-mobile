import { FeatureGate } from "@/components/feature-gate";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { useScanHistory, useScanQr } from "@/features/points/hooks";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useColors } from "@/hooks/use-colors";

import { CAMERA_VIEWFINDER_BLACK } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
export default function ExhibitorKioskScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const router = useRouter();
  useAuth(); // ensure authenticated
  const appName = useConfigStore((s) => s.appName);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const scanMutation = useScanQr();
  const { data: scanHistory = [], refetch: refetchHistory } = useScanHistory();

  // Derive stats from real scan history
  const totalScans = scanHistory.length;
  const totalPoints = scanHistory.reduce(
    (sum, log) => sum + log.points_awarded,
    0,
  );

  // Format relative time
  const formatTimeAgo = (isoDate: string) => {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetchHistory().finally(() => setRefreshing(false));
  }, [refetchHistory]);

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
      setTimeout(() => sound.unloadAsync(), 250);
    } catch {
      // Sound playback failed silently
    }
  };

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    // Parse festapp:// URL format
    const festappMatch = data.match(/^festapp:\/\/user\/(\d+)$/);

    if (festappMatch) {
      const userId = Number(festappMatch[1]);
      setIsScanning(false);

      // Play success sound
      playSuccessSound();

      // Record scan on backend
      scanMutation.mutate(userId, {
        onSuccess: (result) => {
          Alert.alert(
            t("exhibitor.kiosk.alertScanned"),
            `${result.scanned_user_name} earned ${result.points_awarded} points.`,
            [
              {
                text: t("exhibitor.kiosk.viewProfile"),
                onPress: () => {
                  router.push({
                    pathname: "/user/[id]",
                    params: { id: String(userId) },
                  });
                },
              },
              {
                text: t("exhibitor.kiosk.alertContinue"),
                onPress: () => {
                  setScanned(false);
                  setIsScanning(true);
                },
              },
            ],
          );
        },
        onError: (error: any) => {
          const status = error?.response?.status;
          if (status === 409) {
            Alert.alert(
              t("exhibitor.kiosk.alertAlreadyScanned"),
              t("exhibitor.kiosk.alertAlreadyScannedMsg"),
              [
                {
                  text: t("exhibitor.kiosk.alertContinue"),
                  onPress: () => {
                    setScanned(false);
                    setIsScanning(true);
                  },
                },
              ],
            );
          } else {
            Alert.alert(t("exhibitor.kiosk.alertScanError"), t("exhibitor.kiosk.alertScanErrorMsg"), [
              {
                text: t("exhibitor.kiosk.alertOk"),
                onPress: () => {
                  setScanned(false);
                  setIsScanning(true);
                },
              },
            ]);
          }
        },
      });
    } else {
      Alert.alert(
        t("exhibitor.kiosk.alertInvalidQr"),
        t("exhibitor.kiosk.alertInvalidQrMsg", { appName }),
        [
          {
            text: t("exhibitor.kiosk.alertTryAgain"),
            onPress: () => setScanned(false),
          },
        ],
      );
    }
  };

  const startScanning = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          t("exhibitor.kiosk.alertCameraPermission"),
          t("exhibitor.kiosk.alertCameraPermissionMsg"),
        );
        return;
      }
    }
    setScanned(false);
    setIsScanning(true);
  };

  const switchToAttendeeView = () => {
    router.push("/(tabs)/digital-id");
  };

  // Scanner view
  if (isScanning) {
    return (
      <FeatureGate flag="digital_id">
      <View style={styles.scannerContainer}>
        <StatusBar barStyle="light-content" />

        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        <View style={styles.scannerOverlay}>
          <SafeAreaView>
            <View style={styles.scannerHeader}>
              <TouchableOpacity
                onPress={() => setIsScanning(false)}
                style={styles.headerButton}
              >
                <Ionicons name="close" size={28} color={COLOR_WHITE_ON_ACCENT} />
              </TouchableOpacity>
              <ThemedText style={styles.scannerTitle}>{t("exhibitor.kiosk.scanVisitorBadge")}</ThemedText>
              <View style={styles.headerButton} />
            </View>
          </SafeAreaView>

          <View style={styles.scanFrameContainer}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </View>

          <SafeAreaView style={styles.scannerBottom}>
            <View style={styles.scannerInstruction}>
              <Ionicons name="qr-code-outline" size={24} color={colors.brand} />
              <ThemedText style={styles.scannerInstructionText}>
                {t("exhibitor.kiosk.pointAtBadge")}
              </ThemedText>
            </View>
          </SafeAreaView>
        </View>
      </View>
      </FeatureGate>
    );
  }

  // Kiosk dashboard view
  return (
    <FeatureGate flag="digital_id">
    <View style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <Ionicons name="rocket" size={20} color={colors.brand} />
          </View>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>{t("exhibitor.kiosk.title")}</ThemedText>
            <ThemedText style={styles.headerSubtitle}>{t("exhibitor.kiosk.subtitle", { appName })}</ThemedText>
          </View>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={switchToAttendeeView}
          >
            <ThemedText style={styles.switchButtonText}>{t("exhibitor.kiosk.attendeeView")}</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
          />
        }
      >
        {/* Hero Scan Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="qr-code" size={36} color={COLOR_WHITE_ON_ACCENT} />
          </View>
          <ThemedText style={styles.heroTitle}>{t("exhibitor.kiosk.readyToScan")}</ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            {t("exhibitor.kiosk.pointCamera")}
          </ThemedText>
          <TouchableOpacity style={styles.scanButton} onPress={startScanning}>
            <Ionicons name="scan-outline" size={24} color={COLOR_WHITE_ON_ACCENT} />
            <ThemedText style={styles.scanButtonText}>{t("exhibitor.kiosk.scanVisitorQr")}</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{t("exhibitor.kiosk.boothActivity")}</ThemedText>
          <View style={styles.liveBadge}>
            <ThemedText style={styles.liveBadgeText}>{t("exhibitor.kiosk.live")}</ThemedText>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>{t("exhibitor.kiosk.scans")}</ThemedText>
            <ThemedText style={styles.statValue}>{totalScans.toLocaleString()}</ThemedText>
            <View
              style={[
                styles.statChange,
                totalScans > 0 && styles.statChangePositive,
              ]}
            >
              <Ionicons
                name={totalScans > 0 ? "trending-up" : "remove"}
                size={12}
                color={totalScans > 0 ? colors.success : colors.textTertiary}
              />
              <ThemedText
                style={[
                  styles.statChangeText,
                  totalScans > 0 && styles.statChangeTextPositive,
                ]}
              >
                {totalScans > 0 ? t("exhibitor.kiosk.active") : "--"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>{t("exhibitor.kiosk.pointsGiven")}</ThemedText>
            <ThemedText style={styles.statValue}>{totalPoints}</ThemedText>
            <View style={styles.statChange}>
              <Ionicons name="star" size={12} color={colors.warning} />
              <ThemedText style={styles.statChangeText}>{t("exhibitor.kiosk.total")}</ThemedText>
            </View>
          </View>

          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>{t("exhibitor.kiosk.uniqueLeads")}</ThemedText>
            <ThemedText style={styles.statValue}>
              {new Set(scanHistory.map((l) => l.scanned_id)).size}
            </ThemedText>
            <View style={styles.statChange}>
              <Ionicons name="people" size={12} color={colors.brand} />
              <ThemedText style={styles.statChangeText}>{t("exhibitor.kiosk.people")}</ThemedText>
            </View>
          </View>
        </View>

        {/* Recent Leads */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{t("exhibitor.kiosk.recentLeads")}</ThemedText>
          <TouchableOpacity>
            <ThemedText style={styles.viewAllText}>{t("exhibitor.kiosk.viewAll")}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.leadsList}>
          {scanHistory.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="scan-outline" size={40} color={colors.textTertiary} />
              <ThemedText style={styles.emptyText}>
                {t("exhibitor.kiosk.noScans")}
              </ThemedText>
            </View>
          )}
          {scanHistory.slice(0, 10).map((log) => (
            <TouchableOpacity
              key={log.id}
              style={styles.leadCard}
              onPress={() =>
                router.push({
                  pathname: "/user/[id]",
                  params: { id: log.scanned_id.toString() },
                })
              }
            >
              <View style={styles.leadAvatarPlaceholder}>
                <Ionicons name="person" size={22} color={colors.textSecondary} />
              </View>
              <View style={styles.leadInfo}>
                <ThemedText style={styles.leadName}>{log.scanned_name}</ThemedText>
                <ThemedText style={styles.leadTitle}>+{log.points_awarded} pts</ThemedText>
              </View>
              <View style={styles.leadMeta}>
                <ThemedText style={styles.leadTime}>
                  {formatTimeAgo(log.created_at)}
                </ThemedText>
                <View
                  style={[
                    styles.leadBadge,
                    {
                      backgroundColor: "rgba(25, 79, 240, 0.1)",
                    },
                  ]}
                >
                  <ThemedText style={[styles.leadBadgeText, { color: colors.brand }]}>
                    {t("exhibitor.kiosk.leadLabel")}
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },

  // Header
  headerSafeArea: {
    backgroundColor: colors.surfaceSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(25, 79, 240, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  switchButton: {
    backgroundColor: "rgba(25, 79, 240, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(25, 79, 240, 0.3)",
  },
  switchButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brand,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Hero Section
  heroSection: {
    margin: 16,
    padding: 24,
    backgroundColor: "rgba(25, 79, 240, 0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(25, 79, 240, 0.2)",
    alignItems: "center",
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 10,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  liveBadge: {
    backgroundColor: "rgba(25, 79, 240, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brand,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    marginBottom: 6,
  },
  statChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statChangePositive: {},
  statChangeNegative: {},
  statChangeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
  },
  statChangeTextPositive: {
    color: colors.success,
  },
  statChangeTextNegative: {
    color: colors.error,
  },

  // Leads
  leadsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  leadCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  leadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(25, 79, 240, 0.2)",
  },
  leadAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(25, 79, 240, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(25, 79, 240, 0.2)",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: "center",
  },
  leadInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leadName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    marginBottom: 2,
  },
  leadTitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  leadMeta: {
    alignItems: "flex-end",
  },
  leadTime: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  leadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  leadBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },

  // Bottom Nav
  bottomNavSafeArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(16, 21, 34, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navItem: {
    alignItems: "center",
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textTertiary,
    marginTop: 4,
    textTransform: "uppercase",
  },
  navLabelActive: {
    color: colors.brand,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: colors.surfacePrimary,
  },

  // Scanner overlay
  scannerContainer: {
    flex: 1,
    backgroundColor: CAMERA_VIEWFINDER_BLACK,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scannerHeader: {
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
  scannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
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
  scannerBottom: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  scannerInstruction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  scannerInstructionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.background,
  },
});
