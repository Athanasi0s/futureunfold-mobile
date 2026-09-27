import { useQuery } from "@tanstack/react-query";
import { getSessionQA } from "../../../api/features/qa";

export function useGetSessionQA(
  sessionId: number,
  sort: "newest" | "likes" = "newest",
) {
  return useQuery({
    queryKey: ["session-qa", sessionId, sort],
    queryFn: () => getSessionQA(sessionId, sort),
    staleTime: 10000,
  });
}
