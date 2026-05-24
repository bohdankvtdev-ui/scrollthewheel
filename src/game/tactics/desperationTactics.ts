import { shopChipCost, spendChips } from "../shop/chipEconomy";
import type { RunState } from "../../schemas";
import { RUN_DEFAULTS } from "../loop";
import { microChoiceChipCost } from "./microChoices";

export type DesperationId = "reroll" | "bailout";

export const DESPERATION_OFFER_CHANCE = 0.55;

export const DESPERATION_META: Record<
  DesperationId,
  {
    label: string;
    icon: string;
    pickerHint: string;
    chosen: string;
  }
> = {
  reroll: {
    label: "Retry",
    icon: "undo-variant",
    pickerHint: "Undo this spin — spin again",
    chosen: "Spin undone. Tap Spin to try again.",
  },
  bailout: {
    label: "Bailout",
    icon: "lifebuoy",
    pickerHint: "Pay chips — get emergency cash",
    chosen: "Bailout paid. You're still in the run.",
  },
};

const BAILOUT_BASE_COST = 14;

function hashSeed(run: RunState): number {
  const s = `${run.runId}:${run.floor}:${run.history.length}:desperation`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bailoutChipCost(run: RunState): number {
  return shopChipCost(run, BAILOUT_BASE_COST);
}

export function bailoutMoneyAmount(run: RunState): number {
  const peak = run.peakMoney ?? run.money;
  return Math.max(75, Math.floor(peak * 0.12));
}

export function listEligibleDesperation(
  run: RunState,
  opts: { hasPreSpinSnapshot: boolean }
): DesperationId[] {
  const chips = run.chipsEarnedThisRun ?? 0;
  const out: DesperationId[] = [];

  if (opts.hasPreSpinSnapshot) {
    const retryCost = microChoiceChipCost(run, "reroll");
    if (chips >= retryCost) out.push("reroll");
  }

  const bailCost = bailoutChipCost(run);
  if (chips >= bailCost) out.push("bailout");

  return out;
}

/** One last-chance offer before the run ends (chance-gated). */
export function rollDesperationOffers(
  run: RunState,
  opts: { hasPreSpinSnapshot: boolean }
): DesperationId[] {
  if (run.runEffects?.desperationOfferedThisRun === true) return [];

  const eligible = listEligibleDesperation(run, opts);
  if (eligible.length === 0) return [];

  const rng = mulberry32(hashSeed(run));
  if (rng() > DESPERATION_OFFER_CHANCE) return [];

  if (eligible.includes("reroll") && (eligible.length === 1 || rng() < 0.68)) {
    return ["reroll"];
  }

  const pool = eligible.filter((id) => id !== "reroll");
  if (pool.length === 0) return eligible.slice(0, 1);
  return [pool[Math.floor(rng() * pool.length)]!];
}

export function canUseDesperation(
  run: RunState,
  id: DesperationId,
  opts: {
    hasPreSpinSnapshot: boolean;
    offers: DesperationId[];
  }
): { ok: true } | { ok: false; reason: string } {
  if (!opts.offers.includes(id)) {
    return { ok: false, reason: "Not offered" };
  }
  const chips = run.chipsEarnedThisRun ?? 0;
  if (id === "reroll") {
    if (!opts.hasPreSpinSnapshot) return { ok: false, reason: "Retry unavailable" };
    const cost = microChoiceChipCost(run, "reroll");
    if (chips < cost) return { ok: false, reason: `Need ${cost} chips` };
    return { ok: true };
  }
  const cost = bailoutChipCost(run);
  if (chips < cost) return { ok: false, reason: `Need ${cost} chips` };
  return { ok: true };
}

export function payBailout(run: RunState): RunState | null {
  const paid = spendChips(run, bailoutChipCost(run));
  if (paid == null) return null;
  return applyBailoutRescue(paid);
}

/** Rewarded ad bailout — same cash rescue, no chip cost. */
export function applyBailoutRescue(run: RunState): RunState {
  const money = bailoutMoneyAmount(run);
  return {
    ...run,
    phase: "active",
    money,
    peakMoney: Math.max(run.peakMoney ?? 0, money),
    runEffects: {
      ...run.runEffects,
      desperationOfferedThisRun: true,
    },
  };
}

export function isRunBankrupt(run: RunState): boolean {
  return run.phase === "lost_money" || run.money <= RUN_DEFAULTS.bankruptcyThreshold;
}
