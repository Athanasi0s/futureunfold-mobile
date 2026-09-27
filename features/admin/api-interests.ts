import { api } from "@/api/client";

export type AdminInterest = {
  id: number;
  name: string;
  usage_count: number;
};

export type AdminGoal = {
  id: number;
  name: string;
  description?: string;
  display_order: number;
  usage_count: number;
  created_at: string;
};

export const getAdminInterests = () =>
  api.auth<AdminInterest[]>({
    url: "/admin/interests",
    method: "GET",
  });

export const createAdminInterest = (name: string) =>
  api.auth<AdminInterest>({
    url: "/admin/interests",
    method: "POST",
    data: { name },
  });

export const updateAdminInterest = (id: number, name: string) =>
  api.auth<AdminInterest>({
    url: `/admin/interests/${id}`,
    method: "PATCH",
    data: { name },
  });

export const deleteAdminInterest = (id: number) =>
  api.auth<{ status: string }>({
    url: `/admin/interests/${id}`,
    method: "DELETE",
  });

export const getAdminGoals = () =>
  api.auth<AdminGoal[]>({
    url: "/admin/goals",
    method: "GET",
  });

export const createAdminGoal = (data: {
  name: string;
  description?: string;
  display_order?: number;
}) =>
  api.auth<AdminGoal>({
    url: "/admin/goals",
    method: "POST",
    data,
  });

export const updateAdminGoal = (
  id: number,
  data: Partial<{ name: string; description: string; display_order: number }>,
) =>
  api.auth<AdminGoal>({
    url: `/admin/goals/${id}`,
    method: "PATCH",
    data,
  });

export const deleteAdminGoal = (id: number) =>
  api.auth<{ status: string }>({
    url: `/admin/goals/${id}`,
    method: "DELETE",
  });
