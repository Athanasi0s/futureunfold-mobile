import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "../../../api/features/qr";

/**
 * Fetch the points leaderboard
 */
export const useLeaderboard = (limit = 50) => {
  return useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: () => getLeaderboard(limit),
    staleTime: 30000,
  });
};
