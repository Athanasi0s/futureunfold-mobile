import { useQuery } from "@tanstack/react-query";
import { getGroupMessages } from "@/api/features/groups";

export const useGetGroupMessages = (groupId: number, offset = 0, limit = 50) => {
  return useQuery({
    queryKey: ["groupMessages", groupId, offset, limit],
    queryFn: () => getGroupMessages(groupId, offset, limit),
    enabled: !!groupId,
    refetchInterval: 30000,
  });
};
