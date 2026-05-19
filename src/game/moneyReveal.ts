import { RUN_DEFAULTS } from "./loop";

export type MoneyReveal = { before: number; delta: number };

export function projectedBank(reveal: MoneyReveal): number {
  return Math.max(0, reveal.before + reveal.delta);
}

export function isBankruptMoneyReveal(reveal: MoneyReveal | null | undefined): boolean {
  if (reveal == null) return false;
  return reveal.before + reveal.delta <= RUN_DEFAULTS.bankruptcyThreshold;
}

/** Bank count-up / count-down duration (ms) — bankruptcy is shortest for snappy game-over. */
export function moneyRevealDurationMs(reveal: MoneyReveal | null | undefined): number {
  if (reveal == null) return 2200;
  const end = projectedBank(reveal);
  if (reveal.delta < 0 && end <= RUN_DEFAULTS.bankruptcyThreshold) return 880;
  if (reveal.delta < 0) return 1200;
  return 2200;
}
