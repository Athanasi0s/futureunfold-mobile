import { api } from "../client";
import type { GoogleCalendarStatusOut } from "../schemas";

export function getGoogleCalendarStatus(): Promise<GoogleCalendarStatusOut> {
  return api.auth<GoogleCalendarStatusOut>({
    url: "/me/google-calendar",
    method: "GET",
  });
}

export function sendGoogleCallback(data: {
  code: string;
  code_verifier: string;
  redirect_uri: string;
}): Promise<{ connected: boolean }> {
  return api.auth<{ connected: boolean }>({
    url: "/auth/google/callback",
    method: "POST",
    data,
  });
}

export function disconnectGoogleCalendar(): Promise<{ connected: boolean }> {
  return api.auth<{ connected: boolean }>({
    url: "/me/google-calendar",
    method: "DELETE",
  });
}
