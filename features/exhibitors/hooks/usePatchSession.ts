import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchSession } from "../../../api/features/program";
import type { SessionPatchInput } from "../../../api/schemas";

export const usePatchSession = (sessionId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SessionPatchInput) => patchSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibitor-sessions"] });
    },
  });
};
