import { useQuery } from "@tanstack/react-query";
import { getMyGroups } from "@/api/features/groups";
import type { GroupFilters, GroupOut } from "@/api/schemas";

export const useGetMyGroups = (filters?: GroupFilters, enabled = true) => {
  return useQuery<GroupOut[]>({
    queryKey: filters ? ["myGroups", filters] : ["myGroups"],
    queryFn: () => getMyGroups(filters),
    enabled,
  });
};
