import { create } from "zustand";

type PendingNavigationStore = {
  pendingPath: string | null;
  setPendingPath: (path: string | null) => void;
};

export const usePendingNavigationStore = create<PendingNavigationStore>(
  (set) => ({
    pendingPath: null,
    setPendingPath: (path) => set({ pendingPath: path }),
  }),
);
