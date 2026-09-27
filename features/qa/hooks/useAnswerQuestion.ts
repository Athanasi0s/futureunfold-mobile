import { useMutation, useQueryClient } from "@tanstack/react-query";
import { answerQuestion } from "../../../api/features/qa";
import type { AnswerQuestionInput } from "../../../api/schemas";

export function useAnswerQuestion(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questionId,
      data,
    }: {
      questionId: number;
      data: AnswerQuestionInput;
    }) => answerQuestion(sessionId, questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-qa", sessionId] });
    },
  });
}
