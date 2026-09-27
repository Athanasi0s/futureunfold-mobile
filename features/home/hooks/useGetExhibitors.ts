import { getUsersByRole } from "@/api/features/user";
import type { UsersListResponse } from "@/api/schemas";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 10;

export const useGetExhibitors = (enabled = true) => {
  return useInfiniteQuery<UsersListResponse>({
    queryKey: ["exhibitors"],
    queryFn: ({ pageParam = 1 }) =>
      getUsersByRole("exhibitor", pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled,
  });
};
