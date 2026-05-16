import { create } from "zustand";

export type RunToastType = "success" | "error" | "info";

export type RunToast = {
  id: string;
  type: RunToastType;
  title: string;
  icon?: string;
};

type RunToastStore = {
  toast: RunToast | null;
  show: (t: Omit<RunToast, "id">) => void;
  dismiss: () => void;
};

export const useRunToastStore = create<RunToastStore>((set) => ({
  toast: null,
  show: (t) => set({ toast: { ...t, id: `t_${Date.now()}` } }),
  dismiss: () => set({ toast: null }),
}));
