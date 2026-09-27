import { api } from "@/api/client";
import type { BroadcastPushIn, BroadcastPushOut } from "@/api/schemas";

/**
 * Phase 13 — PUSH-01..04.
 * POST /admin/push/broadcast — server resolves the deeplink_template at
 * send time, fans out to the role-filtered audience, and returns the
 * per-platform device breakdown alongside the resolved deeplink.
 *
 * Backend contract: see `app/api/routes/admin_push.py` and
 * `app/services/deeplink_resolver.py`. Empty-target templates surface as
 * HTTP 400 with a canonical message in `detail` (e.g. "No trending group
 * in the last 7 days — pick a different link destination.").
 */
export function sendBroadcast(data: BroadcastPushIn): Promise<BroadcastPushOut> {
  return api.auth<BroadcastPushOut>({
    url: "/admin/push/broadcast",
    method: "POST",
    data,
  });
}
