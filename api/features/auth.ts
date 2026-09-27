import { api } from "../client";
import type { MeOut, MeUpdateIn, RegisterBody, RegisterOut, TokenOut } from "../schemas";

// ============================================
// AUTH API FUNCTIONS
// ============================================

function shouldForceLoginApiFailure(): boolean {
  return (
    __DEV__ && process.env.EXPO_PUBLIC_E2E_FORCE_LOGIN_API_FAILURE === "1"
  );
}

function createLoginConnectionError() {
  return {
    code: "ERR_NETWORK",
    message: "Network Error",
    request: {},
  };
}

/**
 * Login with email and password
 */
export function login(email: string, password: string): Promise<TokenOut> {
  if (shouldForceLoginApiFailure()) {
    return Promise.reject(createLoginConnectionError());
  }

  return api.basic<TokenOut>({
    url: "/auth/login",
    method: "POST",
    data: { email, password },
  });
}

/** Exchange a one-time EVENTORA invitation token for an app session. */
export function exchangeEventoraMagicLink(token: string): Promise<TokenOut> {
  return api.basic<TokenOut>({
    url: "/auth/eventora",
    method: "POST",
    data: { token },
  });
}

/**
 * Register a new user
 */
export function register(data: RegisterBody): Promise<RegisterOut> {
  return api.basic<RegisterOut>({
    url: "/auth/register",
    method: "POST",
    data,
  });
}

/**
 * Get current user profile (auth required)
 */
export function getMe(): Promise<MeOut> {
  return api.auth<MeOut>({ url: "/me", method: "GET" });
}

/**
 * Update current user profile (auth required)
 */
export function patchMe(data: MeUpdateIn): Promise<MeOut> {
  return api.auth<MeOut>({
    url: "/me",
    method: "PATCH",
    data,
  });
}
