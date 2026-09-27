import { getMyMeetings as getMyMeetingsApi } from "@/api/features/scheduling";

export async function getMyMeetings() {
  return await getMyMeetingsApi();
}
