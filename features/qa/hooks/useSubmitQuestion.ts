import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitQuestion } from "../../../api/features/qa";
import type { SubmitQuestionInput } from "../../../api/schemas";

export function useSubmitQuestion(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitQuestionInput) => submitQuestion(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-qa", sessionId] });
    },
  });
}
