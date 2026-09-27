import { FeatureGate } from "@/components/feature-gate";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useGetEntityProfile } from "@/features/map/hooks/useGetEntityProfile";
import { CategoryColors, CategoryIcons, DensityColors, MapColors } from "@/features/map/constants/colors";
import { COLOR_BLACK_ON_LIGHT_ACCENT } from "@/constants/theme";
import type { EntityCategory } from "@/api/schemas";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

const CATEGORY_LABELS: Record<EntityCategory, string> = {
  exhibitor: "EXHIBITOR",
  stage: "STAGE",
  amenity: "AMENITY",
  sponsor: "SPONSOR",
};

function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function MapEntityScreen() {
  return (
    <FeatureGate flag="map">
      <MapEntityContent />
    </FeatureGate>
  );
}

function MapEntityContent() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entityId = Number(id);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data: entity, isLoading, isError, refetch } = useGetEntityProfile(entityId);

  const handleMessage = useCallback(() => {
    Alert.alert(t("map.entity.comingSoon"), t("map.entity.messagingNotAvailable"));
  }, [t]);

  const handleMyProgramme = useCallback(() => {
    Alert.alert(t("map.entity.comingSoon"), t("map.entity.programmeNotAvailable"));
  }, [t]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={MapColors.ctaButton} />
      </View>
    );
  }

  if (isError || !entity) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={MapColors.textSecondary} />
        <ThemedText style={styles.errorText}>{t("map.entity.loadFailed")}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <ThemedText style={styles.retryButtonText}>{t("map.entity.retry")}</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const color = CategoryColors[entity.category] ?? MapColors.accent;
  const iconName = CategoryIcons[entity.category] ?? "map-marker";
  const categoryLabel = CATEGORY_LABELS[entity.category] ?? entity.category.toUpperCase();

  return (
    <View style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={MapColors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{t("map.entity.header")}</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {entity.avatar_url ? (
              <Image
                source={{ uri: entity.avatar_url }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: `${color}33` }]}>
                <ThemedText style={[styles.avatarInitials, { color }]}>
                  {getInitials(entity.name)}
                </ThemedText>
              </View>
            )}

            {entity.is_online && <View style={styles.onlineDot} />}
          </View>

          {/* Name */}
          <ThemedText style={styles.name}>{entity.name}</ThemedText>

          {/* Company */}
          {entity.company && (
            <ThemedText style={styles.company}>{entity.company}</ThemedText>
          )}

          {/* Category badge */}
          <View style={[styles.categoryBadge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
            <MaterialCommunityIcons
              name={iconName as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
              size={13}
              color={color}
            />
            <ThemedText style={[styles.categoryBadgeText, { color }]}>{categoryLabel}</ThemedText>
          </View>
        </View>

        {/* About */}
        {entity.about && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{t("map.entity.about")}</ThemedText>
            <ThemedText style={styles.sectionBody}>{entity.about}</ThemedText>
          </View>
        )}

        {/* Description fallback */}
        {!entity.about && entity.description && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{t("map.entity.description")}</ThemedText>
            <ThemedText style={styles.sectionBody}>{entity.description}</ThemedText>
          </View>
        )}

        {/* Bottom padding for fixed bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleMessage}>
          <MaterialCommunityIcons name="message-outline" size={20} color={MapColors.text} />
          <ThemedText style={styles.secondaryButtonText}>{t("map.entity.message")}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleMyProgramme}>
          <MaterialCommunityIcons name="calendar-outline" size={20} color={COLOR_BLACK_ON_LIGHT_ACCENT} />
          <ThemedText style={styles.primaryButtonText}>{t("map.entity.myProgramme")}</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MapColors.background,
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: MapColors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 24,
  },
  errorText: {
    color: MapColors.text,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: MapColors.ctaButton,
    borderRadius: 10,
  },
  retryButtonText: {
    color: COLOR_BLACK_ON_LIGHT_ACCENT,
    fontSize: 14,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: MapColors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: MapColors.textSecondary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  avatarSection: {
    alignItems: "center",
    paddingBottom: 28,
    gap: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 38,
    fontWeight: "700",
  },
  onlineDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: DensityColors.green,
    borderWidth: 2,
    borderColor: MapColors.background,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: MapColors.text,
    textAlign: "center",
  },
  company: {
    fontSize: 15,
    color: MapColors.textSecondary,
    textAlign: "center",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  section: {
    marginBottom: 24,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: MapColors.text,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: MapColors.textSecondary,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: "rgba(21, 23, 24, 0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: MapColors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1.4,
    height: 52,
    borderRadius: 14,
    backgroundColor: MapColors.ctaButton,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: COLOR_BLACK_ON_LIGHT_ACCENT,
    fontSize: 14,
    fontWeight: "700",
  },
});
