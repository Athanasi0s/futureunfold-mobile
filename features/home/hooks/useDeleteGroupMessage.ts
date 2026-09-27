import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteGroupMessage } from "@/api/features/groups";

export const useDeleteGroupMessage = (groupId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) => deleteGroupMessage(groupId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMessages", groupId] });
    },
  });
};
