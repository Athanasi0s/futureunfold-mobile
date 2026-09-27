import { useQuery } from "@tanstack/react-query";
import { getOnboardingQuestions } from "../get-onboarding-questions";

export const useGetOnboardingQuestions = () => {
  return useQuery({
    queryKey: ["onboarding-questions"],
    queryFn: getOnboardingQuestions,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
