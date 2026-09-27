import { useQuery } from "@tanstack/react-query";
import { getLocations } from "../get-locations";

type UseGetLocationsParams = {
  date: string;
  time: string;
  enabled?: boolean;
};

export const useGetLocations = ({
  date,
  time,
  enabled = true,
}: UseGetLocationsParams) => {
  return useQuery({
    queryKey: ["scheduling", "locations", date, time],
    queryFn: () => getLocations({ date, time }),
    enabled: enabled && !!date && !!time,
  });
};
