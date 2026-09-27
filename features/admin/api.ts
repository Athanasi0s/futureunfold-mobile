import { api } from "@/api/client";
import type { DemographicsOut, GroupRankingsOut } from "@/api/schemas";

// Types
export type AdminUser = {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  is_blocked: boolean;
  points: number;
  created_at: string;
};

export type PaginatedUsers = {
  total: number;
  offset: number;
  limit: number;
  items: AdminUser[];
};

export type RoleBreakdown = {
  role: string;
  count: number;
  percentage: number;
};

export type InterestStat = {
  name: string;
  count: number;
};

export type DailyRegistration = {
  date: string;
  count: number;
};

export type AdminStats = {
  total_users: number;
  users_by_role: Record<string, number>;
  role_breakdown: RoleBreakdown[];
  total_groups: number;
  total_sessions: number;
  total_polls: number;
  top_interests: InterestStat[];
  total_group_memberships: number;
  avg_members_per_group: number;
  total_dms: number;
  total_meetings: number;
  total_qr_scans: number;
  total_agenda_saves: number;
  avg_points: number;
  max_points: number;
  users_with_points: number;
  total_tickets: number;
  used_tickets: number;
  active_tickets: number;
  pending_reports: number;
  total_reports: number;
  daily_registrations: DailyRegistration[];
  demographics?: DemographicsOut;
  group_rankings?: GroupRankingsOut;
};

export type AuditLogEntry = {
  id: number;
  admin_id: number;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
};

export type TicketPackageAdmin = {
  id: number;
  ref_key: string;
  name: string;
  price_eur: number;
  description: string | null;
  features: string[];
  stripe_price_id: string;
  max_quantity: number | null;
  is_active: boolean;
};

// API functions
export const getAdminUsers = (params: {
  search?: string;
  role?: string;
  blocked?: boolean;
  offset?: number;
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.role) searchParams.set("role", params.role);
  if (params.blocked !== undefined)
    searchParams.set("blocked", String(params.blocked));
  if (params.offset !== undefined)
    searchParams.set("offset", String(params.offset));
  if (params.limit !== undefined)
    searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return api.auth<PaginatedUsers>({
    url: `/admin/users${qs ? `?${qs}` : ""}`,
    method: "GET",
  });
};

export const blockUser = (userId: number) =>
  api.auth<{ status: string }>({
    url: `/admin/users/${userId}/block`,
    method: "POST",
  });

export const unblockUser = (userId: number) =>
  api.auth<{ status: string }>({
    url: `/admin/users/${userId}/unblock`,
    method: "POST",
  });

export const deleteUser = (userId: number) =>
  api.auth<{ status: string }>({
    url: `/admin/users/${userId}`,
    method: "DELETE",
  });

export const getAdminStats = () =>
  api.auth<AdminStats>({ url: "/admin/stats", method: "GET" });

export const setTheme = (presetId: string) =>
  api.auth<{ status: string; preset_id: string }>({
    url: "/admin/theme",
    method: "PUT",
    data: { preset_id: presetId },
  });

export const getTicketPackages = () =>
  api.auth<TicketPackageAdmin[]>({
    url: "/admin/ticket-packages",
    method: "GET",
  });

export const createTicketPackage = (data: {
  name: string;
  price_eur: number;
  description?: string;
  features?: string[];
  stripe_price_id: string;
  max_quantity?: number;
  is_active?: boolean;
}) =>
  api.auth<TicketPackageAdmin>({
    url: "/admin/ticket-packages",
    method: "POST",
    data,
  });

export const updateTicketPackage = (
  id: number,
  data: {
    name?: string;
    price_eur?: number;
    description?: string;
    features?: string[];
    max_quantity?: number;
    is_active?: boolean;
  },
) =>
  api.auth<TicketPackageAdmin>({
    url: `/admin/ticket-packages/${id}`,
    method: "PATCH",
    data,
  });

export const deleteTicketPackage = (id: number) =>
  api.auth<{ status: string }>({
    url: `/admin/ticket-packages/${id}`,
    method: "DELETE",
  });

export const getAuditLog = (params: {
  offset?: number;
  limit?: number;
  action?: string;
}) => {
  const searchParams = new URLSearchParams();
  if (params.offset !== undefined)
    searchParams.set("offset", String(params.offset));
  if (params.limit !== undefined)
    searchParams.set("limit", String(params.limit));
  if (params.action) searchParams.set("action", params.action);
  const qs = searchParams.toString();
  return api.auth<{
    total: number;
    offset: number;
    limit: number;
    items: AuditLogEntry[];
  }>({
    url: `/admin/audit-log${qs ? `?${qs}` : ""}`,
    method: "GET",
  });
};
