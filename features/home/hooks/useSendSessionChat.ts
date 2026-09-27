import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendSessionChatMessage } from "@/api/features/program";
import type { SendSessionChatMessageInput } from "@/api/schemas";

export const useSendSessionChat = (sessionId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendSessionChatMessageInput) =>
      sendSessionChatMessage(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessionChat", sessionId] });
    },
  });
};
