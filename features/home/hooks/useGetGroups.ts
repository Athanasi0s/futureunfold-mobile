import { useQuery } from "@tanstack/react-query";
import { getGroups } from "@/api/features/groups";
import type { GroupFilters, GroupOut } from "@/api/schemas";

export const useGetGroups = (filters?: GroupFilters, enabled = true) => {
  return useQuery<GroupOut[]>({
    queryKey: filters ? ["groups", filters] : ["groups"],
    queryFn: () => getGroups(filters),
    enabled,
  });
};
