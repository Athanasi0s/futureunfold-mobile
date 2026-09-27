import { createMeeting as createMeetingApi } from "@/api/features/scheduling";
import type { CreateMeetingIn } from "@/api/schemas";

export async function createMeeting(data: CreateMeetingIn) {
  return await createMeetingApi(data);
}
