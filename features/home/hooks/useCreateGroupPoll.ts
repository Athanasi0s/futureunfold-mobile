import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPoll } from "@/api/features/polls";

type CreateGroupPollParams = {
  question: string;
  options: string[];
  group_id: number;
};

export const useCreateGroupPoll = (groupId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ question, options, group_id }: CreateGroupPollParams) =>
      createPoll({ question, options, group_id, session_id: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMessages", groupId] });
    },
  });
};
