# Testing and Reliability Roadmap

This document tracks completed reliability work and the next production
hardening steps. Update it as each pull request is merged.

## Completed

- Pull-request CI runs typecheck, lint, Jest, theme audits, and tenant
  validation.
- Jest and React Native Testing Library foundation with deterministic test,
  watch, and coverage commands.
- Unit and integration coverage for auth state, secure storage, API client,
  API base URL resolution, runtime config, feature flags, login/logout flows,
  auth validation, notification registration, notification navigation,
  notification preferences, and shared button behavior.
- Maestro E2E foundation with tenant-aware smoke flows for auth entry, main
  navigation, login/logout, feature flags, and login API failure handling.
- Sentry-backed `reportError` adapter with local console fallback.
- Removed the config-store/API-client require cycle.
- Global React error boundary with a replaceable `reportError` adapter.
- Frontend testing runbook for local setup, PR checks, Jest, Maestro, tenants,
  and E2E development flags.

## Next

- Configure the Sentry project, EAS secrets, source map upload, release
  metadata, and privacy rules.
- Expand Maestro coverage only where it adds value beyond the current smoke
  suite, such as notification/deeplink journeys or critical form flows.
- Add tenant-specific smoke runs to nightly and release pipelines.
- Add backend tests and CI hardening before load and capacity testing.

## Technical debt to schedule

- Replace deprecated `expo-av` usage.
- Consolidate linking configuration.
- Resolve Expo Doctor dependency and Metro configuration findings.
- Reduce existing lint warning debt.
- Refactor and test the curved bottom tabs hook usage.
- Review npm audit findings and upgrade dependencies deliberately.

## Testing policy

- Pull requests must pass `npm run check`.
- Jest covers isolated logic, hooks, stores, API contracts, and component
  behavior.
- Maestro covers a small set of high-value user journeys against real native
  builds.
- Tests should describe intended behavior. Do not weaken assertions merely to
  match a bug in the current implementation.
