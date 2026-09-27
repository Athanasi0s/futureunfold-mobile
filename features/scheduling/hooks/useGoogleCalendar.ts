import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGoogleCalendarStatus,
  sendGoogleCallback,
  disconnectGoogleCalendar,
} from "@/api/features/google-calendar";

export function useGoogleCalendarStatus() {
  return useQuery({
    queryKey: ["google-calendar", "status"],
    queryFn: getGoogleCalendarStatus,
  });
}

export function useConnectGoogleCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendGoogleCallback,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["google-calendar", "status"],
      });
    },
  });
}

export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectGoogleCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["google-calendar", "status"],
      });
    },
  });
}
