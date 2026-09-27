import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeOnboarding } from "../complete-onboarding";

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });
};
