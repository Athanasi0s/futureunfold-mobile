import { useQuery } from "@tanstack/react-query";
import { getMyTickets } from "@/api/features/ticketing";

export function useMyTickets() {
  return useQuery({
    queryKey: ["my-tickets"],
    queryFn: getMyTickets,
  });
}
