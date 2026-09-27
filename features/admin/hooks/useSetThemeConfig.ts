/**
 * Phase 13 Plan 08 — mutation hook that persists the 5 AppConfig theme keys.
 *
 * The backend uses PUT /admin/config/{key} (one request per key) rather than
 * a batched PATCH. This hook serialises the 5 writes (preset_id + 4 colors),
 * then calls `fetchAndCacheConfig` to re-hydrate the client-side config store.
 *
 * On any individual failure (e.g. 422 on a malformed hex), the mutation
 * rejects with the first error; remaining keys may or may not have been
 * persisted. Callers should surface the error and keep the form state dirty
 * so the user can correct and retry.
 */

import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useConfigStore } from "@/features/config/stores/config-store";

export interface ThemeConfigPayload {
  active_theme_preset_id: string | null;
  theme_color_1: string | null;
  theme_color_2: string | null;
  theme_color_3: string | null;
  theme_color_4: string | null;
}

async function putConfigKey(key: string, value: string | null): Promise<void> {
  await api.auth<{ key: string; value: unknown }>({
    url: `/admin/config/${key}`,
    method: "PUT",
    data: { value },
  });
}

export function useSetThemeConfig() {
  const fetchAndCacheConfig = useConfigStore((s) => s.fetchAndCacheConfig);
  return useMutation<void, Error, ThemeConfigPayload>({
    mutationFn: async (payload) => {
      // Order matters only for audit clarity; consistency-wise the 5 writes
      // are independent key/value rows in AppConfig.
      await putConfigKey("active_theme_preset_id", payload.active_theme_preset_id);
      await putConfigKey("theme_color_1", payload.theme_color_1);
      await putConfigKey("theme_color_2", payload.theme_color_2);
      await putConfigKey("theme_color_3", payload.theme_color_3);
      await putConfigKey("theme_color_4", payload.theme_color_4);
    },
    onSuccess: () => {
      // Re-hydrate so the admin's own next render uses the fresh values too.
      fetchAndCacheConfig();
    },
  });
}
