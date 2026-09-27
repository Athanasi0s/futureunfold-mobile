import { api } from "../client";
import type { WalletPassKind, WalletPassIn, WalletPassOut } from "../schemas";

/**
 * Phase 13 — GWLT-01 (kinded for gap 5b).
 * POST /me/wallet/pass/{kind} — backend signs a Save-to-Google-Wallet JWT
 * and returns the URL the client opens via Linking.openURL.
 *
 * kind="badge"  → attendee badge pass (QR = str(user.id))
 * kind="ticket" → per-ticket pass; requires ticket_id in body. Backend
 *                 fetches the Ticket row, verifies ownership, and embeds
 *                 ticket.qr_code (UUID) as the barcode.
 */
export function createWalletPass(
  kind: WalletPassKind = "badge",
  body: WalletPassIn = {},
): Promise<WalletPassOut> {
  return api.auth<WalletPassOut>({
    url: `/me/wallet/pass/${kind}`,
    method: "POST",
    data: body,
  });
}
