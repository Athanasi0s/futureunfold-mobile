import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { createCheckoutSession, getMyTickets } from "@/api/features/ticketing";

/**
 * Poll for new tickets after browser closes.
 * The Stripe webhook may take a few seconds to process, so we retry.
 */
async function pollForNewTicket(previousCount: number, maxRetries = 6, intervalMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const tickets = await getMyTickets();
      if (tickets.length > previousCount) return true;
    } catch {
      // ignore — will retry
    }
  }
  return false;
}

export function useCreateCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageId: number) => {
      // Snapshot current ticket count before purchase
      const currentTickets = queryClient.getQueryData<any[]>(["my-tickets"]);
      const previousCount = currentTickets?.length ?? 0;

      const { checkout_url } = await createCheckoutSession({ package_id: packageId });

      // Open Stripe Checkout in in-app browser — resolves when dismissed
      await WebBrowser.openBrowserAsync(checkout_url);

      // Immediately invalidate, then poll if webhook hasn't landed yet
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });

      // Poll in background — when new ticket appears, refetch
      pollForNewTicket(previousCount).then((found) => {
        if (found) {
          queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
        }
      });
    },
  });
}
