import { useQuery } from "@tanstack/react-query";
import { getProgram } from "@/api/features/program";
import type { SessionOut } from "@/api/schemas";

export const useGetProgram = (enabled = true) => {
  return useQuery<SessionOut[]>({
    queryKey: ["program"],
    queryFn: () => getProgram(),
    enabled,
  });
};
