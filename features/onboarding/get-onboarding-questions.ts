import { api } from "../../api/client";

export type Interest = {
  id: number;
  name: string;
};

export type Goal = {
  id: number;
  name: string;
  description: string;
};

export type ExperienceLevel = {
  value: string;
  label: string;
  years: string;
};

export type DiscussionTopic = {
  value: string;
  label: string;
};

export type OnboardingQuestions = {
  interests: Interest[];
  goals: Goal[];
  experience_levels: ExperienceLevel[];
  discussion_topics: DiscussionTopic[];
};

export async function getOnboardingQuestions() {
  return await api.basic<OnboardingQuestions>({
    url: "/onboarding/questions",
    method: "GET",
  });
}
