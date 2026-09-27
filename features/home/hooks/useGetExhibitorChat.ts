import { useQuery } from "@tanstack/react-query";
import { getExhibitorChatMessages } from "@/api/features/exhibitors";

export const useGetExhibitorChat = (exhibitorId: number, offset = 0, limit = 50) => {
  return useQuery({
    queryKey: ["exhibitorChat", exhibitorId, offset, limit],
    queryFn: () => getExhibitorChatMessages(exhibitorId, offset, limit),
    enabled: !!exhibitorId,
    refetchInterval: 30000,
  });
};
