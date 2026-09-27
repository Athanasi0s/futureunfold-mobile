import { useQuery } from "@tanstack/react-query";
import { getVenueDensity } from "@/api/features/density";
import type { DensityBucket } from "@/api/schemas";

export function useDensity(enabled: boolean) {
  const query = useQuery({
    queryKey: ["venue-density"],
    queryFn: getVenueDensity,
    refetchInterval: 30_000, // 30s polling (HEAT-03)
    enabled,
  });

  const densityMap = new Map<number, DensityBucket>();
  if (query.data) {
    for (const v of query.data.venues) {
      densityMap.set(v.venue_id, v.bucket);
    }
  }

  return { densityMap, isLoading: query.isLoading };
}
