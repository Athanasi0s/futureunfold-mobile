import type { ExpoConfig } from "expo/config";

// ----------------------------------------------------------------------------
// Tenant map — each entry fully describes one shipped app.
// Selected at build time via `process.env.TENANT` (default: "panathenea").
//
// Adding a new tenant:
//   1. Append an entry here.
//   2. Create `assets/tenants/<slug>/` with icon.png, splash-icon.png,
//      favicon.png, google-services.json, GoogleService-Info.plist.
//   3. Add `<slug>-development` / `<slug>-preview` / `<slug>-production`
//      profiles to eas.json.
//
// Store identities are BAKED AT BUILD TIME via bundleIdentifier + android.package.
// Once a tenant is live on the stores, NEVER change those IDs — you can't migrate
// an existing store listing to a new bundleId.
//
// NOTE: this map is inlined into app.config.ts rather than imported from a
// sibling file because Expo's config loader evaluates app.config.ts through
// a Node resolver that doesn't understand `.ts` sibling imports without
// configuration. Keeping it here is also the simplest option — runtime code
// reads tenant info from Constants.expoConfig.extra, not from this map.
// ----------------------------------------------------------------------------

type TenantKey =
  | "panathenea"
  | "future-unfold"
  | "techsaloniki"
  | "reworks"
  | "primer";

interface TenantConfig {
  readonly key: TenantKey;
  readonly name: string;              // Expo project name (mostly dev-tool-facing)
  readonly appName: string;           // User-facing brand shown in UI + shares. Fallback when backend AppConfig.app_name is unset.
  readonly slug: string;
  readonly scheme: string | string[];
  readonly ios: {
    readonly bundleIdentifier: string;
    readonly buildNumber: string;
  };
  readonly android: {
    readonly package: string;
    readonly googleServicesFile?: string;
  };
  readonly apiBaseUrl: string;
  readonly defaultThemePresetId: string;
  readonly portraitUrl?: string;
  readonly easProjectId?: string;
  readonly easChannel: string;
  readonly icon: string;
  readonly adaptiveIcon: string;
  readonly splashIcon: string;
  readonly nativeSplashIcon: string;
  readonly splashBackgroundColor: string;
  readonly favicon: string;
}

const PANATHENEA_ASSETS = "./assets/tenants/panathenea";
const FUTURE_UNFOLD_ASSETS = "./assets/tenants/future-unfold";
const TECHSALONIKI_ASSETS = "./assets/tenants/techsaloniki";
const REWORKS_ASSETS = "./assets/tenants/reworks";
const PRIMER_ASSETS = "./assets/tenants/primer";

