import { api } from "@/api/client";

export async function reportUser(
  userId: number,
  reason: string,
  details?: string,
) {
  return api.auth({
    url: `/users/${userId}/report`,
    method: "POST",
    data: { reason, details },
  });
}

export async function blockUser(userId: number) {
  return api.auth({
    url: `/users/${userId}/block`,
    method: "POST",
  });
}

export async function unblockUser(userId: number) {
  return api.auth({
    url: `/users/${userId}/block`,
    method: "DELETE",
  });
}

export async function getBlockedUsers() {
  return api.auth<
    { id: number; full_name: string; avatar_url: string | null }[]
  >({
    url: "/me/blocked-users",
    method: "GET",
  });
}

// Admin report endpoints
export async function adminBlockUser(userId: number) {
  return api.auth({ url: `/admin/users/${userId}/block`, method: "POST" });
}

export async function getAdminReports(
  status?: string,
  offset = 0,
  limit = 20,
) {
  return api.auth<{
    items: AdminReport[];
    total: number;
    offset: number;
    limit: number;
  }>({
    url: "/admin/reports",
    method: "GET",
    params: { status, offset, limit },
  });
}

export async function setUserTheme(themeId: string | null) {
  return api.auth({ url: "/me/theme", method: "PUT", data: { theme_id: themeId } });
}

export async function updateReport(
  reportId: number,
  status: string,
  adminNotes?: string,
) {
  return api.auth({
    url: `/admin/reports/${reportId}`,
    method: "PATCH",
    data: { status, admin_notes: adminNotes },
  });
}

export type AdminReport = {
  id: number;
  reporter: { id: number; name: string | null };
  reported: { id: number; name: string | null };
  reason: string;
  details: string | null;
  status: "pending" | "reviewed" | "actioned";
  admin_notes: string | null;
  created_at: string | null;
};
