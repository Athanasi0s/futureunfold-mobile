import { getLocations as getLocationsApi } from "@/api/features/scheduling";

type GetLocationsParams = {
  date: string;
  time: string;
};

export async function getLocations({ date, time }: GetLocationsParams) {
  return await getLocationsApi({ date, time });
}
