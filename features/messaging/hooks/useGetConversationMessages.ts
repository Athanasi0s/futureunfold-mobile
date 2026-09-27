import { useQuery } from "@tanstack/react-query";
import { getConversationMessages } from "@/api/features/dm";

export const useGetConversationMessages = (conversationId: number) => {
  return useQuery({
    queryKey: ["dmMessages", conversationId],
    queryFn: () => getConversationMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 30000,
  });
};
