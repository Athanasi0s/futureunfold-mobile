# Future Unfold Mobile

Cross-platform festival app for iOS, Android, and Web. Built with React Native + Expo SDK 54, TypeScript, Expo Router, React Query, and Zustand.

See [`CLAUDE.md`](./CLAUDE.md) for architecture overview and conventions.

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (bundled via `npx`)
- For iOS builds: Xcode + CocoaPods
- For Android builds: Android Studio + JDK 17
- [EAS CLI](https://docs.expo.dev/eas/) for development builds (`npm install -g eas-cli`)

## Setup

```bash
npm install
cp .env.example .env   # if an example exists; otherwise create .env manually
```

Point the app at a running backend by setting `EXPO_PUBLIC_API_OVERRIDE` in
`.env` (see [Environment](#environment)).

## Scripts

<!-- AUTO-GENERATED from package.json -->
| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run start:clear` | Start Expo dev server with the Metro cache cleared |
| `npm run ios` | Build and launch on iOS simulator (`expo run:ios`) |
| `npm run android` | Build and launch on Android emulator (`expo run:android`) |
| `npm run web` | Start the web build (`expo start --web`) |
| `npm run lint` | Run ESLint via `expo lint` |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm test` | Run the Jest test suite |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:coverage` | Run Jest and generate a coverage report |
| `npm run e2e:smoke` | Run the Future Unfold Maestro auth-entry smoke flow |
| `npm run check` | Run all pull-request checks locally |
| `npm run validate:tenants` | Validate every tenant configuration |
| `npm run prebuild` | Generate native iOS/Android projects (`expo prebuild`) |
| `npm run prebuild:clean` | Regenerate native projects from scratch |
| `npm run build:dev:ios` | EAS development build for iOS |
| `npm run build:dev:android` | EAS development build for Android |
| `npm run build:dev` | EAS development build for all platforms |
| `npm run test:theme` | Run the theme-safelist verification script |
| `npm run reset-project` | Reset starter code (rarely used in this project) |
<!-- /AUTO-GENERATED -->

Jest and React Native Testing Library cover unit and integration behavior.
Maestro covers user journeys against an installed development build. See
[`docs/FRONTEND_TESTING_RUNBOOK.md`](./docs/FRONTEND_TESTING_RUNBOOK.md),
[`docs/TESTING_ROADMAP.md`](./docs/TESTING_ROADMAP.md) and
[`.maestro/README.md`](./.maestro/README.md).

## Environment

<!-- AUTO-GENERATED env reference -->
| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_OVERRIDE` | No | Override the backend API base URL. Set this in `.env` only to point at a local backend during development (e.g. `http://192.168.x.x:8000`). When unset, the app uses the tenant-baked URL from `app.config.ts`, which is the correct production value for every build. |
| `EXPO_PUBLIC_API_BASE_URL` | No (deprecated) | Legacy alias for `EXPO_PUBLIC_API_OVERRIDE`. Still read for backward compatibility with existing local `.env` files, but prefer the new name. |
| `EXPO_PUBLIC_SENTRY_DSN` | No | Enables Sentry crash/error reporting when set. Leave unset for local development unless you are testing Sentry. |
| `EXPO_PUBLIC_SENTRY_ENVIRONMENT` | No | Optional Sentry environment override. Defaults to `development` in dev and `production` otherwise. |
<!-- /AUTO-GENERATED -->

Variables prefixed with `EXPO_PUBLIC_` are inlined into the client bundle at build time; do not place secrets here.

## Project Layout

```
app/            Expo Router routes (auth, onboarding, tabs, dynamic)
api/            Axios clients (basic + auth) and per-feature API functions
features/       Domain modules (authentication, scheduling, matching, polls, ...)
components/     Shared UI (themed-*, drawer, bottom sheets)
constants/      Theme tokens and palettes
hooks/          App-wide hooks (theme, color scheme)
lib/            query-client, secure-storage, utilities
locales/        i18n resources (i18next + react-i18next)
docs/           Supplementary mobile docs (theme safelist, etc.)
```

Path alias: `@/*` maps to the project root (`tsconfig.json`).

## Common Tasks

- **Run against local backend**: start the backend with `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`, then set `EXPO_PUBLIC_API_OVERRIDE=http://<your-lan-ip>:8000` in `.env` and run `npm start`.
- **Clear Metro cache**: `npm run start:clear`.
- **Regenerate native code** after native-dep changes: `npm run prebuild:clean`.
- **Create a development build**: `npm run build:dev:ios` / `npm run build:dev:android` (requires EAS login).

## Further Reading

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- Project architecture: [`CLAUDE.md`](./CLAUDE.md)
- Theme/palette system: [`docs/theme-safelist.md`](./docs/theme-safelist.md)
- Frontend testing runbook: [`docs/FRONTEND_TESTING_RUNBOOK.md`](./docs/FRONTEND_TESTING_RUNBOOK.md)
- Testing roadmap: [`docs/TESTING_ROADMAP.md`](./docs/TESTING_ROADMAP.md)
- Sentry setup: [`docs/SENTRY.md`](./docs/SENTRY.md)
