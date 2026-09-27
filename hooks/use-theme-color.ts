/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, applyThemePreset } from '@/constants/theme';
import { useConfigStore } from '@/features/config/stores/config-store';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  const themePreset = useConfigStore((s) => s.themePreset);
  const themed = applyThemePreset(Colors[theme], themePreset);
  return themed[colorName];
}
