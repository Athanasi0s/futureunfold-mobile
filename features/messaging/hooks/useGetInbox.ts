import { useQuery } from "@tanstack/react-query";
import { getInbox } from "@/api/features/dm";

export const useGetInbox = () => {
  return useQuery({
    queryKey: ["dmInbox"],
    queryFn: getInbox,
    refetchInterval: 30000,
  });
};
