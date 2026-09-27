import { api } from "../client";
import type {
  PollCreateInput,
  PollDetailOut,
  PollOut,
  VoteInput,
} from "../schemas";

// ============================================
// POLLS API FUNCTIONS
// ============================================

/**
 * Get poll by ID (auth required for vote status)
 */
export function getPoll(pollId: number): Promise<PollOut> {
  return api.auth<PollOut>({ url: `/polls/${pollId}`, method: "GET" });
}

/**
 * Vote on a poll option (auth required)
 */
export function votePoll(pollId: number, data: VoteInput): Promise<PollOut> {
  return api.auth<PollOut>({
    url: `/polls/${pollId}/vote`,
    method: "POST",
    data,
  });
}

// ============================================
// MY POLLS API FUNCTIONS (Speaker/Exhibitor only)
// ============================================

/**
 * Get polls created by the current user (auth required)
 */
export function getMyPolls(): Promise<PollDetailOut[]> {
  return api.auth<PollDetailOut[]>({ url: "/polls/my", method: "GET" });
}

/**
 * Create a new poll (auth required, speaker/exhibitor role only)
 */
export function createPoll(data: PollCreateInput): Promise<PollOut> {
  return api.auth<PollOut>({ url: "/polls", method: "POST", data });
}

/**
 * Delete/deactivate a poll (auth required, must be creator)
 * Note: This is a soft delete - sets poll to inactive
 */
export function deletePoll(pollId: number): Promise<{ success: boolean; message: string }> {
  return api.auth<{ success: boolean; message: string }>({
    url: `/polls/${pollId}`,
    method: "DELETE",
  });
}
