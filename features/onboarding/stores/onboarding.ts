import { create } from "zustand";

type OnboardingState = {
  shouldOpenOnboarding: boolean;
  setShouldOpenOnboarding: (value: boolean) => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  shouldOpenOnboarding: false,
  setShouldOpenOnboarding: (value) => set({ shouldOpenOnboarding: value }),
}));
