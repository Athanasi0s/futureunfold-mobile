# Adding a New Tenant (Mobile)

Mobile-side steps for wiring a new tenant into the FestApp Expo project.

This doc lives in the mobile repo so a frontend-only contributor can add a
tenant without touching the backend. It mirrors **Step 6 (Mobile config)** +
**Step 8 (First build)** of the backend runbook
(`festapp-backend/docs/ONBOARDING_NEW_TENANT.md`).

**Prerequisites:**

- The backend tenant has already been provisioned via
  `festapp-backend/scripts/provision_tenant.sh` — `https://festapp-api-<slug>.fly.dev/health`
  should return 200 before you start.
- The customer has supplied branding assets (or you're shipping with
  Panathenea placeholders and swapping before store submission).
- You have write access to the `feststats` Expo org and `gh` / `eas` CLI set
  up locally.

---

## Step 1 — Create an EAS project

Expo enforces a **1:1 slug → projectId mapping**, so every tenant needs its
own Expo project.

1. Visit [expo.dev/accounts/feststats/projects](https://expo.dev/accounts/feststats/projects)
2. **Create a new project** — slug must match the tenant slug exactly
3. Copy the project UUID — you'll paste it into `app.config.ts` in Step 3

---

## Step 2 — Drop in branding + Firebase assets

Create `assets/tenants/<slug>/` with 6 files:

| File | Purpose |
|---|---|
| `icon.png` (1024×1024) | App icon (iOS + web) |
| `adaptive-icon.png` | Android foreground layer |
| `splash-icon.png` | Splash screen |
| `favicon.png` | Web |
| `google-services.json` | Android Firebase (push) — package must match `com.festapp.<slug>` |
| `GoogleService-Info.plist` | iOS Firebase (push) — bundleId must match `com.festapp.<slug>` |

Convention for source files: if you have working/Figma/reference images
alongside the 4 canonical PNGs, stash them under
`assets/tenants/<slug>/source/` or delete them. Don't commit uncategorised
extras.

**Skip Firebase files** if the tenant won't use push notifications — but know
that push-token registration will be a no-op in the app.

---

## Step 3 — Add the tenant entry to `app.config.ts`

Two edits in `app.config.ts`:

### 3.1 — Extend the `TenantKey` union and asset constant list

```ts
type TenantKey = "panathenea" | "techsaloniki" | "<slug>";

// ...

const <SLUG_UPPERCASE>_ASSETS = "./assets/tenants/<slug>";
```

### 3.2 — Add the tenant entry inside the `tenants` map

```ts
<slug>: {
  key: "<slug>",
  name: "<Expo Dev Name>",              // shown in Expo Go / dev tools
  appName: "<User-Facing Brand>",       // shown in UI + shares
  slug: "<slug>",
  scheme: "<slug>",                     // deep-link scheme
  ios: {
    bundleIdentifier: "com.festapp.<slug>",
    buildNumber: "1",
  },
  android: {
    package: "com.festapp.<slug>",
    googleServicesFile: `${<SLUG_UPPERCASE>_ASSETS}/google-services.json`,
  },
  apiBaseUrl: "https://festapp-api-<slug>.fly.dev",
  easProjectId: "<UUID from Step 1>",
  easChannel: "<slug>-production",      // own OTA channel; no existing installs to preserve
  icon: `${<SLUG_UPPERCASE>_ASSETS}/icon.png`,
  adaptiveIcon: `${<SLUG_UPPERCASE>_ASSETS}/adaptive-icon.png`,
  splashIcon: `${<SLUG_UPPERCASE>_ASSETS}/splash-icon.png`,
  favicon: `${<SLUG_UPPERCASE>_ASSETS}/favicon.png`,
},
```

### Locked fields that must NOT be changed for existing tenants

`panathenea` has several **LOCKED** fields (`name: "fest-app"`,
`scheme: "panatheneamobile"`, legacy Android package `com.festapp.festapp`,
`easChannel: "production"`) because they match what's already in the stores.
For new tenants there are no legacy constraints — use the clean convention
above.

---

## Step 4 — Add EAS build profiles

In `eas.json`, add three new profiles per tenant — `<slug>-development`,
`<slug>-preview`, `<slug>-production` — mirroring the Panathenea / techsaloniki
blocks.

Template (paste inside `build`):

```json
"<slug>-development": {
  "developmentClient": true,
  "distribution": "internal",
  "env": {
    "TENANT": "<slug>",
    "EXPO_PUBLIC_API_BASE_URL": "https://festapp-api-<slug>.fly.dev"
  },
  "android": { "buildType": "apk" },
  "ios": { "simulator": false }
},
"<slug>-preview": {
  "distribution": "internal",
  "env": {
    "TENANT": "<slug>",
    "EXPO_PUBLIC_API_BASE_URL": "https://festapp-api-<slug>.fly.dev"
  },
  "android": { "buildType": "apk" },
  "ios": { "simulator": false }
},
"<slug>-production": {
  "channel": "<slug>-production",
  "env": {
    "TENANT": "<slug>",
    "EXPO_PUBLIC_API_BASE_URL": "https://festapp-api-<slug>.fly.dev"
  },
  "android": { "buildType": "app-bundle" },
  "ios": {}
}
```

And inside `submit`:

```json
"<slug>-production": {}
```

**Verify:** `TENANT` and `EXPO_PUBLIC_API_BASE_URL` must both match the
tenant entry in `app.config.ts`. Mismatch causes the app to hit the wrong
backend — this is exactly the bug that bit us during techsaloniki's first
smoke test.

---

## Step 5 — Local smoke test before first build

```bash
TENANT=<slug> npx expo start
```

Press `i` / `a` to open the simulator. Verify:

- The splash + icon match the new branding
- The app attempts to reach `https://festapp-api-<slug>.fly.dev` (check
  network tab in browser dev tools for web, or device logs for native)
- Login / register UI renders

This won't exercise native Firebase / Google Sign-In — those need a real
build. But it catches typos in the config before you spend EAS credits.

---

## Step 6 — First dev-client build

```bash
# Android first (keystore is generated on this build)
eas build --profile <slug>-development --platform android

# iOS dev-client
eas build --profile <slug>-development --platform ios
```

**During the Android build:**

- EAS will prompt: *"Generate a new Android keystore?"* — accept.
- **Immediately after the build succeeds, back up the keystore:**
  ```bash
  eas credentials
  # → Android → <slug>-development → View / download keystore
  ```
  Save the `.jks` + key alias + passwords to your secrets vault.
  **The keystore is tied to the package name forever once shipped — losing it
  means you can never update the app.**

**After the first Android build completes:**

- Run `eas credentials` → Android → copy the SHA-1 fingerprint
- Go back to the backend runbook Step 2.3 and create the Android Google
  OAuth client using this SHA-1

---

## Step 7 — EAS dashboard env vars

Set these at [expo.dev/accounts/feststats/projects/](https://expo.dev/accounts/feststats/projects/)<slug>/settings/environment-variables
(separate from the `env` block in `eas.json` — that only covers builds; the
dashboard vars are consumed by `eas submit`, `eas update`, and any build
that doesn't override them).

**Minimum for internal testing:**

| Var | Value | Source |
|---|---|---|
| `APPLE_API_ISSUER_ID` | (copy from Panathenea's project settings) | Shared across tenants |
| `APPLE_API_KEY_ID` | (copy from Panathenea) | Shared |
| `APPLE_API_KEY_PATH` | (copy from Panathenea) | Shared |
| `EXPO_PUBLIC_API_BASE_URL` | `https://festapp-api-<slug>.fly.dev` | Per-tenant |

Mark these as **Secret** in the dashboard UI:

| Var | Per-tenant / shared | When needed |
|---|---|---|
| `EXPO_PUBLIC_MAPBOX_TOKEN` | shared (for now) | Always — map won't render without it |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | per-tenant | Only if Google Calendar is enabled |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | per-tenant | Only if Google Calendar is enabled (must be created AFTER first Android build — needs keystore SHA-1) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | per-tenant | Only if Google Calendar is enabled |

---

## Step 8 — Device smoke-test checklist

Install the dev-client build on a real device and connect Metro
(`TENANT=<slug> npx expo start --dev-client`). Verify:

- [ ] App opens, splash + icon match branding
- [ ] Login works — backend receives the request at `festapp-api-<slug>.fly.dev`
- [ ] Home / program / map / networking screens all load without errors
- [ ] Push permission prompt fires; FCM token registers against backend
      (check `GET /me/push-tokens` as admin, or backend logs)
- [ ] Admin drawer visible for the `ADMIN_EMAILS`-registered user
- [ ] QR scan opens camera + decodes correctly
- [ ] Deep link `<scheme>://...` opens the app (test with a custom URL)
- [ ] Admin broadcast push → delivered end-to-end to this device

If all green: this tenant is ready for TestFlight / Play internal
(continue with backend runbook Step 9 for store submission).

---

## Step 9 — Commit

```bash
git add app.config.ts eas.json assets/tenants/<slug>/ docs/
git commit -m "feat(multitenancy): add <slug> tenant"
git push origin master
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| EAS build fails with "slug does not match projectId" | `easProjectId` in `app.config.ts` doesn't match the Expo project whose slug is `<slug>` | Recreate the Expo project at expo.dev with slug `<slug>`, paste the new UUID |
| EAS build fails with "could not write back to extra.eas.projectId" | Missing `owner: "feststats"` at the ExpoConfig top level | Verify `owner: "feststats"` is still on line ~123 of `app.config.ts` |
| New build hits the Panathenea backend instead of the new one | `EXPO_PUBLIC_API_BASE_URL` from `.env` is leaking over `Constants.expoConfig.extra.apiBaseUrl` | Unset the env var locally, or the priority flip tracked as Phase E follow-up #3 |
| Android build hangs on "setting up keystore" | First-run prompt needs terminal input | Run `eas build` interactively (not from a CI context) for the first Android build of each new tenant |

---

## Related docs

- `festapp-backend/docs/ONBOARDING_NEW_TENANT.md` — full end-to-end runbook
  (what this doc is a mobile-focused excerpt of)
- `festapp-backend/docs/TENANT_DEPENDENCIES.md` — canonical env-var / infra /
  registration inventory
- `.planning/MULTITENANCY_PLAN.md` — plan + design decisions
