import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendDirectMessage } from "@/api/features/dm";
import type { SendDirectMessageInput } from "@/api/schemas";

export const useSendDirectMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendDirectMessageInput) => sendDirectMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dmInbox"] });
      queryClient.invalidateQueries({ queryKey: ["dmMessages"] });
    },
  });
};
