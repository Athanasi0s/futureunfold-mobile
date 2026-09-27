import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CHIP_CONFIG, MapColors } from "../constants/colors";
import { useMapStore } from "../stores/map-store";
import type { EntityCategory } from "@/api/schemas";
import { getTenantFontFamily } from "@/constants/tenant-assets";

const tenantFontFamily = getTenantFontFamily("regular");

interface FilterChipProps {
  label: string;
  icon: string;
  active: boolean;
  color: string;
  onToggle: () => void;
}

function FilterChip({ label, icon, active, color, onToggle }: FilterChipProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const activeAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(activeAnim, {
      toValue: active ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [active]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggle();
  };

  const borderOpacity = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
      <Animated.View style={[styles.chip, { transform: [{ scale }] }]}>
        <Animated.View style={[styles.chipBorder, { opacity: borderOpacity }]} />
        <Animated.View style={[styles.chipActiveBg, { opacity: activeAnim }]} />
        <View style={styles.chipContent}>
          <View style={styles.iconContainer}>
            <Animated.View style={{ opacity: borderOpacity, position: "absolute" }}>
              <MaterialCommunityIcons
                name={icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                size={16}
                color={MapColors.textSecondary}
              />
            </Animated.View>
            <Animated.View style={{ opacity: activeAnim }}>
              <MaterialCommunityIcons
                name={icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                size={16}
                color={color}
              />
            </Animated.View>
          </View>
          <View>
            <Animated.Text style={[styles.chipText, { opacity: borderOpacity, position: "absolute" }]}>
              {label}
            </Animated.Text>
            <Animated.Text style={[styles.chipTextActive, { opacity: activeAnim }]}>
              {label}
            </Animated.Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function FilterChips() {
  const filters = useMapStore((s) => s.filters);
  const toggleFilter = useMapStore((s) => s.toggleFilter);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { top: insets.top + 8 }]}>
      {CHIP_CONFIG.map((chip) => (
        <FilterChip
          key={chip.key}
          label={chip.label}
          icon={chip.icon}
          active={filters[chip.key]}
          color={chip.color}
          onToggle={() => toggleFilter(chip.key as EntityCategory)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    backgroundColor: MapColors.filterBar,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  chip: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  chipBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  chipActiveBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    backgroundColor: MapColors.accent,
  },
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 4,
  },
  iconContainer: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
    color: MapColors.textSecondary,
    ...(tenantFontFamily ? { fontFamily: tenantFontFamily } : null),
  },
  chipTextActive: {
    fontSize: 12,
    fontWeight: "500",
    color: MapColors.text,
    ...(tenantFontFamily ? { fontFamily: tenantFontFamily } : null),
  },
});
