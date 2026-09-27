import { getEarningActions } from "@/api/features/rewards";
import { useQuery } from "@tanstack/react-query";

export function useEarningActions() {
  return useQuery({
    queryKey: ["earning-actions"],
    queryFn: getEarningActions,
    staleTime: 60_000, // public catalogue — cache for 1 min
  });
}
