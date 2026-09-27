import { useMutation, useQueryClient } from "@tanstack/react-query";
import { joinGroup } from "@/api/features/groups";
import type { JoinGroupInput } from "@/api/schemas";

export const useJoinGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinGroupInput) => joinGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedGroups"] });
    },
  });
};
