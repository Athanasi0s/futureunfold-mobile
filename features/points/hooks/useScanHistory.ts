import { useQuery } from "@tanstack/react-query";
import { getScanHistory, type ScanHistoryDirection } from "../../../api/features/qr";

/**
 * Fetch the current user's scan history
 * @param direction Filter by "scanned_by_me", "scanned_me", or "all" (default)
 */
export const useScanHistory = (direction: ScanHistoryDirection = "all") => {
  return useQuery({
    queryKey: ["scan-history", direction],
    queryFn: () => getScanHistory(direction),
    staleTime: 15000,
  });
};
