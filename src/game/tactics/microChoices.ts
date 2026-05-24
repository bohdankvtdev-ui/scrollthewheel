import { shopChipCost, spendChips } from "../shop/chipEconomy";
import type { RunState } from "../../schemas";
import { WHEEL_COUNT } from "../loop";
import { canInsureNextWheel } from "./applyInsureWheel";
import { isTacticWheelEligible } from "./tacticWheels";

export type MicroChoiceId = "reroll" | "insure" | "gamble";

export const MICRO_CHOICE_BASE_COST: Record<MicroChoiceId, number> = {
  reroll: 7,
  insure: 5,
  gamble: 6,
};

export const MICRO_CHOICE_META: Record<
  MicroChoiceId,
  {
    label: string;
    icon: string;
    hint: string;
    pickerHint: string;
    chosen: string;
  }
> = {
  reroll: {
    label: "Retry",
    icon: "undo-variant",
    hint: "Undo this spin",
    pickerHint: "Undo spin — try again here",
    chosen: "Spin undone. Tap Spin to retry.",
  },
  insure: {
    label: "Insure",
    icon: "shield-check",
    hint: "Safer next wheel",
    pickerHint: "Next wheel loses its worst − wedge",
    chosen: "Worst negative stripped. Swipe up.",
  },
  gamble: {
    label: "All In",
    icon: "arrow-up-down-bold",
    hint: "WIN ALL or LOSE ALL",
    pickerHint: "Green = double bank · Red = wipe bank",
    chosen: "Spin — green doubles bank, red wipes it.",
  },
};

const OFFER_POOL: MicroChoiceId[] = ["reroll", "insure", "gamble"];

/** Legacy saves may still list removed tactics. */
const REMOVED_TACTIC_IDS = new Set<string>(["peek"]);

function isActiveTacticId(id: string): id is MicroChoiceId {
  return !REMOVED_TACTIC_IDS.has(id) && id in MICRO_CHOICE_META;
}

function hashSeed(run: RunState, wheelIndex: number): number {
  const s = `${run.runId}:${run.floor}:${wheelIndex}:${run.history.length}`;
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

export function listEligibleMicroChoices(
  run: RunState,
  wheelIndex: number,
  opts: { hasPreSpinSnapshot: boolean }
): MicroChoiceId[] {
  if (!isTacticWheelEligible(run, wheelIndex)) return [];
  const isLast = wheelIndex >= WHEEL_COUNT - 1;
  return OFFER_POOL.filter((id) => {
    if (id === "insure" && isLast) return false;
    if (id === "insure" && !canInsureNextWheel(run, wheelIndex)) return false;
    if (id === "reroll" && !opts.hasPreSpinSnapshot) return false;
    return true;
  });
}

/** One offer per trick-or-treat prompt; gamble is always solo. */
export function rollMicroChoiceOffers(
  run: RunState,
  wheelIndex: number,
  opts: { hasPreSpinSnapshot: boolean }
): MicroChoiceId[] {
  const eligible = listEligibleMicroChoices(run, wheelIndex, opts);
  if (eligible.length === 0) return [];

  const rng = mulberry32(hashSeed(run, wheelIndex));

  if (eligible.includes("gamble") && rng() < 0.38) {
    return ["gamble"];
  }

  const pool = eligible.filter((id) => id !== "gamble");
  if (pool.length === 0) return [];
  const i = Math.floor(rng() * pool.length);
  return [pool[i]!];
}

export function getMicroChoiceOffers(
  run: RunState,
  wheelIndex: number,
  opts: { hasPreSpinSnapshot: boolean }
): MicroChoiceId[] {
  if (!isTacticWheelEligible(run, wheelIndex)) return [];
  const fx = run.runEffects;
  if (
    fx?.microChoiceOffersWheel === wheelIndex &&
    fx.microChoiceOffers != null &&
    fx.microChoiceOffers.length > 0
  ) {
    const eligible = new Set(listEligibleMicroChoices(run, wheelIndex, opts));
    const valid = fx.microChoiceOffers.filter(
      (id): id is MicroChoiceId => isActiveTacticId(id) && eligible.has(id as MicroChoiceId)
    );
    return valid.slice(0, 1);
  }
  return rollMicroChoiceOffers(run, wheelIndex, opts);
}

export function microChoiceChipCost(run: RunState, id: MicroChoiceId): number {
  return shopChipCost(run, MICRO_CHOICE_BASE_COST[id]);
}

export function canUseMicroChoice(
  run: RunState,
  id: MicroChoiceId,
  opts: {
    hasPreSpinSnapshot: boolean;
    alreadyUsedThisWheel: boolean;
    isLastWheel: boolean;
    offers: MicroChoiceId[];
    gambleFlipActive?: boolean;
  }
): { ok: true } | { ok: false; reason: string } {
  if (opts.gambleFlipActive) {
    return { ok: false, reason: "Spin the gamble wheel first" };
  }
  if (opts.alreadyUsedThisWheel) {
    return { ok: false, reason: "Already picked a tactic this wheel" };
  }
  if (!opts.offers.includes(id)) {
    return { ok: false, reason: "Not offered this spin" };
  }
  if (id === "insure" && !canInsureNextWheel(run, run.wheelIndex)) {
    return { ok: false, reason: "Next wheel has no removable negative wedge" };
  }
  if (id === "reroll" && !opts.hasPreSpinSnapshot) {
    return { ok: false, reason: "Retry unavailable" };
  }
  const cost = microChoiceChipCost(run, id);
  const chips = run.chipsEarnedThisRun ?? 0;
  if (cost > chips) {
    return { ok: false, reason: `Need ${cost} chips` };
  }
  return { ok: true };
}

export function payMicroChoice(run: RunState, id: MicroChoiceId): RunState | null {
  return spendChips(run, microChoiceChipCost(run, id));
}
