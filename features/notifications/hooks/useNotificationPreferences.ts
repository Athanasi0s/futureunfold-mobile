import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/api/features/notifications";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useNotificationPreferences() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: preferences = [],
    isLoading,
  } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: getNotificationPreferences,
    enabled: isAuthenticated,
  });

  const { mutate, isPending: isUpdating } = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  function toggle(category: string, enabled: boolean) {
    mutate([{ category, enabled }]);
  }

  return { preferences, isLoading, toggle, isUpdating };
}
