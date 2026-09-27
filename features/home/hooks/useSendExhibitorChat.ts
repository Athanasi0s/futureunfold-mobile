import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendExhibitorChatMessage } from "@/api/features/exhibitors";
import type { SendExhibitorChatMessageInput } from "@/api/schemas";

export const useSendExhibitorChat = (exhibitorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendExhibitorChatMessageInput) =>
      sendExhibitorChatMessage(exhibitorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibitorChat", exhibitorId] });
    },
  });
};
