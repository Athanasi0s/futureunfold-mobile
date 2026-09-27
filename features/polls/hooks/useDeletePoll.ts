import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePoll } from "../../../api/features/polls";
import type { PollDetailOut } from "../../../api/schemas";

/**
 * Hook to delete a poll
 * Removes the poll from cache immediately (API is a soft delete)
 */
export const useDeletePoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pollId: number) => deletePoll(pollId),
    onSuccess: (_, pollId) => {
      queryClient.setQueryData<PollDetailOut[]>(["my-polls"], (old) =>
        old ? old.filter((p) => p.id !== pollId) : [],
      );
    },
  });
};
