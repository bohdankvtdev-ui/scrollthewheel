/**
 * Rotating neo-brutal page skins for Cash Spin — field color + header accent stripe + scrim tint.
 * Picked on each successful reel advance (swipe to next).
 */
export type CashSpinPageTheme = {
  pageBg: string;
  /** Thick bottom border on the header strip */
  headerStripe: string;
  /** Drag scrim tint (rgba) over the reel clip */
  scrimBase: string;
};

export const CASH_SPIN_PAGE_THEMES: CashSpinPageTheme[] = [
  { pageBg: "#4A2574", headerStripe: "#FACC15", scrimBase: "rgba(36, 18, 62, 0.5)" },
  { pageBg: "#134e4a", headerStripe: "#2dd4bf", scrimBase: "rgba(6, 42, 38, 0.52)" },
  { pageBg: "#4c0519", headerStripe: "#fb7185", scrimBase: "rgba(50, 8, 22, 0.52)" },
  { pageBg: "#1e1b4b", headerStripe: "#a78bfa", scrimBase: "rgba(22, 18, 58, 0.52)" },
  { pageBg: "#713f12", headerStripe: "#fde047", scrimBase: "rgba(55, 32, 6, 0.52)" },
  { pageBg: "#0f172a", headerStripe: "#38bdf8", scrimBase: "rgba(10, 18, 36, 0.55)" },
];

export function pickNextBackgroundIndex(prev: number, length: number): number {
  if (length <= 1) return 0;
  let next = prev;
  let guard = 0;
  while (next === prev && guard < 24) {
    next = Math.floor(Math.random() * length);
    guard += 1;
  }
  return next;
}
