import { useQuery } from "@tanstack/react-query";
import { getGroupMembers } from "@/api/features/groups";

export const useGetGroupMembers = (groupId: number) => {
  return useQuery({
    queryKey: ["groupMembers", groupId],
    queryFn: () => getGroupMembers(groupId),
    enabled: !!groupId,
  });
};
