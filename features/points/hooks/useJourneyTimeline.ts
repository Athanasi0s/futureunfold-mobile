import { useQuery } from "@tanstack/react-query";
import { getJourneyTimeline } from "@/api/features/rewards";

export function useJourneyTimeline() {
  return useQuery({
    queryKey: ["journey-timeline"],
    queryFn: getJourneyTimeline,
  });
}
