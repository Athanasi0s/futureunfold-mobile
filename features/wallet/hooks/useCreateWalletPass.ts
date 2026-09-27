import { useMutation } from "@tanstack/react-query";
import { createWalletPass } from "@/api/features/wallet";
import type { WalletPassKind, WalletPassOut } from "@/api/schemas";

/**
 * Phase 13 — GWLT-01 (kinded for gap 5b).
 * POST /me/wallet/pass/{kind} and return the Save-to-Google-Wallet URL.
 *
 * kind="badge"  → badge pass (default, backward-compatible with digital-id.tsx)
 * kind="ticket" → per-ticket pass; ticketId required. Backend verifies ownership
 *                 and embeds ticket.qr_code (UUID) as the wallet barcode.
 *
 * Consumed by GoogleWalletButton. Backend signs an RS256 JWT against the
 * EventTicketClass created by scripts/register_wallet_classes.py and returns
 * https://pay.google.com/gp/v/save/<jwt> which Linking.openURL hands off
 * to the Google Wallet app.
 */
export type UseCreateWalletPassArgs = {
  kind?: WalletPassKind; // default "badge"
  ticketId?: number; // required when kind === "ticket"
};

export function useCreateWalletPass(args: UseCreateWalletPassArgs = {}) {
  const { kind = "badge", ticketId } = args;
  return useMutation<WalletPassOut, Error, void>({
    mutationFn: () =>
      createWalletPass(kind, ticketId !== undefined ? { ticket_id: ticketId } : {}),
  });
}
