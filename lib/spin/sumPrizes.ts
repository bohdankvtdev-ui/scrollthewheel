import type { SpinWheelItem } from "../../types/spin";
import { formatWinnerLabel } from "./formatWinner";

export type PrizeRoundLike = {
  status: string;
  prize: SpinWheelItem | null;
};

/** Parse display labels like "$50", "$1K", "$5K" into USD dollars (best-effort). */
export function parsePrizeDollarsFromLabel(label: string): number {
  const t = label.trim().replace(/\$/g, "").replace(/,/g, "").toUpperCase();
  if (!t) return 0;
  if (t.endsWith("K")) {
    const n = parseFloat(t.slice(0, -1).trim());
    return Number.isFinite(n) ? n * 1000 : 0;
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

export function prizeItemToDollars(item: SpinWheelItem | null | undefined): number {
  if (item == null) return 0;
  return parsePrizeDollarsFromLabel(formatWinnerLabel(item));
}

/** Banked total: only rounds that have been claimed (updates after each forward swipe). */
export function sumClaimedPrizeDollars(rounds: PrizeRoundLike[]): number {
  let s = 0;
  for (const r of rounds) {
    if (r.prize == null) continue;
    if (r.status === "claimed") {
      s += prizeItemToDollars(r.prize);
    }
  }
  return s;
}

/** Sum prizes for rounds that are already won or banked (claimed). */
export function sumPrizeDollarsFromRounds(rounds: PrizeRoundLike[]): number {
  let s = 0;
  for (const r of rounds) {
    if (r.prize == null) continue;
    if (r.status === "won" || r.status === "claimed") {
      s += prizeItemToDollars(r.prize);
    }
  }
  return s;
}

export function formatUsdTotal(dollars: number): string {
  if (!Number.isFinite(dollars) || dollars <= 0) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: dollars >= 1000 && dollars % 1 === 0 ? 0 : 2,
    }).format(dollars);
  } catch {
    return `$${Math.round(dollars)}`;
  }
}
