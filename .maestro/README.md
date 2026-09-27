# Maestro E2E

Maestro runs user journeys against the app that is already open in the Android
emulator. It does not run inside Jest and does not require an npm dependency.
For a shorter command-oriented checklist with each flow's expected start state,
see `docs/FRONTEND_TESTING_RUNBOOK.md`.

## Local setup

1. Install Maestro CLI:

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Then verify it:

```bash
~/.maestro/bin/maestro --version
```
2. Start an Android emulator.
3. Start Metro and open the app through Expo Dev Client:

```bash
npx expo start --dev-client
```

4. Navigate to the signup screen in the emulator.
5. In another terminal, run the default Future Unfold smoke flow:

```bash
npm run e2e:smoke
```

When signup is open, the smoke flow verifies navigation to login. When a
previous run has already left login open, it verifies the login form directly.
It does not clear app state, submit credentials, or require the backend.
Keeping state cleanup out of the local flow avoids opening the Expo Dev Client
launcher instead of the app.

To verify the logged-in tab shell, open the app with an authenticated user and
run:

```bash
npm run e2e:smoke:navigation
```

The navigation smoke flow taps each visible primary tab and asserts that the
matching screen root rendered. Tabs hidden by runtime feature flags are skipped.
Tab presence and screen assertions use React Native `testID`s. The actual tab
taps use the visible tab labels because Maestro's Android tap path is more
reliable on these React Navigation tab buttons than tapping the parent
`tabBarButtonTestID` directly.

To verify login and logout with the seeded Future Unfold test user, keep the app
open in the emulator and run:

```bash
npm run e2e:smoke:login-logout
```

The login/logout smoke flow uses `testmatch@test.com` / `test1234` by default.
Override those credentials without changing the flow:

```bash
E2E_LOGIN_EMAIL=person@example.com E2E_LOGIN_PASSWORD=secret npm run e2e:smoke:login-logout
```

To verify feature-flagged tab visibility, restart Metro with the E2E-only
disabled-features override, reload the app, and run:

```bash
EXPO_PUBLIC_E2E_DISABLED_FEATURES=map,digital_id npx expo start --dev-client
npm run e2e:smoke:feature-flags
```

The feature flag smoke flow expects the Map and Badge tabs to be hidden while
Home, Schedule, and Networking remain visible. The override is only respected
in development builds.

To verify the login failure state when the API is unreachable, stop any running
Metro server, start Metro with the dev-only login failure flag, reload the app,
and run:

```bash
npm run start:e2e:api-failure
npm run e2e:smoke:api-failure
```

If the app shows a backend validation error such as "invalid password", it is
still running a normal dev bundle. Stop Metro, rerun the API-failure start
command, and reload the app before running the Maestro flow again.

The API failure smoke flow submits the login form and expects the app to show a
clear connection error instead of hanging or crashing. The failure flag is only
used by development builds and only affects the login API call.

## Other tenants

Each tenant has a different native app ID. Pass the installed tenant's ID:

```bash
maestro test -e APP_ID=com.festapp.techsaloniki .maestro/smoke/auth-entry.yaml
maestro test -e APP_ID=com.festapp.reworks .maestro/smoke/auth-entry.yaml
maestro test -e APP_ID=com.festapp.primer .maestro/smoke/auth-entry.yaml

maestro test -e APP_ID=com.festapp.techsaloniki .maestro/smoke/main-navigation.yaml
maestro test -e APP_ID=com.festapp.reworks .maestro/smoke/main-navigation.yaml
maestro test -e APP_ID=com.festapp.primer .maestro/smoke/main-navigation.yaml

maestro test -e APP_ID=com.festapp.techsaloniki -e E2E_LOGIN_EMAIL=<email> -e E2E_LOGIN_PASSWORD=<password> .maestro/smoke/login-logout.yaml
maestro test -e APP_ID=com.festapp.reworks -e E2E_LOGIN_EMAIL=<email> -e E2E_LOGIN_PASSWORD=<password> .maestro/smoke/login-logout.yaml
maestro test -e APP_ID=com.festapp.primer -e E2E_LOGIN_EMAIL=<email> -e E2E_LOGIN_PASSWORD=<password> .maestro/smoke/login-logout.yaml

maestro test -e APP_ID=com.festapp.techsaloniki .maestro/smoke/feature-flags.yaml
maestro test -e APP_ID=com.festapp.reworks .maestro/smoke/feature-flags.yaml
maestro test -e APP_ID=com.festapp.primer .maestro/smoke/feature-flags.yaml

maestro test -e APP_ID=com.festapp.techsaloniki .maestro/smoke/login-api-failure.yaml
maestro test -e APP_ID=com.festapp.reworks .maestro/smoke/login-api-failure.yaml
maestro test -e APP_ID=com.festapp.primer .maestro/smoke/login-api-failure.yaml
```

Open the matching tenant's development build before running its flow, for
example:

```bash
TENANT=reworks npx expo start --dev-client
```

Keep smoke flows deterministic and independent of real production data.

CI and release E2E flows will use a separate release-like build and may clear
app state safely.
