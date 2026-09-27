import { api } from "../client";
import type {
  TicketPackageOut,
  CheckoutIn,
  CheckoutOut,
  TicketOut,
  TicketValidateIn,
  TicketValidateOut,
} from "../schemas";

export function getTicketPackages(): Promise<TicketPackageOut[]> {
  return api.basic<TicketPackageOut[]>({ url: "/tickets/packages", method: "GET" });
}

export function createCheckoutSession(data: CheckoutIn): Promise<CheckoutOut> {
  return api.auth<CheckoutOut>({ url: "/tickets/checkout", method: "POST", data });
}

export function getMyTickets(): Promise<TicketOut[]> {
  return api.auth<TicketOut[]>({ url: "/tickets/me", method: "GET" });
}

export function validateTicket(data: TicketValidateIn): Promise<TicketValidateOut> {
  return api.auth<TicketValidateOut>({ url: "/tickets/validate", method: "POST", data });
}
