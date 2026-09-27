import { useQuery } from "@tanstack/react-query";
import { getEntityProfile } from "@/api/features/map";

export function useGetEntityProfile(entityId: number) {
  return useQuery({
    queryKey: ["entity-profile", entityId],
    queryFn: () => getEntityProfile(entityId),
    enabled: !!entityId,
  });
}
