import type { SliceDefinition } from "../../schemas";
import type { WheelConfigId } from "../wheels/database/types";
import { buildSliceFromPrizeSlot } from "../wheels/database/loader";
import { getAdvancementDef, hasAdvancement } from "./advancementCatalog";

const INJECT_LAND_PCT = 9;

function sumWeight(slices: SliceDefinition[]): number {
  return slices.reduce((s, row) => s + row.baseWeight, 0);
}

function makeRoomForInject(slices: SliceDefinition[], injectPct: number): SliceDefinition[] {
  const budget = 100 - injectPct;
  const total = sumWeight(slices);
  if (total <= 0) return slices;
  return slices.map((s) => ({
    ...s,
    baseWeight: Math.max(1, Math.round((s.baseWeight / total) * budget)),
  }));
}

function fixWeightSum(slices: SliceDefinition[], target = 100): SliceDefinition[] {
  const out = slices.map((s) => ({ ...s }));
  let sum = sumWeight(out);
  let i = 0;
  while (sum !== target && i < 300) {
    const idx = i % out.length;
    const row = out[idx]!;
    if (sum < target) {
      row.baseWeight += 1;
      sum += 1;
    } else if (sum > target && row.baseWeight > 1) {
      row.baseWeight -= 1;
      sum -= 1;
    }
    i += 1;
  }
  return out;
}

/** Append a new wedge — keeps all base slices, adds one more (6 → 7+). */
function appendInjectedSlice(
  slices: SliceDefinition[],
  injected: SliceDefinition
): SliceDefinition[] {
  const room = makeRoomForInject(slices, INJECT_LAND_PCT);
  return fixWeightSum([...room, { ...injected, baseWeight: INJECT_LAND_PCT }]);
}

function hasInjectedSlice(slices: SliceDefinition[], suffix: string): boolean {
  return slices.some((s) => s.id.includes(suffix));
}

export function applyAdvancementsToSlices(
  slices: SliceDefinition[],
  wheelConfigId: WheelConfigId,
  cycle: number,
  advancements: string[] = []
): SliceDefinition[] {
  if (advancements.length === 0) return slices;

  let out = [...slices];

  const money = getAdvancementDef("money_on_all");
  if (
    money?.injectPrize &&
    hasAdvancement({ advancements }, "money_on_all") &&
    wheelConfigId !== money.skipWheel &&
    !hasInjectedSlice(out, "_inj_money")
  ) {
    const inj = buildSliceFromPrizeSlot(
      { prize: money.injectPrize, chance: INJECT_LAND_PCT },
      `${wheelConfigId}_inj_money`,
      90,
      cycle
    );
    out = appendInjectedSlice(out, inj);
  }

  const perk = getAdvancementDef("perk_on_all");
  if (
    perk?.injectPrize &&
    hasAdvancement({ advancements }, "perk_on_all") &&
    wheelConfigId !== perk.skipWheel &&
    !hasInjectedSlice(out, "_inj_perk")
  ) {
    const inj = buildSliceFromPrizeSlot(
      { prize: perk.injectPrize, chance: INJECT_LAND_PCT },
      `${wheelConfigId}_inj_perk`,
      91,
      cycle
    );
    out = appendInjectedSlice(out, inj);
  }

  const pct = getAdvancementDef("percent_drip");
  if (
    pct?.injectPrize &&
    hasAdvancement({ advancements }, "percent_drip") &&
    wheelConfigId !== pct.skipWheel &&
    !hasInjectedSlice(out, "_inj_pct")
  ) {
    const inj = buildSliceFromPrizeSlot(
      { prize: pct.injectPrize, chance: INJECT_LAND_PCT },
      `${wheelConfigId}_inj_pct`,
      92,
      cycle
    );
    out = appendInjectedSlice(out, inj);
  }

  return out;
}

export function getAdvancementPositiveWeightMult(advancements: string[] = []): number {
  if (!hasAdvancement({ advancements }, "lucky_dip")) return 1;
  return getAdvancementDef("lucky_dip")?.value ?? 1.08;
}

export function getAdvancementPoolCycleBonus(advancements: string[] = []): number {
  if (!hasAdvancement({ advancements }, "pool_scout")) return 0;
  return getAdvancementDef("pool_scout")?.value ?? 1;
}

export function getAdvancementInterestMult(advancements: string[] = []): number {
  if (!hasAdvancement({ advancements }, "interest_boost")) return 1;
  return getAdvancementDef("interest_boost")?.value ?? 2;
}

export function getAdvancementCycleStipend(advancements: string[] = []): number {
  if (!hasAdvancement({ advancements }, "cycle_stipend")) return 0;
  return getAdvancementDef("cycle_stipend")?.value ?? 75;
}

export function getExtraShopOffers(advancements: string[] = []): number {
  if (!hasAdvancement({ advancements }, "shop_extra")) return 0;
  return getAdvancementDef("shop_extra")?.value ?? 1;
}
