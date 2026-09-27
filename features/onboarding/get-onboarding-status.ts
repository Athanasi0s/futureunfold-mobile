import { api } from "../../api/client";

export type OnboardingStatus = {
  status: "pending" | "completed" | "skipped";
  interest_ids: number[];
  goal_ids: number[];
  experience_level: string | null;
  discussion_topics: string[];
  completed_at: string | null;
};

export async function getOnboardingStatus() {
  return await api.auth<OnboardingStatus>({
    url: "/onboarding",
    method: "GET",
  });
}
