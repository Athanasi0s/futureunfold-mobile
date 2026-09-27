import { useQuery } from "@tanstack/react-query";
import { getSessionChatMessages } from "@/api/features/program";

export const useGetSessionChat = (sessionId: number, offset = 0, limit = 50) => {
  return useQuery({
    queryKey: ["sessionChat", sessionId, offset, limit],
    queryFn: () => getSessionChatMessages(sessionId, offset, limit),
    enabled: !!sessionId,
    refetchInterval: 30000,
  });
};
