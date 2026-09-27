import { useMutation } from "@tanstack/react-query";
import { patchMe } from "../patch-me";
import { useAuthStore } from "../stores/auth";
import type { MeUpdateIn } from "@/api/schemas";

export const usePatchMe = () => {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (data: MeUpdateIn) => patchMe(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
    },
  });
};
