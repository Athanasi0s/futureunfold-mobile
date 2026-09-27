import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postGroupMessage } from "@/api/features/groups";
import type { SendGroupMessageInput } from "@/api/schemas";

export const useSendGroupMessage = (groupId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendGroupMessageInput) =>
      postGroupMessage(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMessages", groupId] });
    },
  });
};
