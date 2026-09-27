import { rescheduleMeeting as rescheduleMeetingApi } from "@/api/features/scheduling";
import type { RescheduleMeetingIn } from "@/api/schemas";

export async function rescheduleMeeting(meetingId: number, data: RescheduleMeetingIn) {
  return await rescheduleMeetingApi(meetingId, data);
}
