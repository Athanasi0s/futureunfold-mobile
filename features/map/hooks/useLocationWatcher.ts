import { useEffect, useRef, useCallback, useState } from "react";
import * as Location from "expo-location";
import { useMutation } from "@tanstack/react-query";
import { updateMyLocation } from "@/api/features/location";

/**
 * Watch device position and report to backend every ~30s.
 * Only active when `enabled` is true (user sharing in at least one group).
 */
export function useLocationWatcher(enabled: boolean) {
  const [isWatching, setIsWatching] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const mutation = useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) =>
      updateMyLocation(lat, lng),
  });

  const startWatching = useCallback(async () => {
    if (subscriptionRef.current) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30_000,
        distanceInterval: 50,
      },
      (location) => {
        mutation.mutate({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      },
    );

    subscriptionRef.current = sub;
    setIsWatching(true);
  }, []);

  const stopWatching = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setIsWatching(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      startWatching();
    } else {
      stopWatching();
    }
    return () => stopWatching();
  }, [enabled, startWatching, stopWatching]);

  return { isWatching };
}
