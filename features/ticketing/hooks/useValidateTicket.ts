import { useMutation } from "@tanstack/react-query";
import { validateTicket } from "@/api/features/ticketing";
import type { TicketValidateOut } from "@/api/schemas";

export function useValidateTicket() {
  return useMutation({
    mutationFn: (qrCode: string) => validateTicket({ qr_code: qrCode }),
  });
}
