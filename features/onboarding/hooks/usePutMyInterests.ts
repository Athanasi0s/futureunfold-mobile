import { useMutation } from "@tanstack/react-query";
import { putMyInterests } from "../put-my-interests";

export const usePutMyInterests = () => {
  return useMutation({
    mutationFn: (interestIds: number[]) => putMyInterests(interestIds),
  });
};
