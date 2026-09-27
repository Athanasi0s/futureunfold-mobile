import { useMutation, useQueryClient } from "@tanstack/react-query";
import { likeQuestion } from "../../../api/features/qa";

export function useLikeQuestion(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: number) => likeQuestion(sessionId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-qa", sessionId] });
    },
  });
}
