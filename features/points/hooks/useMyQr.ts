import { useQuery } from "@tanstack/react-query";
import { getMyQr } from "../../../api/features/qr";

/**
 * Fetch the current user's QR info (user_id + total points)
 */
export const useMyQr = () => {
  return useQuery({
    queryKey: ["my-qr"],
    queryFn: getMyQr,
    staleTime: 30000,
  });
};
