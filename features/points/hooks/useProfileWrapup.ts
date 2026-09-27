import { useQuery } from "@tanstack/react-query";
import { getProfileWrapup } from "../../../api/features/rewards";

/**
 * Fetch profile wrap-up stats & milestone timeline for the Festival Wrap-up view
 */
export const useProfileWrapup = () => {
  return useQuery({
    queryKey: ["profile-wrapup"],
    queryFn: getProfileWrapup,
    staleTime: 30000,
  });
};
