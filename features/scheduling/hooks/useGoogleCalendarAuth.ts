import { useState, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import { buildCodeAsync } from "expo-auth-session/build/PKCE";
import { getGoogleCalendarStatus } from "@/api/features/google-calendar";
import { getApiBaseUrl } from "@/api/base-url";
import { getAuthToken } from "@/lib/secure-storage";
import { useQueryClient } from "@tanstack/react-query";

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";

const GOOGLE_AUTH_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";

// Backend handles the full OAuth exchange at this endpoint.
const REDIRECT_URI = `${getApiBaseUrl()}/auth/google/redirect`;

export function useGoogleCalendarAuth() {
  const [isReady, setIsReady] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  const connect = useCallback(async () => {
    setIsReady(false);
    setIsConnecting(true);
    setError(null);
    try {
      const { codeChallenge, codeVerifier } = await buildCodeAsync();

      // Pack code_verifier and JWT into state so the backend can
      // exchange the code and identify the user.
      const jwt = await getAuthToken();
      const statePayload = JSON.stringify({ cv: codeVerifier, jwt });
      const encodedState = btoa(statePayload);

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/calendar.freebusy",
        access_type: "offline",
        prompt: "consent",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state: encodedState,
      });

      const authUrl = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;

      await WebBrowser.openBrowserAsync(authUrl);

      // After browser closes, check if connection was established
      try {
        const status = await getGoogleCalendarStatus();
        if (status.connected) {
          queryClient.invalidateQueries({ queryKey: ["google-calendar"] });
        }
      } catch {
        // User may have cancelled
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Connection failed"));
    } finally {
      setIsReady(true);
      setIsConnecting(false);
    }
  }, [queryClient]);

  return {
    connect,
    isReady,
    isConnecting,
    error,
  };
}
