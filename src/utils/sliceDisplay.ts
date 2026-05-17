import type { SliceDefinition, SliceKind } from "../schemas";

import { DEBUFF_CATALOG } from "../data/debuffs";

import { PERK_CATALOG } from "../data/perks";

import { RELIC_CATALOG } from "../data/relics";

import { CARD_CATALOG } from "../data/cards";

import { RUN_EFFECT_LABELS, type RunEffectId } from "../game/gdd";

import { getPerkDisplay } from "../game/perks/perkDisplay";

import { resolveSliceIcon } from "../game/content/resolveIcon";

import { sliceWheelCaption } from "./sliceWheelCaption";



export type SliceDisplay = {

  icon: string;

  iconFamily: SliceDefinition["iconFamily"];

  shortLabel: string;

  effectHint: string;

};



export type SliceTapDetail = {

  category: string;

  effectLine: string;

  bullets: string[];

};



const KIND_CATEGORY: Partial<Record<SliceKind, string>> = {

  money: "Cash wedge",

  money_loss: "Cash loss",

  perk: "Joker perk",

  debuff: "Curse",

  deck_add: "Loadout modifier",

  deck_remove: "Remove modifier",

  deck_upgrade: "Promote modifier",

  relic_offer: "Relic",

  booster: "Bonus",

  neutral: "Neutral",

  bank_wipe: "Bank wipe",

  bank_cut: "Bank percent",

  run_effect: "Run effect",

};



function bankPercentLines(slice: SliceDefinition): SliceTapDetail | null {

  const pct = slice.payload.bankPercent;

  if (pct == null) return null;

  const n = Math.round(Math.abs(pct) * 100);

  if (pct < 0) {

    return {

      category: "Bank percent",

      effectLine: `Lose ${n}% of your current bank`,

      bullets: [

        "Uses whatever cash is in your bank when this wedge lands",

        "A shield blocks one bank hit (flat $, %, or wipe)",

        "Perk multipliers do not reduce % losses",

      ],

    };

  }

  if (pct >= 1) {

    return {

      category: "Bank percent",

      effectLine: "Double your bank (+100%)",

      bullets: [

        "Adds cash equal to your full bank balance",

        "Cash perks (Gold Rush, VIP Roller, etc.) apply to the payout",

      ],

    };

  }

  return {

    category: "Bank percent",

    effectLine: `Gain ${n}% of your current bank`,

    bullets: [

      "Adds cash based on bank size — stronger when you are ahead",

      "Cash perks can boost the amount you receive",

    ],

  };

}



export function getSliceTapDetail(slice: SliceDefinition): SliceTapDetail {

  const { payload, kind } = slice;

  const category = KIND_CATEGORY[kind] ?? slice.kind;



  const bank = bankPercentLines(slice);

  if (bank != null) return bank;



  if (payload.wipeBank || kind === "bank_wipe") {

    return {

      category: "Bank wipe",

      effectLine: "Lose all money in your bank",

      bullets: [

        "Sets bank to $0 unless a shield blocks the hit",

        "Does not affect shop chips in the top bar",

      ],

    };

  }



  if (payload.moneyDelta != null && payload.moneyDelta > 0) {

    return {

      category: "Cash wedge",

      effectLine: `Gain $${payload.moneyDelta}`,

      bullets: [

        "Added to your bank immediately",

        "Gold Rush, High Roller, VIP Roller, and Compounder can increase the payout",

      ],

    };

  }



  if (payload.moneyDelta != null && payload.moneyDelta < 0) {

    return {

      category: "Cash loss",

      effectLine: `Lose $${Math.abs(payload.moneyDelta)}`,

      bullets: ["Flat cash loss — one shield blocks one hit"],

    };

  }



  if (payload.perkId != null) {

    const perk = PERK_CATALOG[payload.perkId];

    const display = getPerkDisplay(payload.perkId);

    return {

      category: "Joker perk",

      effectLine: perk != null ? `Win: ${perk.name}` : "New joker perk",

      bullets: display?.bullets.slice(0, 3) ?? [perk?.description ?? "Adds to your perk row for the rest of the run"],

    };

  }



  if (payload.cardId != null) {

    const card = CARD_CATALOG[payload.cardId];

    return {

      category: "Loadout modifier",

      effectLine: card != null ? `Add ${card.name}` : "Add passive modifier",

      bullets: [

        "Goes in the modifier row (not shop chips)",

        "Passive effects apply for the rest of the run",

      ],

    };

  }



  if (kind === "deck_upgrade") {

    return {

      category: "Loadout modifier",

      effectLine: "Promote your modifier row",

      bullets: [

        "Copper → Loaded Die → Wide Table progression",

        "If you lack Copper, grants Loaded Die instead",

      ],

    };

  }



  if (kind === "deck_remove") {

    return {

      category: "Loadout modifier",

      effectLine: "Remove your last modifier",

      bullets: ["Drops the most recently added modifier from your row"],

    };

  }



  if (payload.debuffId != null) {

    const d = DEBUFF_CATALOG[payload.debuffId];

    return {

      category: "Curse",

      effectLine: d?.name ?? "Curse",

      bullets: [d?.description ?? "Hurts your run until cleared"],

    };

  }



  if (payload.relicId != null) {

    const r = RELIC_CATALOG[payload.relicId];

    return {

      category: "Relic",

      effectLine: r?.name ?? "Relic",

      bullets: [r?.description ?? "Passive rule change for this run"],

    };

  }



  if (payload.runEffectId != null) {

    const id = payload.runEffectId as RunEffectId;

    return {

      category: "Run effect",

      effectLine: RUN_EFFECT_LABELS[id] ?? payload.runEffectId,

      bullets: ["Special effect that can linger across upcoming wheels"],

    };

  }



  if (kind === "neutral") {

    return {

      category: "Neutral",

      effectLine: "No change",

      bullets: ["Breathing room — bank and loadout stay the same"],

    };

  }



  return {

    category,

    effectLine: slice.label,

    bullets: ["Applied when the wheel stops on this wedge"],

  };

}



export function describeSliceEffect(slice: SliceDefinition): string {

  return getSliceTapDetail(slice).effectLine;

}



export function toSliceDisplay(slice: SliceDefinition): SliceDisplay {

  const visual = resolveSliceIcon(slice);

  return {

    icon: visual.icon,

    iconFamily: visual.iconFamily,

    shortLabel: sliceWheelCaption(slice),

    effectHint: describeSliceEffect(slice),

  };

}


