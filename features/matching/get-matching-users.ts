import { SessionBriefOut } from "../../api/schemas";
import { api } from "../../api/client";

export type MatchingUser = {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
  role: string;
  company: string | null;
  bio: string | null;
  linkedin_url: string | null;
  interests: string[] | null;
  sessions: SessionBriefOut[] | null;
  common_interests: string[];
  common_goals: string[];
  common_discussion_topics: string[];
  common_groups: string[];
  same_level: boolean;
  match_score: number;
};

export type MatchingFilters = {
  role?: string;
  interestIds?: number[];
  availableNow?: boolean;
};

export async function getMatchingUsers(filters?: MatchingFilters) {
  const searchParams = new URLSearchParams();

  if (filters?.role) searchParams.append("role", filters.role);
  if (filters?.availableNow) searchParams.append("available_now", "true");
  if (filters?.interestIds) {
    filters.interestIds.forEach((id) =>
      searchParams.append("interests", String(id)),
    );
  }

  const qs = searchParams.toString();
  return await api.auth<MatchingUser[]>({
    url: `/matching${qs ? `?${qs}` : ""}`,
    method: "GET",
  });
}
