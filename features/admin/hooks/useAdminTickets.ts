import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTicketPackages,
  createTicketPackage,
  updateTicketPackage,
  deleteTicketPackage,
} from "../api";

export function useAdminTicketPackages() {
  return useQuery({
    queryKey: ["admin", "ticket-packages"],
    queryFn: getTicketPackages,
  });
}

export function useCreateTicketPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTicketPackage,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "ticket-packages"] }),
  });
}

export function useUpdateTicketPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateTicketPackage>[1];
    }) => updateTicketPackage(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "ticket-packages"] }),
  });
}

export function useDeleteTicketPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTicketPackage,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "ticket-packages"] }),
  });
}
