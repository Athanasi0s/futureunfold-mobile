import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scanQr } from "../../../api/features/qr";

/**
 * Mutation hook for scanning a user's QR code.
 * On success, invalidates my-qr, scan-history, and leaderboard queries.
 */
export const useScanQr = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => scanQr(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-qr"] });
      queryClient.invalidateQueries({ queryKey: ["scan-history"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
};
