import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteExhibitorShowcase } from "../../../api/features/exhibitors";

export const useDeleteShowcase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (showcaseId: number) => deleteExhibitorShowcase(showcaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibitor-showcases"] });
    },
  });
};
