import { api } from "../client";
import type {
    CertificateDataOut,
    EarnActionOut,
    EnhancedLeaderboardOut,
    JourneyTimelineOut,
    LeaderboardEntryOut,
    MilestoneOut,
    ProfileWrapUpOut,
    RewardsMeOut,
} from "../schemas";

// ============================================
// REWARDS API FUNCTIONS
// ============================================

/**
 * Get the current user's reward status (points, tier, unlocks, recent txns)
 */
export function getMyRewards(): Promise<RewardsMeOut> {
  return api.auth<RewardsMeOut>({ url: "/rewards/me", method: "GET" });
}

/**
 * Get milestone definitions with achievement status for the current user
 */
export function getMilestones(): Promise<MilestoneOut[]> {
  return api.auth<MilestoneOut[]>({ url: "/rewards/milestones", method: "GET" });
}

/**
 * Get profile wrap-up stats & timeline for the "Festival Wrap-up" view
 */
export function getProfileWrapup(): Promise<ProfileWrapUpOut> {
  return api.auth<ProfileWrapUpOut>({ url: "/rewards/profile-wrapup", method: "GET" });
}

/**
 * Get the rewards leaderboard (top users by points)
 */
export function getRewardsLeaderboard(limit = 50): Promise<LeaderboardEntryOut[]> {
  return api.auth<LeaderboardEntryOut[]>({
    url: `/rewards/leaderboard?limit=${limit}`,
    method: "GET",
  });
}

/**
 * Get the public catalogue of earning actions ("How to Earn")
 */
export function getEarningActions(): Promise<EarnActionOut[]> {
  return api.basic<EarnActionOut[]>({ url: "/rewards/actions", method: "GET" });
}

/**
 * Get the enhanced multi-category leaderboard
 */
export function getEnhancedLeaderboard(params: {
  category: string;
  period: string;
  date?: string;
  limit?: number;
}): Promise<EnhancedLeaderboardOut> {
  const searchParams = new URLSearchParams();
  searchParams.set("category", params.category);
  searchParams.set("period", params.period);
  if (params.date) searchParams.set("date", params.date);
  if (params.limit) searchParams.set("limit", String(params.limit));
  return api.auth<EnhancedLeaderboardOut>({
    url: `/rewards/leaderboard/enhanced?${searchParams.toString()}`,
    method: "GET",
  });
}

/**
 * Get the user's journey timeline (day-grouped activity feed)
 */
export function getJourneyTimeline(): Promise<JourneyTimelineOut> {
  return api.auth<JourneyTimelineOut>({ url: "/rewards/journey-timeline", method: "GET" });
}

/**
 * Get the user's certificate data (milestones, rankings, template config)
 */
export function getCertificateData(): Promise<CertificateDataOut> {
  return api.auth<CertificateDataOut>({ url: "/rewards/certificate-data", method: "GET" });
}
