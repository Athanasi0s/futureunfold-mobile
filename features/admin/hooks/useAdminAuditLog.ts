import { useQuery } from "@tanstack/react-query";
import { getAuditLog } from "../api";

export function useAdminAuditLog(params: {
  offset?: number;
  limit?: number;
  action?: string;
}) {
  return useQuery({
    queryKey: ["admin", "audit-log", params],
    queryFn: () => getAuditLog(params),
  });
}
