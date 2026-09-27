import { api } from "../../api/client";
import type { OnboardingStatus } from "./get-onboarding-status";

export type SubmitOnboardingData = {
  interest_ids: number[];
  goal_ids: number[];
  experience_level: string | null;
  discussion_topics: string[];
  skip: boolean;
};

export async function submitOnboarding(data: SubmitOnboardingData) {
  return await api.auth<OnboardingStatus>({
    url: "/onboarding",
    method: "PUT",
    data,
  });
}
