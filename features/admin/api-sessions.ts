import { api } from "@/api/client";
import type {
  SessionOut,
  SessionCreateInput,
  SessionPatchInput,
} from "@/api/schemas";
import type { AdminVenue } from "@/features/admin/api-venues";

// ---- Response types local to this module ----
export type SessionImpact = {
  favorites: number;
  chat_messages: number;
  qa_items: number;
};

export type CancelResponse = {
  already_cancelled: boolean;
  session_id: number;
  favoriters_notified?: number;
};

export type NotifyUpdateResponse = {
  favoriters_notified: number;
  changed_fields: string[];
};

export type AdminUser = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_blocked?: boolean;
  points?: number;
  created_at?: string;
};

type PaginatedAdminUsers = {
  total: number;
  offset: number;
  limit: number;
  items: AdminUser[];
};

export type AdminExhibitor = {
  id: number;
  full_name: string;
  booth_code?: string | null;
  company?: string | null;
  avatar_url?: string | null;
};

// ---- Session list + CRUD ----
export const getAdminSessions = (params: {
  search?: string;
  timeframe?: "upcoming" | "past" | "all";
  show_cancelled?: boolean;
}) => {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.timeframe) qs.set("timeframe", params.timeframe);
  if (params.show_cancelled) qs.set("show_cancelled", "true");
  const s = qs.toString();
  return api.auth<SessionOut[]>({
    url: `/admin/sessions${s ? `?${s}` : ""}`,
    method: "GET",
  });
};

export const createAdminSession = (data: SessionCreateInput) =>
  api.auth<SessionOut>({ url: "/sessions", method: "POST", data });

export const updateAdminSession = (id: number, data: SessionPatchInput) =>
  api.auth<SessionOut>({ url: `/sessions/${id}`, method: "PATCH", data });

export const deleteAdminSession = (id: number) =>
  api.auth<{ success: boolean; message: string }>({
    url: `/sessions/${id}`,
    method: "DELETE",
  });

export const getSessionImpact = (id: number) =>
  api.auth<SessionImpact>({
    url: `/admin/sessions/${id}/impact`,
    method: "GET",
  });

export const cancelAdminSession = (id: number) =>
  api.auth<CancelResponse>({
    url: `/admin/sessions/${id}/cancel`,
    method: "POST",
  });

export const notifyUpdateSession = (
  id: number,
  changed_fields: ("time" | "venue")[],
) =>
  api.auth<NotifyUpdateResponse>({
    url: `/admin/sessions/${id}/notify-update`,
    method: "POST",
    data: { changed_fields },
  });

// ---- Picker data sources ----
export const getAdminExhibitors = (search?: string) => {
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  const s = qs.toString();
  return api.auth<AdminExhibitor[]>({
    url: `/admin/exhibitors${s ? `?${s}` : ""}`,
    method: "GET",
  });
};

export const getAdminSpeakerUsers = async (
  search?: string,
): Promise<AdminUser[]> => {
  const qs = new URLSearchParams({ role: "speaker", limit: "100" });
  if (search) qs.set("search", search);
  const res = await api.auth<PaginatedAdminUsers>({
    url: `/admin/users?${qs.toString()}`,
    method: "GET",
  });
  return res.items ?? [];
};

// Re-export for the venue picker instantiation in admin-sessions.tsx
export { getAdminVenues } from "@/features/admin/api-venues";
export type { AdminVenue };
