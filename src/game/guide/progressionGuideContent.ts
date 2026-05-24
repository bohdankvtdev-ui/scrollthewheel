import { RUN_DEFAULTS } from "../config/run.defaults";
import { CYCLE_ECONOMY } from "../wheels/database/cycleEconomy";
import { GDD_PACING, PRIZE_TAXONOMY } from "../gdd";
import {
  buildProgressionTable,
  PROGRESSION_PREVIEW_CYCLES,
} from "../cycle/cycleProgression";
import type { ProgressionRow } from "../cycle/cycleProgression";

export type GuideSection = {
  id: string;
  heading: string;
  body: string;
  bullets?: string[];
};

export const PROGRESSION_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "loop",
    heading: "Run loop",
    body: `Each cycle is ${GDD_PACING.wheelsPerCycle} wheels. You spin once per wheel, claim the wedge, then swipe to the next. Clear the boss on wheel 9 to advance the cycle. The run ends when your bank hits $${RUN_DEFAULTS.bankruptcyThreshold} or below.`,
    bullets: [
      `Start bank: $${RUN_DEFAULTS.startingMoney}`,
      "Shop chips buy perks between wheels",
      "Tactic wheels offer reroll / insure / laser choices",
      "Boss wheel applies cycle rewards and pressure",
    ],
  },
  {
    id: "odds",
    heading: "Land % vs spin %",
    body: "Land % is printed on each wedge — those weights sum to 100% on a full wheel. Spin % is the true chance to win that wedge on one spin after perks and tags adjust weights (negative, positive, rare). Tap a wedge in-run for the effective %.",
  },
  {
    id: "economy",
    heading: "Cycle economy",
    body: "Flat cash prizes compound each cycle; losses scale faster so late cycles punish greed. Percent-of-bank wedges use a separate gain curve.",
    bullets: [
      `Money growth: +${Math.round(CYCLE_ECONOMY.moneyGrowthPerCycle * 100)}% per cycle on +$ wedges`,
      `Loss growth: +${Math.round(CYCLE_ECONOMY.lossGrowthPerCycle * 100)}% per cycle on −$ wedges`,
      `Cycle 1 money wheel uses catalog amounts (no duplicate +$120 cap)`,
      `Cycles 2–${CYCLE_ECONOMY.earlyCycleMoneyCapUntil}: early +$ capped at $${CYCLE_ECONOMY.earlyCycleMoneyCap} until scaling kicks in`,
    ],
  },
  {
    id: "prizes",
    heading: "Prize families",
    body: "Wheels are themed — money, percent, risk, perks, drain, lucky, builder, chaos, gamble, boss. Each family uses different prize kinds:",
    bullets: Object.values(PRIZE_TAXONOMY).slice(0, 6),
  },
];

export function getProgressionTableRows(perkCount = 0): ProgressionRow[] {
  return buildProgressionTable([...PROGRESSION_PREVIEW_CYCLES], perkCount);
}

export function formatProgressionRow(row: ProgressionRow): string {
  return [
    `+$${row.cycleClearMoney} bank · +${row.cycleClearChips} chips on clear`,
    `Money ×${row.moneyMult} · Loss ×${row.lossMult}`,
    `+% gain ${(row.percentGain * 100).toFixed(1)}% · Neg weight ×${row.negativeWeightMult}`,
    row.lateCycleSpikes ? "Late spikes active" : "Standard pools",
  ].join("\n");
}
