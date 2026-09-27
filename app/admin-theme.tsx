/**
 * Phase 13 Plan 08 — Admin theme panel, rebuilt per UI-SPEC §3.
 *
 * Layout (top → bottom):
 *   Stack header "Theme"
 *   ScrollView:
 *     Section: Quick start — PresetShortcutRow (13 preset cards)
 *     Section: Colors — 4 × ColorSlotCard stacked vertically + inline
 *              PaletteSwatchGrid below the active slot
 *     Section: Preview — ThemePreviewPane (live)
 *   Footer: sticky Save theme CTA
 *
 * State machine:
 *   - `presetId`  + `color1..4` mirror the 5 AppConfig keys we POST back.
 *   - `activeSlot` ∈ {null,1,2,3,4} drives which slot is "open" for palette tap.
 *   - `dirty` flips true on any preset-apply or swatch-pick; false after save.
 *
 * Save flow: useSetThemeConfig() serialises 5× PUT /admin/config/{key}.
 * On success an Alert confirms; mutation re-hydrates config-store so the
 * admin's own next render reflects the change. End users see the change
 * on the next cold-launch per D-19.
 *
 * No raw hex literals — palette values flow in from `constants/theme-palette.ts`
 * and `constants/theme-presets.ts` as runtime strings. Token colors come from
 * `useColors()` (Plan 03 ratchet compliant).
 */

import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import {
  THEME_PRESETS,
  DEFAULT_PRESET_ID,
  type ThemePreset,
} from "@/constants/theme-presets";
import { ColorSlotCard } from "@/components/admin-theme/ColorSlotCard";
import { PaletteSwatchGrid } from "@/components/admin-theme/PaletteSwatchGrid";
import { PresetShortcutRow } from "@/components/admin-theme/PresetShortcutRow";
import { ThemePreviewPane } from "@/components/admin-theme/ThemePreviewPane";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useSetThemeConfig } from "@/features/admin/hooks/useSetThemeConfig";
import { useResetTheme } from "@/features/admin/hooks/useResetTheme";

type Slot = 1 | 2 | 3 | 4;

function getDefaultPreset(): ThemePreset {
  return (
    THEME_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID) ?? THEME_PRESETS[0]
  );
}

