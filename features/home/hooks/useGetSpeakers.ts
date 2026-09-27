import { getSpeakers } from "@/api/features/program";
import { useQuery } from "@tanstack/react-query";

export const useGetSpeakers = (enabled = true) => {
  return useQuery({
    queryKey: ["speakers"],
    queryFn: getSpeakers,
    enabled,
  });
};
