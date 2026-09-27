import { useQuery } from "@tanstack/react-query";
import { getPoll } from "../../../api/features/polls";

/**
 * Hook to fetch poll by ID with optional live polling
 * @param pollId - Poll ID to fetch
 * @param options - Query options
 * @param options.enabled - Whether to enable the query (default: true)
 * @param options.refetchInterval - Refetch interval in ms (default: false for no polling)
 */
export const useGetPoll = (
  pollId: number,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) => {
  return useQuery({
    queryKey: ["poll", pollId],
    queryFn: () => getPoll(pollId),
    enabled: (options?.enabled ?? true) && !!pollId,
    refetchInterval: options?.refetchInterval ?? false,
    staleTime: 2000, // Consider data stale after 2 seconds
    retry: 1, // Only retry once on failure (poll might not exist)
  });
};
