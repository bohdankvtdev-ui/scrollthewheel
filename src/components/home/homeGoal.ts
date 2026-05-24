import { formatMoney } from "../../utils/formatMoney";

export type HomeGoal = {
  headline: string;
  detail: string;
  accent: "yellow" | "cyan" | "magenta";
};

export function getHomeGoal(input: {
  bestFloor: number;
  bestPeakMoney: number;
  totalRuns: number;
  hasResume: boolean;
  resumeCycle?: number;
}): HomeGoal {
  if (input.totalRuns === 0) {
    return {
      headline: "First cycle",
      detail: "Clear all 9 wheels, hit the shop, survive the boss. Bank hits $0 and you're out.",
      accent: "cyan",
    };
  }
  if (input.bestFloor > 0) {
    const next = input.bestFloor + 1;
    return {
      headline: `Beat cycle ${next}`,
      detail:
        input.bestPeakMoney > 0
          ? `Your record is cycle ${input.bestFloor} at ${formatMoney(input.bestPeakMoney)}. Go deeper.`
          : `Your best clear is cycle ${input.bestFloor}. Push one more.`,
      accent: "magenta",
    };
  }
  if (input.bestPeakMoney > 0) {
    const target = Math.max(input.bestPeakMoney + 250, Math.floor(input.bestPeakMoney * 1.15));
    return {
      headline: "Break the bank record",
      detail: `Top bank: ${formatMoney(input.bestPeakMoney)}. Aim for ${formatMoney(target)}.`,
      accent: "yellow",
    };
  }
  return {
    headline: "Back on the strip",
    detail: "Nine wheels, chip shop, one life. Don't hit zero.",
    accent: "cyan",
  };
}
