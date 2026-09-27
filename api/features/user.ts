import { api } from "../client";
import { UserProfileOut, UsersListResponse } from "../schemas";

/**
 * Get user profile by ID
 */
export function getUser(id: number): Promise<UserProfileOut> {
  return api.basic<UserProfileOut>({ url: `/users/${id}`, method: "GET" });
}

export type GetUsersParams = {
  role?: string;
  interests?: number[];
  available_now?: boolean;
  page?: number;
  page_size?: number;
};

/**
 * Get users with optional filters
 */
export function getUsersByRole(
  role: string,
  page = 1,
  pageSize = 50,
): Promise<UsersListResponse> {
  return getUsers({ role, page, page_size: pageSize });
}

export function getUsers(
  params: GetUsersParams = {},
): Promise<UsersListResponse> {
  const searchParams = new URLSearchParams();

  if (params.role) searchParams.append("role", params.role);
  if (params.available_now) searchParams.append("available_now", "true");
  if (params.page) searchParams.append("page", String(params.page));
  if (params.page_size)
    searchParams.append("page_size", String(params.page_size));
  if (params.interests) {
    params.interests.forEach((id) =>
      searchParams.append("interests", String(id)),
    );
  }
  console.log("🔍 → getUsers → searchParams:", searchParams);

  const qs = searchParams.toString();
  return api.basic<UsersListResponse>({
    url: `/users${qs ? `?${qs}` : ""}`,
    method: "GET",
  });
}
