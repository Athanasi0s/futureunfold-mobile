import { useQuery } from "@tanstack/react-query";
import { getAvailability } from "../get-availability";

export const useGetAvailability = (userId: number) => {
  return useQuery({
    queryKey: ["scheduling", "availability", userId],
    queryFn: () => getAvailability(userId),
    enabled: !!userId,
  });
};
