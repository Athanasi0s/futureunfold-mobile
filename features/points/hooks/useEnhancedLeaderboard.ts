import { useQuery } from "@tanstack/react-query";
import { getEnhancedLeaderboard } from "@/api/features/rewards";

export const useEnhancedLeaderboard = (
  category: string,
  period: string,
  date?: string,
  limit = 50,
) => {
  return useQuery({
    queryKey: ["enhanced-leaderboard", category, period, date, limit],
    queryFn: () => getEnhancedLeaderboard({ category, period, date, limit }),
    staleTime: 30_000,
  });
};
