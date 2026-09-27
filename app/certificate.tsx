import { FeatureGate } from "@/components/feature-gate";
import { CertificateView } from "@/features/points/components/CertificateView";
import { useCertificateCache, useCertificateData } from "@/features/points/hooks";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { useColors } from "@/hooks/use-colors";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
export default function CertificateScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const router = useRouter();
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useCertificateData();
  const { getCached, saveCache, clearCache } = useCertificateCache();
  const certificateRef = useRef<View>(null);

  const [generatedUri, setGeneratedUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  // Check cache on data load
  useEffect(() => {
    if (data) {
      getCached(data.template_version).then((uri) => {
        if (uri) {
          setGeneratedUri(uri);
          setIsPreviewMode(true);
        }
      });
    }
  }, [data, getCached]);

  const handleGenerate = useCallback(async () => {
    if (!certificateRef.current || !data) return;

    setIsGenerating(true);
    try {
      // Small delay to ensure the view is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 300));

      const template = data.template;
      const orientation = (template as any).orientation ?? "landscape";
      const dims = orientation === "portrait"
        ? { width: 566, height: 800 }
        : { width: 800, height: 566 };

      const uri = await captureRef(certificateRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: dims.width,
        height: dims.height,
      });

      await saveCache(uri, data.template_version);
      setGeneratedUri(uri);
      setIsPreviewMode(true);
    } catch {
      Alert.alert(t("certificate.error"), t("certificate.generateError"));
    } finally {
      setIsGenerating(false);
    }
  }, [data, saveCache, t]);

  const handleRegenerate = useCallback(async () => {
    await clearCache();
    setGeneratedUri(null);
    setIsPreviewMode(false);
    // Wait for state to clear, then generate
    setTimeout(() => handleGenerate(), 100);
  }, [clearCache, handleGenerate]);

  const handleShare = useCallback(async () => {
    if (!generatedUri) return;

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(t("certificate.sharingNotAvailable"), t("certificate.sharingNotAvailableMessage"));
      return;
    }

    await Sharing.shareAsync(generatedUri, {
      mimeType: "image/png",
      dialogTitle: t("certificate.shareTitle"),
    });
  }, [generatedUri, t]);

  const handleSaveToPhotos = useCallback(async () => {
    if (!generatedUri) return;

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("certificate.permissionRequired"),
        t("certificate.permissionMessage"),
      );
      return;
    }

    try {
      await MediaLibrary.saveToLibraryAsync(generatedUri);
      Alert.alert(t("certificate.saved"), t("certificate.savedMessage"));
    } catch {
      Alert.alert(t("certificate.error"), t("certificate.saveError"));
    }
  }, [generatedUri, t]);

  return (
    <FeatureGate flag="certificates">
    <View style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("certificate.title")}</ThemedText>
          <View style={styles.headerBtn} />
        </View>
      </SafeAreaView>

      {/* Off-screen certificate view for capture — always rendered */}
      <View style={styles.offscreen} pointerEvents="none">
        {data && <CertificateView ref={certificateRef} data={data} />}
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.brand} />
            <ThemedText style={styles.stateText}>{t("certificate.loading")}</ThemedText>
          </View>
        )}

        {isError && !isLoading && (
          <View style={styles.centerState}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <ThemedText style={styles.stateText}>{t("certificate.loadError")}</ThemedText>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <ThemedText style={styles.retryBtnText}>{t("certificate.tryAgain")}</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {data && !isLoading && !isPreviewMode && (
          <View style={styles.centerState}>
            <Ionicons name="ribbon-outline" size={64} color={colors.brand} />
            <ThemedText style={styles.generateTitle}>{t("certificate.readyTitle")}</ThemedText>
            <ThemedText style={styles.generateSubtitle}>
              {t("certificate.readySubtitle")}
            </ThemedText>
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={COLOR_WHITE_ON_ACCENT} />
              ) : (
                <Ionicons name="create-outline" size={20} color={COLOR_WHITE_ON_ACCENT} />
              )}
              <ThemedText style={styles.generateBtnText}>
                {isGenerating ? t("certificate.generating") : t("certificate.generate")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {isPreviewMode && generatedUri && (
          <View style={styles.previewContainer}>
            {/* Preview image */}
            <View style={styles.previewImageWrap}>
              <Image
                source={{ uri: generatedUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </View>

            {/* Action buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={COLOR_WHITE_ON_ACCENT} />
                <ThemedText style={styles.actionBtnText}>{t("certificate.share")}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleSaveToPhotos}>
                <Ionicons name="download-outline" size={20} color={COLOR_WHITE_ON_ACCENT} />
                <ThemedText style={styles.actionBtnText}>{t("certificate.saveToPhotos")}</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Regenerate button */}
            <TouchableOpacity style={styles.regenerateBtn} onPress={handleRegenerate}>
              <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} />
              <ThemedText style={styles.regenerateBtnText}>{t("certificate.regenerate")}</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  headerSafe: {
    backgroundColor: colors.surfacePrimary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
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
  offscreen: {
    position: "absolute",
    left: -9999,
    top: 0,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  generateTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginTop: 8,
  },
  generateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 8,
    marginTop: 16,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  generateBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  previewContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  previewImageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  previewImage: {
    width: 340,
    height: 480,
    borderRadius: 16,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  regenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  regenerateBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
