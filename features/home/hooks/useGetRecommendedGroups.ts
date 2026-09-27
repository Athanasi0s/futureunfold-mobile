import { useQuery } from "@tanstack/react-query";
import { getRecommendedGroups } from "@/api/features/recommendations";
import type { GroupOut } from "@/api/schemas";

export const useGetRecommendedGroups = (enabled = true) => {
  return useQuery<GroupOut[]>({
    queryKey: ["recommendedGroups"],
    queryFn: getRecommendedGroups,
    enabled,
  });
};
