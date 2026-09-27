import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteExhibitorStaff } from "../../../api/features/exhibitors";

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (staffId: number) => deleteExhibitorStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibitor-staff"] });
    },
  });
};
