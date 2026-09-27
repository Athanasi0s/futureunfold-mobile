import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rescheduleMeeting } from "../reschedule-meeting";
import type { RescheduleMeetingIn } from "@/api/schemas";

export const useRescheduleMeeting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, data }: { meetingId: number; data: RescheduleMeetingIn }) =>
      rescheduleMeeting(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduling"] });
    },
  });
};
