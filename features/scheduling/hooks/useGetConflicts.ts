import { useQuery } from "@tanstack/react-query";
import { getConflicts } from "../get-conflicts";

type UseGetConflictsParams = {
  userId: number;
  date: string;
  time: string;
  enabled?: boolean;
};

export const useGetConflicts = ({
  userId,
  date,
  time,
  enabled = true,
}: UseGetConflictsParams) => {
  return useQuery({
    queryKey: ["scheduling", "conflicts", userId, date, time],
    queryFn: () => getConflicts({ userId, date, time }),
    enabled: enabled && !!userId && !!date && !!time,
  });
};
