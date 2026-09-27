import Constants from "expo-constants";

/**
 * Resolves the backend API base URL for this tenant at runtime.
 *
 * Priority order (highest wins):
 *   1. `EXPO_PUBLIC_API_OVERRIDE` — explicit local-dev override. Set this in
 *      `.env` to point the app at a locally running backend (e.g.
 *      `http://<LAN_IP>:8000`). Name was chosen to make it obvious this is
 *      an override, not the default.
 *   2. `Constants.expoConfig.extra.apiBaseUrl` — baked in at build time from
 *      the tenant's entry in `app.config.ts`. This is the correct value for
 *      every production / TestFlight / Play-internal build.
 *   3. `EXPO_PUBLIC_API_BASE_URL` — **deprecated** alias kept for backward
 *      compatibility with existing local `.env` files. Will be removed once
 *      all developers migrate to `EXPO_PUBLIC_API_OVERRIDE`.
 *
 * The tenant-baked value is preferred over the env var to prevent the class
 * of bug seen during Phase E techsaloniki onboarding, where a stale
 * `EXPO_PUBLIC_API_BASE_URL=https://festapp-api-panathenea.fly.dev` leaked
 * into a fresh techsaloniki build and pointed it at the wrong backend.
 *
 * IMPORTANT local-dev targets if you set `EXPO_PUBLIC_API_OVERRIDE`:
 *   - Real device (same WiFi): `http://<PC_LAN_IP>:8000`
 *   - Android emulator:         `http://10.0.2.2:8000`
 *   - iOS simulator:            `http://localhost:8000`
 */
export function getApiBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_OVERRIDE;
  if (override) return override;

  const tenantBaked = (
    Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined
  )?.apiBaseUrl;
  if (tenantBaked) return tenantBaked;

  const legacy = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (legacy) return legacy;

  return "";
}
