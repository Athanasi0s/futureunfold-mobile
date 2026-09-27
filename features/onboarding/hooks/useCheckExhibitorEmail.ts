import { checkExhibitorEmail } from "@/api/features/exhibitors";
import { useQuery } from "@tanstack/react-query";

export const useCheckExhibitorEmail = (email: string | undefined) => {
  return useQuery({
    queryKey: ["check-exhibitor-email", email],
    queryFn: () => checkExhibitorEmail(email!),
    enabled: !!email,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