// NOTE: Each tenant has its OWN EAS project. Expo enforces a 1:1 mapping
// between slug and projectId, so different slugs -> different EAS projects.
// Creating a new tenant requires creating a new Expo project in the dashboard
// (expo.dev -> Projects -> Create project) and pasting its ID below.
const tenants: Record<TenantKey, TenantConfig> = {
  panathenea: {
    key: "panathenea",
    name: "fest-app",                                   // LOCKED — current store listing name
    appName: "Panathenea",
    slug: "fest-app",                                   // LOCKED
    scheme: "panatheneamobile",                         // LOCKED — deep links already in the wild
    ios: {
      bundleIdentifier: "com.festapp.panathenea",       // LOCKED
      buildNumber: "3",                                 // bump on each TestFlight/App Store upload
    },
    android: {
      package: "com.festapp.festapp",                   // LOCKED (legacy mismatch; grandfathered)
      googleServicesFile: `${PANATHENEA_ASSETS}/google-services.json`,
    },
    apiBaseUrl: "https://festapp-api-panathenea.fly.dev",
    defaultThemePresetId: "midnight-indigo",
    easProjectId: "33acd6a7-a583-4fa1-8a5a-93a601b4c66d",
    easChannel: "production",                           // LOCKED — existing OTA installs listen here
    icon: `${PANATHENEA_ASSETS}/icon.png`,
    adaptiveIcon: `${PANATHENEA_ASSETS}/icon.png`,
    splashIcon: `${PANATHENEA_ASSETS}/splash-icon.png`,
    nativeSplashIcon: `${PANATHENEA_ASSETS}/splash-icon.png`,
    splashBackgroundColor: "#ffffff",
    favicon: `${PANATHENEA_ASSETS}/favicon.png`,
  },
  "future-unfold": {
    key: "future-unfold",
    name: "FUTURE UNFOLD",
    appName: "FUTURE UNFOLD",
    slug: "fest-app",                                   // Existing Expo project supplied for Future Unfold
    // Keep the legacy scheme during the preview phase while adding the
    // production Future Unfold scheme used by EVENTORA magic links.
    scheme: ["futureunfold", "panatheneamobile"],
    ios: {
      bundleIdentifier: "com.festapp.futureunfold",
      buildNumber: "1",
    },
    android: {
      package: "com.festapp.futureunfold",
      // Add a Firebase configuration for this package before enabling
      // Android push notifications in production.
    },
    apiBaseUrl: "https://festapp-api-future-unfold.fly.dev",
    defaultThemePresetId: "future-unfold",
    portraitUrl: "https://gtfutureunfold.gr",
    easProjectId: "33acd6a7-a583-4fa1-8a5a-93a601b4c66d",
    easChannel: "future-unfold-production",
    icon: `${FUTURE_UNFOLD_ASSETS}/icon.png`,
    adaptiveIcon: `${FUTURE_UNFOLD_ASSETS}/icon.png`,
    splashIcon: `${FUTURE_UNFOLD_ASSETS}/splash.png`,
    nativeSplashIcon: `${FUTURE_UNFOLD_ASSETS}/splash-transparent.png`,
    splashBackgroundColor: "#1e0e3e",
    favicon: `${FUTURE_UNFOLD_ASSETS}/icon.png`,
  },
  techsaloniki: {
    key: "techsaloniki",
    name: "TECHSALONIKI",
    appName: "TECHSALONIKI",
    slug: "techsaloniki",
    scheme: "techsaloniki",
    ios: {
      bundleIdentifier: "com.festapp.techsaloniki",
      buildNumber: "1",
    },
    android: {
      package: "com.festapp.techsaloniki",
      googleServicesFile: `${TECHSALONIKI_ASSETS}/google-services.json`,
    },
    apiBaseUrl: "https://festapp-api-techsaloniki.fly.dev",
    defaultThemePresetId: "midnight-indigo",
    easProjectId: "403fc26d-f725-4dcd-b1a6-c6dcf014021d",
    easChannel: "techsaloniki-production",              // own channel — no existing installs to preserve
    icon: `${TECHSALONIKI_ASSETS}/icon.png`,
    adaptiveIcon: `${TECHSALONIKI_ASSETS}/adaptive-icon.png`,
    splashIcon: `${TECHSALONIKI_ASSETS}/splash-icon.png`,
    nativeSplashIcon: `${TECHSALONIKI_ASSETS}/splash-icon.png`,
    splashBackgroundColor: "#ffffff",
    favicon: `${TECHSALONIKI_ASSETS}/favicon.png`,
  },
  reworks: {
    key: "reworks",
    name: "reworks",
    appName: "reworks",
    slug: "reworks",
    scheme: "reworks",
    ios: {
      bundleIdentifier: "com.festapp.reworks",
      buildNumber: "1",
    },
    android: {
      package: "com.festapp.reworks",
      googleServicesFile: `${REWORKS_ASSETS}/google-services.json`,
    },
    apiBaseUrl: "https://festapp-api-reworks.fly.dev",
    defaultThemePresetId: "midnight-indigo",
    easProjectId: "4c4cfe0d-085d-43c0-92fe-1b07802085f0",
    easChannel: "reworks-production",
    icon: `${REWORKS_ASSETS}/icon.png`,
    adaptiveIcon: `${REWORKS_ASSETS}/adaptive-icon.png`,
    splashIcon: `${REWORKS_ASSETS}/splash-icon.png`,
    nativeSplashIcon: `${REWORKS_ASSETS}/splash-icon.png`,
    splashBackgroundColor: "#ffffff",
    favicon: `${REWORKS_ASSETS}/favicon.png`,
  },
  primer: {
    key: "primer",
    name: "primer",
    appName: "Primer Festival",
    slug: "primer",
    scheme: "primer",
    ios: {
      bundleIdentifier: "com.festapp.primer",
      buildNumber: "1",
    },
    android: {
      package: "com.festapp.primer",
      googleServicesFile: `${PRIMER_ASSETS}/google-services.json`,
    },
    apiBaseUrl: "https://festapp-api-primer.fly.dev",
    defaultThemePresetId: "midnight-indigo",
    easProjectId: "f65f067a-4a0b-49d1-bec2-4513b0735b12",
    easChannel: "primer-production",
    icon: `${PRIMER_ASSETS}/icon.png`,
    adaptiveIcon: `${PRIMER_ASSETS}/adaptive-icon.png`,
    splashIcon: `${PRIMER_ASSETS}/splash-icon.png`,
    nativeSplashIcon: `${PRIMER_ASSETS}/splash-icon.png`,
    splashBackgroundColor: "#ffffff",
    favicon: `${PRIMER_ASSETS}/favicon.png`,
  },
};

