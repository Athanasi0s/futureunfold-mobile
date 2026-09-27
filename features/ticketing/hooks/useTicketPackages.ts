import { useQuery } from "@tanstack/react-query";
import { getTicketPackages } from "@/api/features/ticketing";

export function useTicketPackages() {
  return useQuery({
    queryKey: ["ticket-packages"],
    queryFn: getTicketPackages,
    staleTime: 5 * 60 * 1000,   // 5 minutes — packages don't change often
  });
}
