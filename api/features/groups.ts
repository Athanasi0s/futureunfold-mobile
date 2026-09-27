import { api } from "../client";
import type {
  GroupFilters,
  GroupMembersResponse,
  GroupMessage,
  GroupMessagesResponse,
  GroupOut,
  JoinGroupInput,
  SendGroupMessageInput,
} from "../schemas";

// ============================================
// GROUPS API FUNCTIONS
// ============================================

function buildGroupParams(filters?: GroupFilters): string {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.has_role) params.append("has_role", filters.has_role);
  if (filters?.venue) params.append("venue", filters.venue);
  return params.toString();
}

type GroupListResponse = {
  groups: GroupOut[];
  total: number;
  limit: number;
  offset: number;
};

/**
 * Get all groups
 */
export async function getGroups(filters?: GroupFilters): Promise<GroupOut[]> {
  const qs = buildGroupParams(filters);
  const url = qs ? `/groups?${qs}` : "/groups";
  const data = await api.auth<GroupListResponse>({ url, method: "GET" });
  return data.groups;
}

/**
 * Get groups the current user has joined
 */
export async function getMyGroups(filters?: GroupFilters): Promise<GroupOut[]> {
  const qs = buildGroupParams(filters);
  const url = qs ? `/me/groups?${qs}` : "/me/groups";
  const data = await api.auth<GroupListResponse>({ url, method: "GET" });
  return data.groups;
}

/**
 * Join a group
 */
export function joinGroup(data: JoinGroupInput): Promise<void> {
  return api.auth<void>({ url: "/groups/join", method: "POST", data });
}

// ============================================
// GROUP MESSAGING API FUNCTIONS
// ============================================

/**
 * Get messages for a group (paginated, newest first)
 */
export function getGroupMessages(
  groupId: number,
  offset = 0,
  limit = 50,
): Promise<GroupMessagesResponse> {
  return api.auth<GroupMessagesResponse>({
    url: `/groups/${groupId}/messages?limit=${limit}&offset=${offset}`,
    method: "GET",
  });
}

/**
 * Post a message to a group
 */
export function postGroupMessage(
  groupId: number,
  data: SendGroupMessageInput,
): Promise<GroupMessage> {
  return api.auth<GroupMessage>({
    url: `/groups/${groupId}/messages`,
    method: "POST",
    data,
  });
}

/**
 * Delete a message from a group
 */
export function deleteGroupMessage(
  groupId: number,
  messageId: number,
): Promise<{ ok: boolean }> {
  return api.auth<{ ok: boolean }>({
    url: `/groups/${groupId}/messages/${messageId}`,
    method: "DELETE",
  });
}

/**
 * Get members of a group
 */
export function getGroupMembers(
  groupId: number,
): Promise<GroupMembersResponse> {
  return api.auth<GroupMembersResponse>({
    url: `/groups/${groupId}/members`,
    method: "GET",
  });
}
