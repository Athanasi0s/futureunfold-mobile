import { useQuery } from "@tanstack/react-query";
import { getMyPolls } from "../../../api/features/polls";

/**
 * Hook to fetch polls created by the current user
 * Used in the "My Polls" screen for speakers/exhibitors
 */
export const useGetMyPolls = () => {
  return useQuery({
    queryKey: ["my-polls"],
    queryFn: getMyPolls,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};
