import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setTheme } from "../api";
import { useConfigStore } from "@/features/config/stores/config-store";

export function useSetTheme() {
  const qc = useQueryClient();
  const fetchAndCacheConfig = useConfigStore((s) => s.fetchAndCacheConfig);
  return useMutation({
    mutationFn: setTheme,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "config"] });
      fetchAndCacheConfig();
    },
  });
}
