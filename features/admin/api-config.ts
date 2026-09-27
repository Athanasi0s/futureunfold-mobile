import { api } from "@/api/client";

export const getAdminConfig = () =>
  api.auth<{ key: string; value: unknown }[]>({
    url: "/admin/config",
    method: "GET",
  });

export const setAdminConfig = (key: string, value: unknown) =>
  api.auth<{ status: string }>({
    url: `/admin/config/${key}`,
    method: "PUT",
    data: { value },
  });
