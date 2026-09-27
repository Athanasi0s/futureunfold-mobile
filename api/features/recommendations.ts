import { api } from "../client";
import type { GroupOut, SessionOut } from "../schemas";

// ============================================
// RECOMMENDATIONS API FUNCTIONS (Auth required)
// ============================================

/**
 * Get personalized session recommendations for the current user
 */
export function getRecommendedSessions(): Promise<SessionOut[]> {
  return api.auth<SessionOut[]>({
    url: "/me/recommended-sessions",
    method: "GET",
  });
}

/**
 * Get personalized group recommendations for the current user
 */
export function getRecommendedGroups(): Promise<GroupOut[]> {
  return api.auth<GroupOut[]>({
    url: "/me/recommended-groups",
    method: "GET",
  });
}
