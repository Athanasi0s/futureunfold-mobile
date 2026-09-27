import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitOnboarding, SubmitOnboardingData } from "../submit-onboarding";

export const useSubmitOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitOnboardingData) => submitOnboarding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });
};
