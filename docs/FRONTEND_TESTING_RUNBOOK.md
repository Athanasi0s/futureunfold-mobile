# Frontend Testing Runbook

Use this runbook when setting up the mobile app locally, checking a pull
request, or running the smoke flows before a merge.

## Daily Development

Install dependencies once:

```bash
npm install
```

Run the app with the Expo Dev Client:

```bash
npx expo start --dev-client --clear
```

Then open the installed development build on the Android emulator or iOS
simulator. Use Expo Go only for simple JavaScript-only checks; this app uses
native modules such as Mapbox and push notifications, so Expo Go is not enough
for full testing.

If you need a fresh native Android build:

```bash
npm run android
```

If you need a fresh native iOS build:

```bash
npm run ios
```

## Backend Target

By default, the app uses the tenant API URL baked into `app.config.ts`.

For local backend development, set `EXPO_PUBLIC_API_OVERRIDE` before starting
Metro or put it in `.env`.

Android emulator:

```bash
EXPO_PUBLIC_API_OVERRIDE=http://10.0.2.2:8000 npx expo start --dev-client --clear
```

Real device on the same WiFi:

```bash
EXPO_PUBLIC_API_OVERRIDE=http://<your-lan-ip>:8000 npx expo start --dev-client --clear
```

iOS simulator:

```bash
EXPO_PUBLIC_API_OVERRIDE=http://localhost:8000 npx expo start --dev-client --clear
```

Do not commit local backend URLs. Production and preview builds should use the
tenant-baked API URL.

## Pull Request Checks

Run the full local check before opening or updating a PR:

```bash
npm run check
```

This runs:

```text
typecheck
lint
Jest
theme helper tests
hex audit
tenant validation
```

The current lint step may report existing warnings. A PR is acceptable when
there are 0 lint errors and `npm run check` exits successfully.

Useful focused commands:

```bash
npm run typecheck
npm test
npm run test:watch
npm run test:coverage
npm run validate:tenants
```

Use focused Jest runs while developing:

```bash
npm test -- --runTestsByPath __tests__/use-auth.test.tsx
```

## Jest Coverage Scope

Jest is used for high-risk app logic, not for chasing blanket 100% coverage.

Covered areas include:

- Auth/session state and login/logout behavior
- Secure token storage
- API client behavior and endpoint wrappers
- API base URL priority and tenant backend selection
- Runtime config, tenant config, and feature flags
- Error boundary/reporting foundation
- Sentry initialization basics
- Push registration and permission handling
- Notification tap routing and pending navigation
- Notification preferences and notification hooks
- Shared UI primitives touched by the reliability work

Add new Jest tests when a change touches logic that can break auth, tenant
routing, API calls, feature visibility, notifications, or user-facing error
handling.

## Maestro E2E

Maestro runs against an already-installed development build. It does not replace
Jest; it verifies a small set of user journeys on the native app.

Install Maestro once:

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
~/.maestro/bin/maestro --version
```

Start Metro:

```bash
npx expo start --dev-client --clear
```

Open the app in the emulator, then run smoke flows from another terminal. Most
flows do not reset app state; put the app in the expected starting state first.

### Auth Entry Smoke

Use this when: checking that the logged-out auth entry UI still renders.

Start state: the app should be on `signup-screen` or `login-screen`.

This flow only verifies the auth entry UI. If signup is open, it taps the login
link first. If login is already open, it asserts the login form directly. It
does not submit credentials and does not require the backend.

Run:

```bash
npm run e2e:smoke
```

### Main Navigation Smoke

Use this when: checking that the logged-in tab shell still renders and each
visible primary tab opens.

Start state: the app should already be logged in and showing the tab shell.

This flow taps visible primary tabs and asserts that each matching screen root
rendered. Tabs hidden by runtime feature flags are skipped.

Run:

```bash
npm run e2e:smoke:navigation
```

### Login Logout Smoke

Use this when: checking the full login and sign-out path with a real backend
and a seeded test user.

Start state: login page, signup page, or an already logged-in home tab.

If the app is already logged in, the flow signs out first. If signup is open,
it taps the login link. Then it logs in with the configured credentials and
signs out again. This flow requires a reachable backend and a valid test user.

Run:

```bash
npm run e2e:smoke:login-logout
```

Override credentials:

```bash
E2E_LOGIN_EMAIL=person@example.com E2E_LOGIN_PASSWORD=secret npm run e2e:smoke:login-logout
```

### Feature Flag Smoke

Use this when: checking that development-only feature flag overrides hide and
show the expected tabs.

Start state: logged in and showing the tab shell after reloading the dev bundle
started with `EXPO_PUBLIC_E2E_DISABLED_FEATURES`.

This flow expects Home, Schedule, and Networking to be visible, and Map and
Badge to be hidden. Stop Metro and restart without the flag for normal testing.

Run:

```bash
EXPO_PUBLIC_E2E_DISABLED_FEATURES=map,digital_id npx expo start --dev-client --clear
npm run e2e:smoke:feature-flags
```

### Login API Failure Smoke

Use this when: checking that a failed login API call shows a clear connection
message instead of crashing, hanging, or showing a backend validation error.

Start state: login page or signup page after reloading the dev bundle started
with `npm run start:e2e:api-failure`.

For the API failure flow, stop any normal Metro server first, start the
API-failure server, reload the app, then run Maestro. If the app shows a
backend validation message such as "invalid password", it is still running a
normal dev bundle.

Run:

```bash
npm run start:e2e:api-failure
npm run e2e:smoke:api-failure
```

See `.maestro/README.md` for tenant-specific app IDs and raw Maestro commands.

## Tenant Checks

Before changing tenant config, run:

```bash
npm run validate:tenants
```

The validator checks each tenant's EAS profiles, selected tenant config,
production API URL, EAS project ID, icons, and Google services files.

For local tenant testing:

```bash
TENANT=reworks npx expo start --dev-client --clear
```

Open the matching installed development build before running tenant-specific
Maestro flows.

## E2E Development Flags

These flags are development-only helpers for deterministic tests:

```text
EXPO_PUBLIC_E2E_DISABLED_FEATURES=map,digital_id
EXPO_PUBLIC_E2E_FORCE_LOGIN_API_FAILURE=1
```

Use them only when running the related smoke flow. Stop Metro and restart
without the flag for normal app testing.

## Before Merge Checklist

- Run `npm run check`.
- If the PR changes login, tabs, feature flags, or notifications, run the
  matching Maestro smoke flow.
- If the PR changes tenant config, run `npm run validate:tenants`.
- If the PR changes native dependencies, rebuild the development app with
  `npm run android` or `npm run ios`.
- Do not weaken tests to match broken behavior. Fix the app or document the
  intentional behavior clearly.
