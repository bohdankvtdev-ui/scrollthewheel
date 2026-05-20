export type ChipReveal = { before: number; delta: number };

export function projectedChips(reveal: ChipReveal): number {
  return Math.max(0, reveal.before + reveal.delta);
}

/** Chip count-up duration (ms) — snappy, distinct from bank reveal. */
export function chipRevealDurationMs(reveal: ChipReveal | null | undefined): number {
  if (reveal == null || reveal.delta <= 0) return 900;
  if (reveal.delta >= 10) return 1100;
  return 950;
}
