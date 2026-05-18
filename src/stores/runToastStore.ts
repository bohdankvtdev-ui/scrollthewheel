import { create } from "zustand";

export type RunToastType = "success" | "error" | "info";

export type RunToast = {
  id: string;
  type: RunToastType;
  /** Short heading (tactic name, shop action, …). */
  title: string;
  /** Extra detail — wraps to new lines; never ellipsized. */
  body?: string;
  icon?: string;
  durationMs: number;
  createdAt: number;
};

type RunToastInput = {
  type: RunToastType;
  title: string;
  body?: string;
  icon?: string;
  durationMs?: number;
};

type RunToastStore = {
  toast: RunToast | null;
  show: (t: RunToastInput) => void;
  dismiss: () => void;
};

export const useRunToastStore = create<RunToastStore>((set) => ({
  toast: null,
  show: (t) => {
    const now = Date.now();
    set({
      toast: {
        ...t,
        id: `t_${now}`,
        durationMs: t.durationMs ?? 3000,
        createdAt: now,
      },
    });
  },
  dismiss: () => set({ toast: null }),
}));
