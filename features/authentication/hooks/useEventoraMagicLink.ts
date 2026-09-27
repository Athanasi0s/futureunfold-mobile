import { exchangeEventoraMagicLink, getMe } from "@/api/features/auth";
import { getTenantKey } from "@/constants/tenant-assets";
import { saveAuthToken } from "@/lib/secure-storage";
import * as Linking from "expo-linking";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "../stores/auth";

export function extractEventoraToken(url: string): string | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "");
    const isCustomAuthPath = parsed.hostname === "auth" && path === "/eventora";
    const isWebAuthPath = path.endsWith("/auth/eventora");
    if (!isCustomAuthPath && !isWebAuthPath) return null;

    const token = parsed.searchParams.get("token")?.trim();
    return token || null;
  } catch {
    return null;
  }
}

export function useEventoraMagicLink() {
  const setUser = useAuthStore((state) => state.setUser);
  const handledUrls = useRef(new Set<string>());

  useEffect(() => {
    if (getTenantKey() !== "future-unfold") return;

    const handleUrl = async (url: string | null) => {
      if (!url || handledUrls.current.has(url)) return;
      const token = extractEventoraToken(url);
      if (!token) return;

      handledUrls.current.add(url);
      try {
        const session = await exchangeEventoraMagicLink(token);
        await saveAuthToken(session.access_token);
        setUser(await getMe());
      } catch {
        Alert.alert(
          "Invitation link",
          "This invitation link is invalid, expired, or has already been used. Please request a new link from the event organizer.",
        );
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, [setUser]);
}
