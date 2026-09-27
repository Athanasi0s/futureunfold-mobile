import { useMutation } from "@tanstack/react-query";
import { sendBroadcast } from "@/api/features/admin-push";
import type { BroadcastPushIn, BroadcastPushOut } from "@/api/schemas";

/**
 * Phase 13 — admin push broadcast with resolved deeplink + device breakdown.
 *
 * Backend returns 400 with a friendly message when a dynamic template
 * resolves to empty (see EmptyTargetError in
 * `app/services/deeplink_resolver.py`). Callers should inspect
 * `error.response?.status === 400` and surface
 * `error.response?.data?.detail` verbatim — the backend owns that copy.
 */
export function useSendBroadcast() {
  return useMutation<BroadcastPushOut, Error, BroadcastPushIn>({
    mutationFn: (data) => sendBroadcast(data),
  });
}
