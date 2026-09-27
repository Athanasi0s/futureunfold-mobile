import { useQuery } from "@tanstack/react-query";
import { getRecommendedSessions } from "@/api/features/recommendations";
import type { SessionOut } from "@/api/schemas";

export const useGetRecommendedSessions = (enabled = true) => {
  return useQuery<SessionOut[]>({
    queryKey: ["recommendedSessions"],
    queryFn: getRecommendedSessions,
    enabled,
  });
};
