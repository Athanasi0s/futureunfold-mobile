import { useQuery } from "@tanstack/react-query";
import { getMyMeetings } from "../get-my-meetings";

export const useGetMyMeetings = () => {
  return useQuery({
    queryKey: ["scheduling", "meetings"],
    queryFn: () => getMyMeetings(),
    staleTime: 0, // 1 minute
  });
};
