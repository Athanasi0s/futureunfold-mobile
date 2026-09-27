import { useQuery } from "@tanstack/react-query";
import { getOnboardingStatus } from "../get-onboarding-status";

export const useGetOnboardingStatus = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["onboarding-status"],
    queryFn: getOnboardingStatus,
    enabled,
  });
};
