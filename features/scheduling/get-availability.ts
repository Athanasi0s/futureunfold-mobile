import { getAvailability as getAvailabilityApi } from "@/api/features/scheduling";

export async function getAvailability(userId: number) {
  return await getAvailabilityApi(userId);
}
