# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Panathenea Mobile — a React Native + Expo (SDK 54) cross-platform festival app (iOS, Android, Web) built with TypeScript. Uses file-based routing (Expo Router), React Query for server state, Zustand for client state, and Axios for API calls.

## Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start Expo dev server |
| `npm run start:clear` | Start with cache cleared |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run web version |
| `npm run lint` | Run ESLint |
| `npm run prebuild` | Generate native code |
| `npm run prebuild:clean` | Clean and regenerate native code |

No test runner is currently configured.

## Architecture

### Routing (Expo Router — file-based)

Routes live in `app/`. Three protected route groups gated by auth/onboarding state in `app/_layout.tsx`:
- `(auth)` — shown when unauthenticated
- `(onboarding)` — shown when authenticated but onboarding incomplete
- `(tabs)` — main app with tab navigation (home, networking, program, map, profile, etc.)

Dynamic routes: `session/[id]`, `user/[id]`.

### API Layer (`api/`)

- `api/client.ts` — Two Axios instances: `api.basic` (no auth) and `api.auth` (auto-attaches Bearer token via interceptor). Base URL resolved via `api/base-url.ts` → `getApiBaseUrl()`: `EXPO_PUBLIC_API_OVERRIDE` (local-dev override) → tenant-baked `apiBaseUrl` from `app.config.ts` (default) → legacy `EXPO_PUBLIC_API_BASE_URL` (deprecated fallback). Use `getApiBaseUrl()` anywhere else that needs the API base URL — do not read the env vars directly.
- `api/schemas.ts` — TypeScript types for all API responses.
- `api/features/` — API functions grouped by domain (auth, user, program, groups, scheduling, polls, rewards, qr, exhibitors, recommendations).

### Feature Modules (`features/`)

Domain-driven structure. Each feature folder contains its own `hooks/`, `stores/`, `components/`, and API functions:
- `authentication/` — Zustand auth store, login/register/logout hooks
- `onboarding/` — Onboarding flow state and questions
- `home/` — Group/exhibitor discovery
- `scheduling/` — Meeting creation with availability/conflict checking
- `matching/` — User compatibility matching
- `networking/` — Calendar and messaging
- `polls/` — Poll CRUD and voting
- `points/` — QR scanning, leaderboard, milestones

### State Management

- **Zustand** stores: `features/authentication/stores/auth.ts` (user + isAuthenticated), `features/onboarding/stores/onboarding.ts`, `components/drawer/drawer-store.ts`
- **React Query** for server state. Hooks follow `useGet*`/`useCreate*`/`useUpdate*` naming. Mutations invalidate related query keys on success.
- **QueryClient** config in `lib/query-client.ts` (2 retries default).

### Token Storage

JWTs stored via `expo-secure-store` (see `lib/secure-storage.ts`). Auth token auto-loaded on app start in root layout.

### Form Handling

React Hook Form + Zod schemas (`@hookform/resolvers/zod`). Used in auth and profile flows.

### Styling

Theme system in `constants/theme.ts` with light/dark mode support. Access via `useThemeColor` / `useColors` hooks. No CSS-in-JS library — uses React Native StyleSheet and inline styles.

### Path Alias

`@/*` maps to project root (configured in `tsconfig.json`). Use `@/api/...`, `@/features/...`, `@/components/...`, etc.

### Key UI Patterns

- Gesture-based drawer navigation (`components/drawer/`) using `react-native-reanimated` + `react-native-gesture-handler`
- Themed components (`components/themed-text.tsx`, `components/themed-view.tsx`)
- Bottom sheets for confirmations and filters
