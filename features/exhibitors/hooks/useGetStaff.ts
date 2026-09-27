import { useQuery } from "@tanstack/react-query";
import { getExhibitorStaff } from "../../../api/features/exhibitors";

export const useGetStaff = () => {
  return useQuery({
    queryKey: ["exhibitor-staff"],
    queryFn: getExhibitorStaff,
    staleTime: 30000,
  });
};
