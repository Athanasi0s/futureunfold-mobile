import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMeetingAction } from "../update-meeting-action";
import type { MeetingActionIn } from "@/api/schemas";

export const useUpdateMeetingAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, data }: { meetingId: number; data: MeetingActionIn }) =>
      updateMeetingAction(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduling"] });
    },
  });
};
