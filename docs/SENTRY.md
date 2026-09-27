# Sentry Setup

The app has an opt-in Sentry adapter behind `reportError`.

## Local setup

Set the public DSN only when you want local errors to reach Sentry:

```bash
EXPO_PUBLIC_SENTRY_DSN=https://example@sentry.io/123
EXPO_PUBLIC_SENTRY_ENVIRONMENT=development
```

The DSN is a client key and is safe to expose in the app bundle. Do not put the
Sentry auth token in `.env`, `app.config.ts`, or any committed file.

## EAS setup

Configure these values in EAS environment/secrets:

```text
EXPO_PUBLIC_SENTRY_DSN
EXPO_PUBLIC_SENTRY_ENVIRONMENT
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
```

`SENTRY_ORG` and `SENTRY_PROJECT` identify the Sentry project for source map
uploads. `SENTRY_AUTH_TOKEN` is used by EAS builds to upload source maps and
must stay a secret.

## Behavior

- Without `EXPO_PUBLIC_SENTRY_DSN`, `reportError` logs to the console.
- With `EXPO_PUBLIC_SENTRY_DSN`, `reportError` sends errors to Sentry.
- React error boundary crashes include the component stack as Sentry context.
- Tenant and app name are attached as Sentry tags when available.
