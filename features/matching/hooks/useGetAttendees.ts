import { getUsers } from "@/api/features/user";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 20;

export type UserFilters = {
  role?: string;
  interestIds?: number[];
  availableNow?: boolean;
};

export function useGetAttendees(search?: string, filters?: UserFilters) {
  // Serialize filters for a stable query key so react-query detects changes
  const filterKey = JSON.stringify(filters ?? {});

  return useInfiniteQuery({
    queryKey: ["users", search, filterKey],
    queryFn: ({ pageParam = 1 }) =>
      getUsers({
        role: filters?.role ?? undefined,
        interests: filters?.interestIds?.length
          ? filters.interestIds
          : undefined,
        available_now: filters?.availableNow || undefined,
        page: pageParam,
        page_size: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    select: (data) => {
      const allUsers = data.pages.flatMap((page) => page.users);
      if (!search) return allUsers;
      const lower = search.toLowerCase();
      return allUsers.filter((u) =>
        u.full_name.toLowerCase().includes(lower),
      );
    },
  });
}
