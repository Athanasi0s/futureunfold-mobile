import { api } from "../client";
import type {
  Conversation,
  DirectMessage,
  SendDirectMessageInput,
} from "../schemas";

// ============================================
// DIRECT MESSAGES API FUNCTIONS
// ============================================

/**
 * Get all DM conversations (inbox)
 */
export function getInbox(): Promise<Conversation[]> {
  return api.auth<Conversation[]>({ url: "/dm/inbox", method: "GET" });
}

/**
 * Get messages for a specific conversation
 */
export function getConversationMessages(
  conversationId: number,
): Promise<DirectMessage[]> {
  return api.auth<DirectMessage[]>({
    url: `/dm/conversations/${conversationId}/messages`,
    method: "GET",
  });
}

/**
 * Send a direct message
 */
export function sendDirectMessage(
  data: SendDirectMessageInput,
): Promise<DirectMessage> {
  return api.auth<DirectMessage>({ url: "/dm/send", method: "POST", data });
}

/**
 * Block a user
 */
export function blockUser(userId: number): Promise<void> {
  return api.auth<void>({ url: `/dm/block/${userId}`, method: "POST" });
}

/**
 * Unblock a user
 */
export function unblockUser(userId: number): Promise<void> {
  return api.auth<void>({ url: `/dm/block/${userId}`, method: "DELETE" });
}

/**
 * Report a user
 */
export function reportUser(
  userId: number,
  reason: string,
): Promise<void> {
  return api.auth<void>({
    url: `/dm/report/${userId}`,
    method: "POST",
    data: { reason },
  });
}
