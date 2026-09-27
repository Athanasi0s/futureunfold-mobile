import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMeeting } from "../create-meeting";
import type { CreateMeetingIn } from "../types";

export const useCreateMeeting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMeetingIn) => createMeeting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduling"] });
    },
  });
};