export default function AdminThemeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const storePreset = useConfigStore((s) => s.themePreset);
  const storeOverrides = useConfigStore((s) => s.themeOverrides);

  // Initial slot values: prefer stored overrides, else preset defaults,
  // else global default preset.
  const initialPreset = storePreset ?? getDefaultPreset();
  const [presetId, setPresetId] = useState<string>(initialPreset.id);
  const [color1, setColor1] = useState<string>(
    storeOverrides.color1 ?? initialPreset.primary,
  );
  const [color2, setColor2] = useState<string>(
    storeOverrides.color2 ?? initialPreset.background,
  );
  const [color3, setColor3] = useState<string>(
    storeOverrides.color3 ?? initialPreset.accent,
  );
  const [color4, setColor4] = useState<string>(
    storeOverrides.color4 ?? initialPreset.secondary,
  );
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [dirty, setDirty] = useState<boolean>(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const mutation = useSetThemeConfig();
  const resetMutation = useResetTheme();

  const appName = useConfigStore((s) => s.appName);
  const onReset = () => {
    Alert.alert(
      "Reset theme",
      `This reverts to the default ${appName} theme and clears all custom colors. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await resetMutation.mutateAsync();
              const defaultPreset = getDefaultPreset();
              setPresetId(defaultPreset.id);
              setColor1(defaultPreset.primary);
              setColor2(defaultPreset.background);
              setColor3(defaultPreset.accent);
              setColor4(defaultPreset.secondary);
              setActiveSlot(null);
              setDirty(false);
              Alert.alert(
                "Theme reset",
                "Back to the default theme. Users will see it on next app launch.",
              );
            } catch {
              Alert.alert("Couldn't reset theme", "Please try again.");
            }
          },
        },
      ],
    );
  };

  const applyPreset = (preset: ThemePreset) => {
    setPresetId(preset.id);
    setColor1(preset.primary);
    setColor2(preset.background);
    setColor3(preset.accent);
    // Slot 4 (Surface) — presets don't have a dedicated surface slot; reuse
    // `secondary` as the surface seed. Admin can fine-tune after.
    setColor4(preset.secondary);
    setDirty(true);
  };

  const onSlotPress = (slot: Slot) => {
    // Tapping the currently-active slot collapses the palette; otherwise switch.
    setActiveSlot((curr) => (curr === slot ? null : slot));
  };

  const onSwatchSelect = (hex: string) => {
    if (activeSlot === 1) setColor1(hex);
    else if (activeSlot === 2) setColor2(hex);
    else if (activeSlot === 3) setColor3(hex);
    else if (activeSlot === 4) setColor4(hex);
    setDirty(true);
  };

  const selectedHexForActiveSlot = (): string | null => {
    if (activeSlot === 1) return color1;
    if (activeSlot === 2) return color2;
    if (activeSlot === 3) return color3;
    if (activeSlot === 4) return color4;
    return null;
  };

  const onSave = async () => {
    try {
      await mutation.mutateAsync({
        active_theme_preset_id: presetId,
        theme_color_1: color1,
        theme_color_2: color2,
        theme_color_3: color3,
        theme_color_4: color4,
      });
      Alert.alert(
        "Theme saved",
        "Theme saved. Users will see it on next app launch.",
      );
      setDirty(false);
    } catch {
      Alert.alert("Couldn't save theme", "Please try again.");
    }
  };

  const slotDefs: { slot: Slot; label: string; helper: string; hex: string }[] = [
    {
      slot: 1,
      label: "Color 1 — Primary & CTAs",
      helper: "Buttons, links, active states.",
      hex: color1,
    },
    {
      slot: 2,
      label: "Color 2 — Background",
      helper: "Main app surface.",
      hex: color2,
    },
    {
      slot: 3,
      label: "Color 3 — Accent & highlights",
      helper: "Tab icons, selected chips.",
      hex: color3,
    },
    {
      slot: 4,
      label: "Color 4 — Surface",
      helper: "Cards, modals, input fills.",
      hex: color4,
    },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Theme" }} />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 96 },
          ]}
        >
          {/* --- Section: Quick start ------------------------------------- */}
          <ThemedText style={styles.sectionHeader}>
            Quick start — apply a preset
          </ThemedText>
          <ThemedText style={styles.sectionHelper}>
            Tap a preset to fill all four slots, then fine-tune below.
          </ThemedText>
          <PresetShortcutRow
            activePresetId={presetId}
            onApply={applyPreset}
          />

          {/* --- Section: Colors ----------------------------------------- */}
          <ThemedText style={[styles.sectionHeader, styles.sectionSpacing]}>
            Colors
          </ThemedText>
          {slotDefs.map((def) => (
            <View key={def.slot}>
              <ColorSlotCard
                label={def.label}
                helper={def.helper}
                currentHex={def.hex}
                isActive={activeSlot === def.slot}
                onPress={() => onSlotPress(def.slot)}
                testID={`color-slot-${def.slot}`}
              />
              {activeSlot === def.slot ? (
                <View style={styles.paletteHost}>
                  <ThemedText style={styles.paletteHeader}>Palette</ThemedText>
                  <PaletteSwatchGrid
                    slot={def.slot}
                    selectedHex={selectedHexForActiveSlot()}
                    onSelect={onSwatchSelect}
                  />
                </View>
              ) : null}
            </View>
          ))}

          {/* --- Section: Preview ---------------------------------------- */}
          <ThemedText style={[styles.sectionHeader, styles.sectionSpacing]}>
            Preview
          </ThemedText>
          <ThemedText style={styles.sectionHelper}>
            How the combination looks on common screens.
          </ThemedText>
          <ThemePreviewPane
            color1={color1}
            color2={color2}
            color3={color3}
            color4={color4}
          />
        </ScrollView>

        {/* --- Sticky Save / Reset CTA ----------------------------------- */}
        <View
          style={[
            styles.saveBar,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: colors.background,
              borderTopColor: colors.cardBorder,
            },
          ]}
        >
          <TouchableOpacity
            onPress={onReset}
            disabled={resetMutation.isPending || mutation.isPending}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Reset theme to default"
            accessibilityState={{
              disabled: resetMutation.isPending || mutation.isPending,
            }}
            testID="admin-theme-reset"
            style={[styles.resetBtn, { borderColor: colors.cardBorder }]}
          >
            {resetMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <ThemedText
                style={[styles.resetBtnText, { color: colors.textSecondary }]}
              >
                Reset to default
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onSave}
            disabled={!dirty || mutation.isPending || resetMutation.isPending}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Save theme"
            accessibilityState={{
              disabled: !dirty || mutation.isPending || resetMutation.isPending,
            }}
            testID="admin-theme-save"
            style={[
              styles.saveBtn,
              {
                backgroundColor:
                  !dirty || mutation.isPending || resetMutation.isPending
                    ? colors.textDisabled
                    : colors.primary,
              },
            ]}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <ThemedText style={[styles.saveBtnText, { color: colors.white }]}>
                Save theme
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },
    scroll: {
      padding: 16,
      gap: 12,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    sectionSpacing: {
      marginTop: 16,
    },
    sectionHelper: {
      fontSize: 11,
      fontWeight: "400",
      color: colors.textSecondary,
      marginBottom: 12,
    },
    paletteHost: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    paletteHeader: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },
    saveBar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
    },
    resetBtn: {
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 40,
      marginBottom: 8,
    },
    resetBtnText: {
      fontSize: 13,
      fontWeight: "600",
    },
    saveBtn: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
    },
    saveBtnText: {
      fontSize: 14,
      fontWeight: "700",
    },
  });
