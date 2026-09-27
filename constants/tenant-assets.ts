import Constants from "expo-constants";
import type { ImageSourcePropType } from "react-native";

const tenantLogoSources: Record<string, ImageSourcePropType> = {
  "future-unfold": require("@/assets/tenants/future-unfold/logo.png"),
};

// "primary" (hand + flowers) is used on the boot splash, login, sign up, and
// home screens. "secondary" (flowers only, no hand) is used everywhere else.
const tenantBackgroundSources: Record<string, ImageSourcePropType> = {
  "future-unfold": require("@/assets/tenants/future-unfold/background.png"),
};

const tenantSecondaryBackgroundSources: Record<string, ImageSourcePropType> = {
  "future-unfold": require("@/assets/tenants/future-unfold/background-flowers-only.png"),
};

const tenantAgendaSources: Record<
  string,
  { en: ImageSourcePropType; el: ImageSourcePropType }
> = {
  "future-unfold": {
    en: require("@/assets/tenants/future-unfold/agenda-en.jpg"),
    el: require("@/assets/tenants/future-unfold/agenda-el.jpg"),
  },
};

const tenantFontFamilies: Record<string, { regular: string; bold: string }> = {
  "future-unfold": {
    regular: "GTWalsheimPro-Regular",
    bold: "GTWalsheimPro-Bold",
  },
};

export function getTenantKey(): string {
  return (
    (Constants.expoConfig?.extra as { tenant?: string } | undefined)?.tenant ??
    "panathenea"
  );
}

export function getTenantAgendaSource(
  locale: string,
): ImageSourcePropType | null {
  const agenda = tenantAgendaSources[getTenantKey()];
  if (!agenda) return null;

  return locale.toLowerCase().startsWith("el") ? agenda.el : agenda.en;
}

export function getTenantLogoSource(): ImageSourcePropType | null {
  const tenant = getTenantKey();

  return tenantLogoSources[tenant] ?? null;
}

export function getTenantBackgroundSource(
  variant: "primary" | "secondary" = "primary",
): ImageSourcePropType | null {
  const tenant = getTenantKey();
  const sources =
    variant === "secondary" ? tenantSecondaryBackgroundSources : tenantBackgroundSources;

  return sources[tenant] ?? null;
}

export function hasTenantBrandAssets(): boolean {
  const tenant = getTenantKey();

  return Boolean(tenantLogoSources[tenant] || tenantBackgroundSources[tenant]);
}

export function getTenantFontFamily(
  weight: "regular" | "bold" = "regular",
): string | undefined {
  const tenant = getTenantKey();

  return tenantFontFamilies[tenant]?.[weight];
}
