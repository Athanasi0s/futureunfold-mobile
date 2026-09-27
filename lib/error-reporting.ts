import { captureError } from "@/lib/sentry";

export type ErrorContext = {
  componentStack?: string | null;
};

export function reportError(error: unknown, context?: ErrorContext): void {
  const captured = captureError(error, context);

  if (__DEV__ || !captured) {
    console.error("[App Error]", error, context);
  }
}
