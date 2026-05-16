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
  { pageBg: "#6D28D9", headerStripe: "#FFEB3B", scrimBase: "rgba(55, 26, 120, 0.42)" },
  { pageBg: "#0D9488", headerStripe: "#99F6E4", scrimBase: "rgba(6, 70, 62, 0.4)" },
  { pageBg: "#BE123C", headerStripe: "#FECDD3", scrimBase: "rgba(90, 10, 32, 0.42)" },
  { pageBg: "#5B21B6", headerStripe: "#DDD6FE", scrimBase: "rgba(40, 18, 90, 0.42)" },
  { pageBg: "#CA8A04", headerStripe: "#FEF9C3", scrimBase: "rgba(70, 45, 6, 0.4)" },
  { pageBg: "#0369A1", headerStripe: "#BAE6FD", scrimBase: "rgba(6, 50, 85, 0.42)" },
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
