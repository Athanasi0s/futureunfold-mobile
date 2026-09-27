import { getConflicts as getConflictsApi } from "@/api/features/scheduling";

type GetConflictsParams = {
  userId: number;
  date: string;
  time: string;
};

export async function getConflicts({ userId, date, time }: GetConflictsParams) {
  return await getConflictsApi({ userId, date, time });
}
