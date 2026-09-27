import { useQuery } from "@tanstack/react-query";
import { getMyRewards } from "../../../api/features/rewards";

/**
 * Fetch the current user's reward status (points, tier, unlocks, recent txns)
 */
export const useMyRewards = () => {
  return useQuery({
    queryKey: ["rewards-me"],
    queryFn: getMyRewards,
    staleTime: 30000,
  });
};
