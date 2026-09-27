import { api } from "../client";
import type {
  AnswerQuestionInput,
  LikeToggleOut,
  QAListOut,
  QuestionOut,
  SubmitQuestionInput,
} from "../schemas";

export function getSessionQA(
  sessionId: number,
  sort: "newest" | "likes" = "newest",
): Promise<QAListOut> {
  return api.auth<QAListOut>({
    url: `/sessions/${sessionId}/qa`,
    method: "GET",
    params: { sort },
  });
}

export function submitQuestion(
  sessionId: number,
  data: SubmitQuestionInput,
): Promise<QuestionOut> {
  return api.auth<QuestionOut>({
    url: `/sessions/${sessionId}/qa`,
    method: "POST",
    data,
  });
}

export function answerQuestion(
  sessionId: number,
  questionId: number,
  data: AnswerQuestionInput,
): Promise<QuestionOut> {
  return api.auth<QuestionOut>({
    url: `/sessions/${sessionId}/qa/${questionId}/answer`,
    method: "POST",
    data,
  });
}

export function dismissQuestion(
  sessionId: number,
  questionId: number,
): Promise<QuestionOut> {
  return api.auth<QuestionOut>({
    url: `/sessions/${sessionId}/qa/${questionId}/dismiss`,
    method: "POST",
  });
}

export function likeQuestion(
  sessionId: number,
  questionId: number,
): Promise<LikeToggleOut> {
  return api.auth<LikeToggleOut>({
    url: `/sessions/${sessionId}/qa/${questionId}/like`,
    method: "POST",
  });
}
