import { useQuery } from "@tanstack/react-query";
import { getVenues } from "@/api/features/program";
import type { VenueOut } from "@/api/schemas";

export const useGetVenues = () => {
  return useQuery<VenueOut[]>({
    queryKey: ["venues"],
    queryFn: getVenues,
  });
};
