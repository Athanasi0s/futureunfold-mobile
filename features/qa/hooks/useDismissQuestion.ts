import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dismissQuestion } from "../../../api/features/qa";

export function useDismissQuestion(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: number) => dismissQuestion(sessionId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-qa", sessionId] });
    },
  });
}
