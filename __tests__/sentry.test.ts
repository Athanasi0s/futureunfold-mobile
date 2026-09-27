function getSentryMock() {
  const Sentry = require("@sentry/react-native");
  return {
    sentry: jest.mocked(Sentry),
    scope: Sentry.__mockScope as {
      setContext: jest.Mock;
    },
  };
}

describe("Sentry adapter", () => {
  const originalDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const originalEnvironment = process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    delete process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT;
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = originalDsn;
    process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT = originalEnvironment;
  });

  test("stays disabled when no DSN is configured", () => {
    const { captureError, isSentryEnabled } = require("@/lib/sentry");
    const { sentry } = getSentryMock();

    expect(isSentryEnabled).toBe(false);
    expect(sentry.init).not.toHaveBeenCalled();
    expect(captureError(new Error("local only"))).toBe(false);
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  test("initializes and captures errors when a DSN is configured", () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = "https://example@sentry.io/123";
    process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT = "preview";

    const { captureError, isSentryEnabled } = require("@/lib/sentry");
    const { sentry, scope } = getSentryMock();
    const error = new Error("remote failure");

    expect(isSentryEnabled).toBe(true);
    expect(sentry.init).toHaveBeenCalledWith({
      dsn: "https://example@sentry.io/123",
      environment: "preview",
      attachStacktrace: true,
    });

    expect(
      captureError(error, { componentStack: "Component stack" }),
    ).toBe(true);
    expect(scope.setContext).toHaveBeenCalledWith("react", {
      componentStack: "Component stack",
    });
    expect(sentry.captureException).toHaveBeenCalledWith(error);
  });
});
