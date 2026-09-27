import { api } from "@/api/client";

export type AdminGroup = {
  id: number;
  group_type: string;
  ref_key: string;
  title: string;
  description?: string;
  member_count: number;
  created_at: string;
};

export const getAdminGroups = (params?: {
  search?: string;
  offset?: number;
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.offset !== undefined)
    searchParams.set("offset", String(params.offset));
  if (params?.limit !== undefined)
    searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return api.auth<{ total: number; items: AdminGroup[] }>({
    url: `/admin/groups${qs ? `?${qs}` : ""}`,
    method: "GET",
  });
};

export const createAdminGroup = (data: {
  group_type: string;
  ref_key: string;
  title: string;
  description?: string;
  interest_ids?: number[];
}) =>
  api.auth<AdminGroup>({
    url: "/admin/groups",
    method: "POST",
    data,
  });

export const updateAdminGroup = (
  id: number,
  data: Partial<{
    group_type: string;
    title: string;
    description: string;
    interest_ids: number[];
  }>,
) =>
  api.auth<AdminGroup>({
    url: `/admin/groups/${id}`,
    method: "PATCH",
    data,
  });

export const deleteAdminGroup = (id: number) =>
  api.auth<{ status: string }>({
    url: `/admin/groups/${id}`,
    method: "DELETE",
  });