function getTenant(key: string | undefined): TenantConfig {
  const resolved = (key ?? "panathenea") as TenantKey;
  if (!(resolved in tenants)) {
    const known = Object.keys(tenants).join(", ");
    throw new Error(`Unknown TENANT=${key}. Known tenants: ${known}`);
  }
  return tenants[resolved];
}

// ----------------------------------------------------------------------------
// Expo config
// ----------------------------------------------------------------------------

export default (): ExpoConfig => {
  const tenant = getTenant(process.env.TENANT);

  return {
    name: tenant.name,
    slug: tenant.slug,
    owner: "feststats",                     // Expo account / org that owns every tenant's EAS project
    version: tenant.key === "future-unfold" ? "1.1.0" : "1.0.0",
    orientation: "portrait",
    icon: tenant.icon,
    scheme: tenant.scheme,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: tenant.ios.bundleIdentifier,
      buildNumber: tenant.ios.buildNumber,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: tenant.adaptiveIcon,
        backgroundColor: tenant.splashBackgroundColor,
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      ...(tenant.key === "future-unfold" ? { versionCode: 2 } : {}),
      // @ts-expect-error — valid Expo Android config per docs (allows http://<IP>:8000 local dev backends) but missing from current @types
      usesCleartextTraffic: true,
      package: tenant.android.package,
      ...(tenant.android.googleServicesFile
        ? { googleServicesFile: tenant.android.googleServicesFile }
        : {}),
    },
    web: {
      output: "static",
      favicon: tenant.favicon,
    },
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          defaultChannel: "default",
          androidChannels: [
            {
              name: "default",
              importance: 4,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: "#FF231F7C",
            },
          ],
        },
      ],
      [
        "expo-splash-screen",
        {
          image: tenant.nativeSplashIcon,
          imageWidth: 414,
          resizeMode: "cover",
          enableFullScreenImage_legacy: true,
          backgroundColor: tenant.splashBackgroundColor,
          dark: {
            image: tenant.nativeSplashIcon,
            backgroundColor: tenant.splashBackgroundColor,
          },
        },
      ],
      "expo-secure-store",
      "@react-native-community/datetimepicker",
      "@sentry/react-native",
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsVersion: "11.16.0",
        },
      ],
      "expo-web-browser",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      ...(tenant.easProjectId ? { eas: { projectId: tenant.easProjectId } } : {}),
      tenant: tenant.key,
      appName: tenant.appName,
      apiBaseUrl: tenant.apiBaseUrl,
      defaultThemePresetId: tenant.defaultThemePresetId,
      ...(tenant.portraitUrl ? { portraitUrl: tenant.portraitUrl } : {}),
    },
  };
};
