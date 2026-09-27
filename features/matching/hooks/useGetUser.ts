import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/api/features/user";
import type { UserProfileOut } from "@/api/schemas";

export const useGetUser = (id: number) => {
  return useQuery<UserProfileOut>({
    queryKey: ["user", id],
    queryFn: () => getUser(id),
    enabled: !!id,
  });
};
