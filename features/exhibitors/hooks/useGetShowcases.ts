import { useQuery } from "@tanstack/react-query";
import { getExhibitorShowcases } from "../../../api/features/exhibitors";

export const useGetShowcases = () => {
  return useQuery({
    queryKey: ["exhibitor-showcases"],
    queryFn: getExhibitorShowcases,
    staleTime: 30000,
  });
};
