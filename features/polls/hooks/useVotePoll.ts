import { useMutation, useQueryClient } from "@tanstack/react-query";
import { votePoll } from "../../../api/features/polls";
import type { VoteInput } from "../../../api/schemas";

/**
 * Hook to vote on a poll
 * Automatically invalidates the poll query on success
 */
export const useVotePoll = (pollId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VoteInput) => votePoll(pollId, data),
    onSuccess: () => {
      // Invalidate the poll to refetch with updated vote counts
      queryClient.invalidateQueries({ queryKey: ["poll", pollId] });
    },
  });
};
