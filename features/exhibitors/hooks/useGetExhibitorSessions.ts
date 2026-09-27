import { useQuery } from "@tanstack/react-query";
import { getExhibitorSessions } from "../../../api/features/exhibitors";

export const useGetExhibitorSessions = (exhibitorId: number | undefined) => {
  return useQuery({
    queryKey: ["exhibitor-sessions", exhibitorId],
    queryFn: () => getExhibitorSessions(exhibitorId!),
    enabled: !!exhibitorId,
    staleTime: 30000,
  });
};
