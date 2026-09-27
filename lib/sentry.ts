import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

import type { ErrorContext } from "@/lib/error-reporting";

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const sentryEnvironment =
  process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ??
  (__DEV__ ? "development" : "production");
const expoConfig = Constants.expoConfig;
const tenant = expoConfig?.extra?.tenant;
const appName = expoConfig?.extra?.appName ?? expoConfig?.name;

export const isSentryEnabled = Boolean(sentryDsn);

if (isSentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    attachStacktrace: true,
  });

  if (typeof tenant === "string") {
    Sentry.setTag("tenant", tenant);
  }

  if (typeof appName === "string") {
    Sentry.setTag("app_name", appName);
  }
}

export function captureError(error: unknown, context?: ErrorContext): boolean {
  if (!isSentryEnabled) {
    return false;
  }

  Sentry.withScope((scope) => {
    if (context?.componentStack) {
      scope.setContext("react", {
        componentStack: context.componentStack,
      });
    }

    Sentry.captureException(error);
  });

  return true;
}
