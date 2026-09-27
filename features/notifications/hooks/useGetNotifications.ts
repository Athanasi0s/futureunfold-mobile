import { getNotifications } from "@/api/features/notifications";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { useQuery } from "@tanstack/react-query";

export function useGetNotifications() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: isAuthenticated,
  });
}
