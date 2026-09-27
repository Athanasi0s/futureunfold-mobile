import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPoll } from "../../../api/features/polls";
import type { PollCreateInput } from "../../../api/schemas";

/**
 * Hook to create a new poll
 * Automatically invalidates the my-polls query on success
 */
export const useCreatePoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PollCreateInput) => createPoll(data),
    onSuccess: () => {
      // Invalidate my-polls to show the new poll
      queryClient.invalidateQueries({ queryKey: ["my-polls"] });
    },
  });
};
