import { useQuery } from "@tanstack/react-query";
import { getOutdoorMap } from "@/api/features/map";

export function useGetOutdoorMap() {
  return useQuery({
    queryKey: ["outdoor-map"],
    queryFn: getOutdoorMap,
    staleTime: 5 * 60 * 1000,
  });
}
