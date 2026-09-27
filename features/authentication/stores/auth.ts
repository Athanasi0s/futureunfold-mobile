import { MeOut } from "@/api/schemas";
import { create } from "zustand";

type AuthState = {
  user: MeOut | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuthenticated: (value: boolean) => void;
  setUser: (user: MeOut) => void;
  clearUser: () => void;
  setInitialized: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  setInitialized: () => set({ isInitializing: false }),
}));
