import { MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, { forwardRef, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { CategoryColors, CategoryIcons, DensityColors, MapColors } from "../constants/colors";
import { useMapStore } from "../stores/map-store";
import { useDensity } from "../hooks/useDensity";
import type { EntityCategory } from "@/api/schemas";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";

interface EntitySheetProps {
  onCtaPress: (entityId: number) => void;
  onNavigatePress: (entityId: number) => void;
}

const EntitySheet = forwardRef<BottomSheet, EntitySheetProps>(
  function EntitySheet({ onCtaPress, onNavigatePress }, ref) {
    const { t } = useTranslation();
    const selectedEntity = useMapStore((s) => s.selectedEntity);
    const clearSelection = useMapStore((s) => s.clearSelection);
    const showCrowdView = useMapStore((s) => s.showCrowdView);
    const { densityMap } = useDensity(showCrowdView);
    const snapPoints = useMemo(() => ["30%"], []);

    const DESCRIPTION_FALLBACK: Record<EntityCategory, string> = {
      exhibitor: t("map.entitySheet.descExhibitor"),
      stage: t("map.entitySheet.descStage"),
      amenity: t("map.entitySheet.descAmenity"),
      sponsor: t("map.entitySheet.descSponsor"),
    };

    const DENSITY_LABELS: Record<string, { text: string; color: string }> = {
      green: { text: t("map.entitySheet.densityGreen"), color: DensityColors.green },
      yellow: { text: t("map.entitySheet.densityYellow"), color: DensityColors.yellow },
      orange: { text: t("map.entitySheet.densityOrange"), color: DensityColors.orange },
      red: { text: t("map.entitySheet.densityRed"), color: DensityColors.red },
    };

    const handleSheetChange = (index: number) => {
      if (index === -1 && selectedEntity !== null) {
        clearSelection();
      }
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableDynamicSizing={false}
        onChange={handleSheetChange}
        backgroundStyle={{ backgroundColor: MapColors.surface }}
        handleIndicatorStyle={{ backgroundColor: MapColors.textSecondary }}
      >
        <BottomSheetView style={styles.content}>
          {selectedEntity && (
            <>
              <View style={styles.row}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: CategoryColors[selectedEntity.category] },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      (CategoryIcons[selectedEntity.category] ?? "map-marker") as React.ComponentProps<
                        typeof MaterialCommunityIcons
                      >["name"]
                    }
                    size={24}
                    color={MapColors.text}
                  />
                </View>

                <View style={styles.info}>
                  <ThemedText style={styles.name}>{selectedEntity.name}</ThemedText>
                  <View
                    style={[
                      styles.badge,
                      { borderColor: CategoryColors[selectedEntity.category] },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.badgeText,
                        { color: CategoryColors[selectedEntity.category] },
                      ]}
                    >
                      {selectedEntity.category.toUpperCase()}
                    </ThemedText>
                  </View>
                  {showCrowdView && (() => {
                    const bucket = densityMap.get(selectedEntity.id);
                    const label = bucket ? DENSITY_LABELS[bucket] : null;
                    if (!label) return null;
                    return (
                      <ThemedText style={[styles.densityLabel, { color: label.color }]}>
                        {label.text}
                      </ThemedText>
                    );
                  })()}
                  <ThemedText style={styles.description}>
                    {selectedEntity.description ??
                      DESCRIPTION_FALLBACK[selectedEntity.category as EntityCategory]}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.ctaRow}>
                <Pressable
                  style={[styles.cta, { flex: 1 }]}
                  onPress={() => onCtaPress(selectedEntity.id)}
                >
                  <ThemedText style={styles.ctaText}>
                    View{" "}
                    {selectedEntity.category.charAt(0).toUpperCase() +
                      selectedEntity.category.slice(1)}{" "}
                    {"\u2192"}
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={styles.navigateBtn}
                  onPress={() => onNavigatePress(selectedEntity.id)}
                >
                  <MaterialCommunityIcons
                    name="navigation-variant"
                    size={22}
                    color={MapColors.background}
                  />
                </Pressable>
              </View>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

export default EntitySheet;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: MapColors.text,
  },
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: MapColors.textSecondary,
  },
  densityLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  ctaRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
  },
  cta: {
    backgroundColor: MapColors.ctaButton,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  navigateBtn: {
    backgroundColor: MapColors.locationDot,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "bold",
    color: MapColors.background,
  },
});
