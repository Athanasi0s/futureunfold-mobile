import { updateMeetingAction as updateMeetingActionApi } from "@/api/features/scheduling";
import type { MeetingActionIn } from "@/api/schemas";

export async function updateMeetingAction(meetingId: number, data: MeetingActionIn) {
  return await updateMeetingActionApi(meetingId, data);
}
