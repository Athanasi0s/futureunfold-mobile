/**
 * Phase 13 gap-7b — "Reset to default" admin action.
 *
 * Sends PUT /admin/config/{key} with {value: null} for each of the five
 * theme keys (active_theme_preset_id + theme_color_1..4). The backend
 * accepts null (see admin.py:633 — `if value is not None: validate`), so
 * null bypasses the hex/preset regex and effectively clears the stored
 * value. On next `GET /config` the fallback chain hydrates:
 *   - active_theme_preset_id → null → resolvePreset() returns default
 *     preset (midnight-indigo)
 *   - theme_color_N → null → buildOverrides() omits the key → applyThemePreset
 *     falls through to the preset's color values
 *
 * On success, `fetchAndCacheConfig()` re-reads /config so the admin's
 * current render immediately reflects the default. The modal that calls
 * this hook should show an Alert on success + error.
 *
 * Serial order matches useSetThemeConfig.mutationFn's pattern (Plan 13-08).
 * Null values are idempotent — retrying sets them to null again, so
 * partial-failure cleanup is not needed.
 */

import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useConfigStore } from "@/features/config/stores/config-store";

async function putConfigKey(key: string, value: null): Promise<void> {
  await api.auth<{ key: string; value: unknown }>({
    url: `/admin/config/${key}`,
    method: "PUT",
    data: { value },
  });
}

export function useResetTheme() {
  const fetchAndCacheConfig = useConfigStore((s) => s.fetchAndCacheConfig);
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await putConfigKey("active_theme_preset_id", null);
      await putConfigKey("theme_color_1", null);
      await putConfigKey("theme_color_2", null);
      await putConfigKey("theme_color_3", null);
      await putConfigKey("theme_color_4", null);
    },
    onSuccess: () => {
      fetchAndCacheConfig();
    },
  });
}
