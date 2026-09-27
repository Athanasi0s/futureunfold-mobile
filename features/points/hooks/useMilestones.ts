import { useQuery } from "@tanstack/react-query";
import { getMilestones } from "../../../api/features/rewards";

/**
 * Fetch milestone definitions with the current user's achievement status
 */
export const useMilestones = () => {
  return useQuery({
    queryKey: ["milestones"],
    queryFn: getMilestones,
    staleTime: 30000,
  });
};
