import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "certificate_cache";

type CertCache = {
  uri: string;
  templateVersion: number;
};

export function useCertificateCache() {
  const [cachedUri, setCachedUri] = useState<string | null>(null);

  const getCached = useCallback(async (currentVersion: number): Promise<string | null> => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cache: CertCache = JSON.parse(raw);
      if (cache.templateVersion !== currentVersion) return null;
      setCachedUri(cache.uri);
      return cache.uri;
    } catch {
      return null;
    }
  }, []);

  const saveCache = useCallback(async (uri: string, version: number) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ uri, templateVersion: version }));
      setCachedUri(uri);
    } catch {
      // Silently fail cache writes
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      setCachedUri(null);
    } catch {
      // Silently fail
    }
  }, []);

  return { cachedUri, getCached, saveCache, clearCache };
}
