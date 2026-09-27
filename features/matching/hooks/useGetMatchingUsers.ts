import { useQuery } from "@tanstack/react-query";
import { getMatchingUsers } from "../get-matching-users";
import type { MatchingFilters } from "../get-matching-users";

export const useGetMatchingUsers = (
  enabled = true,
  filters?: MatchingFilters,
) => {
  return useQuery({
    queryKey: ["matching-users", filters ?? {}],
    queryFn: () => getMatchingUsers(filters),
    enabled,
  });
};
