import { useQuery } from "@tanstack/react-query";
import { getGroupLocations } from "@/api/features/location";
import type { UserLocation } from "@/api/schemas";

/**
 * Poll friend locations for selected groups every 15s.
 * Merges results from multiple groups into a single array.
 */
export function useFriendLocations(groupIds: number[]) {
  return useQuery({
    queryKey: ["friend-locations", ...groupIds],
    queryFn: async (): Promise<UserLocation[]> => {
      if (groupIds.length === 0) return [];
      const results = await Promise.all(
        groupIds.map((id) => getGroupLocations(id)),
      );
      return results.flatMap((r) => r.locations);
    },
    refetchInterval: 15_000,
    enabled: groupIds.length > 0,
    staleTime: 10_000,
  });
}
