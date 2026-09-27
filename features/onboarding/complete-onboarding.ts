import { api } from "../../api/client";
import type { OnboardingStatus } from "./get-onboarding-status";

export async function completeOnboarding() {
  return await api.auth<OnboardingStatus>({
    url: "/onboarding",
    method: "PATCH",
    data: { status: "completed" },
  });
}
