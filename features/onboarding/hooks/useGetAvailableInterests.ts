import { useQuery } from "@tanstack/react-query";
import { getInterests } from "../get-available-interests";

export const useGetAvailableInterests = () => {
  return useQuery({
    queryKey: ["available-interests"],
    queryFn: getInterests,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
