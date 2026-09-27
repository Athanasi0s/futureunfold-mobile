import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addExhibitorStaff } from "../../../api/features/exhibitors";
import type { StaffIn } from "../../../api/schemas";

export const useAddStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StaffIn) => addExhibitorStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibitor-staff"] });
    },
  });
};
