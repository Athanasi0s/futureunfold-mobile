import { Colors, applyThemePreset } from "@/constants/theme";
import { useResolvedTheme, useResolvedThemeOverrides } from "@/hooks/useResolvedTheme";
import { useColorScheme } from "react-native";

export function useColors() {
  const theme = useColorScheme() ?? "light";
  const resolvedPreset = useResolvedTheme();
  const overrides = useResolvedThemeOverrides();
  return applyThemePreset(Colors[theme], resolvedPreset, overrides);
}
