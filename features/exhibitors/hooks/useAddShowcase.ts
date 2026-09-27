import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addExhibitorShowcase } from "../../../api/features/exhibitors";
import type { ShowcaseIn } from "../../../api/schemas";

export const useAddShowcase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ShowcaseIn) => addExhibitorShowcase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibitor-showcases"] });
    },
  });
};
