/** Prize pools — keyed by `slicePoolId` on each wheel in `loop.ts` WHEEL_ROTATION. */

import type { SliceDefinition } from "../schemas";



export const SLICE_POOL_IDS = [

  "base",

  "yield",

  "deck",

  "risk",

  "stabilizer",

  "mini_boss",

  "jackpot",

  "power",

  "preparation",

  "boss",

  "expansion",

  "curse",

] as const;



export type SlicePoolId = (typeof SLICE_POOL_IDS)[number];



export const SLICE_POOLS: Record<SlicePoolId, SliceDefinition[]> = {

  base: [

    { id: "b_money_sm", kind: "money", label: "+$50", icon: "add-circle", iconFamily: "MaterialIcons", baseWeight: 3, weightTags: ["positive"], payload: { moneyDelta: 50 }, presentation: { colorIndex: 0 } },

    { id: "b_money_md", kind: "money", label: "+$100", icon: "attach-money", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive"], payload: { moneyDelta: 100 }, presentation: { colorIndex: 1 } },

    { id: "b_loss_sm", kind: "money_loss", label: "-$40", icon: "remove-circle", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["negative"], payload: { moneyDelta: -40 }, presentation: { colorIndex: 2 } },

    { id: "b_neutral", kind: "neutral", label: "Pass", icon: "remove", iconFamily: "MaterialIcons", baseWeight: 1, payload: {}, presentation: { colorIndex: 3 } },

    { id: "b_perk_tease", kind: "perk", label: "Lucky", icon: "stars", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "lucky_streak" }, presentation: { rarity: "rare", colorIndex: 4 } },

    { id: "b_booster", kind: "booster", label: "+$30", icon: "trending-up", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive"], payload: { moneyDelta: 30 }, presentation: { colorIndex: 5 } },

    { id: "b_perk_high", kind: "perk", label: "High Roller", icon: "casino", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { perkId: "high_roller" }, presentation: { rarity: "rare" } },

    { id: "b_ante", kind: "perk", label: "Quota Shield", icon: "policy", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { perkId: "ante_insurance" } },

  ],

  yield: [

    { id: "y_money_lg", kind: "money", label: "+$200", icon: "attach-money", iconFamily: "MaterialIcons", baseWeight: 3, weightTags: ["positive"], payload: { moneyDelta: 200 } },

    { id: "y_money_md", kind: "money", label: "+$120", icon: "add-circle", iconFamily: "MaterialIcons", baseWeight: 3, weightTags: ["positive"], payload: { moneyDelta: 120 } },

    { id: "y_perk", kind: "perk", label: "Gold+", icon: "trending-up", iconFamily: "MaterialIcons", baseWeight: 3, weightTags: ["positive", "rare"], payload: { perkId: "gold_rush" } },

    { id: "y_card", kind: "deck_add", label: "+Card", icon: "style", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive"], payload: { cardId: "copper_chip" } },

    { id: "y_loss", kind: "money_loss", label: "-$60", icon: "remove-circle", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["negative"], payload: { moneyDelta: -60 } },

    { id: "y_perk_lucky", kind: "perk", label: "Lucky", icon: "stars", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "lucky_streak" } },

    { id: "y_perk_safe", kind: "perk", label: "Safe Harbor", icon: "security", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { perkId: "safe_harbor" } },

  ],

  deck: [

    { id: "d_add_copper", kind: "deck_add", label: "Copper Chip", icon: "paid", iconFamily: "MaterialIcons", baseWeight: 3, weightTags: ["positive"], payload: { cardId: "copper_chip" } },

    { id: "d_add_die", kind: "deck_add", label: "Loaded Die", icon: "casino", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { cardId: "weighted_die" } },

    { id: "d_add_vault", kind: "deck_add", label: "Vault Token", icon: "security", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { cardId: "purity_charm" } },

    { id: "d_upgrade", kind: "deck_upgrade", label: "Upgrade Chip", icon: "upgrade", iconFamily: "MaterialCommunityIcons", baseWeight: 2, payload: {} },

    { id: "d_remove", kind: "deck_remove", label: "Burn Chip", icon: "delete", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["negative"], payload: {} },

    { id: "d_money", kind: "money", label: "+$80", icon: "add-circle", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive"], payload: { moneyDelta: 80 } },

    { id: "d_neutral", kind: "neutral", label: "—", icon: "skip-next", iconFamily: "MaterialIcons", baseWeight: 1, payload: {} },

  ],

  risk: [

    { id: "r_jackpot", kind: "money", label: "+$500", icon: "emoji-events", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { moneyDelta: 500 } },

    { id: "r_win", kind: "money", label: "+$150", icon: "add-circle", iconFamily: "MaterialIcons", baseWeight: 3, weightTags: ["positive"], payload: { moneyDelta: 150 } },

    { id: "r_loss_lg", kind: "money_loss", label: "-$200", icon: "remove-circle", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["negative"], payload: { moneyDelta: -200 } },

    { id: "r_perk", kind: "perk", label: "Gold Rush", icon: "trending-up", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "gold_rush" } },

    { id: "r_debuff", kind: "debuff", label: "Debt Mark", icon: "skull", iconFamily: "MaterialCommunityIcons", baseWeight: 2, weightTags: ["negative"], payload: { debuffId: "debt_mark" } },

    { id: "r_neutral", kind: "neutral", label: "Gamble", icon: "casino", iconFamily: "MaterialIcons", baseWeight: 1, payload: {} },

    { id: "r_perk_hot", kind: "perk", label: "Hot Table", icon: "whatshot", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { perkId: "hot_table" } },

    { id: "r_perk_double", kind: "perk", label: "Double Down", icon: "exposure-plus-1", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { perkId: "double_down" } },

  ],

  stabilizer: [

    { id: "s_expand", kind: "perk", label: "+1 Slice", icon: "unfold-more", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "extra_slice" } },

    { id: "s_money", kind: "money", label: "+$100", icon: "add-circle", iconFamily: "MaterialIcons", baseWeight: 3, weightTags: ["positive"], payload: { moneyDelta: 100 } },

    { id: "s_shield", kind: "perk", label: "Iron Reserve", icon: "shield", iconFamily: "MaterialCommunityIcons", baseWeight: 3, weightTags: ["positive", "rare"], payload: { perkId: "iron_reserve" } },

    { id: "s_perk_lucky", kind: "perk", label: "Lucky", icon: "stars", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "lucky_streak" } },

    { id: "s_loss", kind: "money_loss", label: "-$50", icon: "remove-circle", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["negative"], payload: { moneyDelta: -50 } },

    { id: "s_neutral", kind: "neutral", label: "Calm", icon: "spa", iconFamily: "MaterialIcons", baseWeight: 1, payload: {} },

  ],

  mini_boss: [
    { id: "mb_half", kind: "bank_cut", label: "LOSE 50%", icon: "remove-circle", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["negative", "stakes"], payload: { bankPercent: -0.5 } },
    { id: "mb_big_loss", kind: "money_loss", label: "-$150", icon: "remove-circle", iconFamily: "MaterialIcons", baseWeight: 3, weightTags: ["negative", "stakes"], payload: { moneyDelta: -150 } },
    { id: "mb_win", kind: "money", label: "+$200", icon: "attach-money", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive"], payload: { moneyDelta: 200 } },
    { id: "mb_perk", kind: "perk", label: "Gold Rush", icon: "trending-up", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "gold_rush" } },
    { id: "mb_lucky", kind: "perk", label: "Lucky", icon: "stars", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "lucky_streak" } },
    { id: "mb_neutral", kind: "neutral", label: "Hold", icon: "pan-tool", iconFamily: "MaterialIcons", baseWeight: 1, payload: {} },

    { id: "mb_vip", kind: "perk", label: "VIP Roller", icon: "workspace-premium", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { perkId: "vip_roller" } },
  ],

  jackpot: [

    { id: "j_mega", kind: "money", label: "JACKPOT +$1000", icon: "emoji-events", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { moneyDelta: 1000 } },

    { id: "j_big", kind: "money", label: "+$300", icon: "attach-money", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive"], payload: { moneyDelta: 300 } },

    { id: "j_med", kind: "money", label: "+$150", icon: "add-circle", iconFamily: "MaterialIcons", baseWeight: 3, weightTags: ["positive"], payload: { moneyDelta: 150 } },

    { id: "j_relic", kind: "relic_offer", label: "Lucky Coin", icon: "diamond", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["rare"], payload: { relicId: "lucky_coin" } },

    { id: "j_perk", kind: "perk", label: "Lucky Streak", icon: "stars", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "lucky_streak" } },

    { id: "j_loss", kind: "money_loss", label: "-$100", icon: "remove-circle", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["negative"], payload: { moneyDelta: -100 } },

    { id: "j_vip", kind: "perk", label: "VIP Roller", icon: "workspace-premium", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { perkId: "vip_roller" } },

    { id: "j_high", kind: "perk", label: "High Roller", icon: "casino", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { perkId: "high_roller" } },

  ],

  power: [

    { id: "pw_perk_lucky", kind: "perk", label: "Lucky Streak", icon: "stars", iconFamily: "MaterialIcons", baseWeight: 4, weightTags: ["positive", "rare"], payload: { perkId: "lucky_streak" }, presentation: { rarity: "rare" } },

    { id: "pw_perk_gold", kind: "perk", label: "Gold Rush", icon: "trending-up", iconFamily: "MaterialIcons", baseWeight: 3, weightTags: ["positive", "rare"], payload: { perkId: "gold_rush" }, presentation: { rarity: "rare" } },

    { id: "pw_perk_iron", kind: "perk", label: "Iron Reserve", icon: "shield", iconFamily: "MaterialCommunityIcons", baseWeight: 3, weightTags: ["positive", "rare"], payload: { perkId: "iron_reserve" } },

    { id: "pw_perk_wide", kind: "perk", label: "+1 Slice", icon: "unfold-more", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "extra_slice" } },
    { id: "pw_hot", kind: "perk", label: "Hot Table", icon: "whatshot", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "hot_table" } },

    { id: "pw_money", kind: "money", label: "+$180", icon: "attach-money", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive"], payload: { moneyDelta: 180 } },

    { id: "pw_relic", kind: "relic_offer", label: "Void Lens", icon: "diamond", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["rare"], payload: { relicId: "void_lens" } },

    { id: "pw_safe", kind: "perk", label: "Safe Harbor", icon: "security", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "safe_harbor" } },

    { id: "pw_high", kind: "perk", label: "High Roller", icon: "casino", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "high_roller" } },

  ],

  preparation: [

    { id: "p_perk", kind: "perk", label: "Lucky Streak", icon: "stars", iconFamily: "MaterialIcons", baseWeight: 3, weightTags: ["positive", "rare"], payload: { perkId: "lucky_streak" } },

    { id: "p_relic", kind: "relic_offer", label: "Void Lens", icon: "diamond", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["rare"], payload: { relicId: "void_lens" } },

    { id: "p_perk_iron", kind: "perk", label: "Iron Reserve", icon: "shield", iconFamily: "MaterialCommunityIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "iron_reserve" } },

    { id: "p_money", kind: "money", label: "+$120", icon: "add-circle", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive"], payload: { moneyDelta: 120 } },

    { id: "p_card", kind: "deck_add", label: "Purity Charm", icon: "favorite", iconFamily: "MaterialIcons", baseWeight: 1, payload: { cardId: "purity_charm" } },

    { id: "p_neutral", kind: "neutral", label: "Focus", icon: "center-focus-strong", iconFamily: "MaterialIcons", baseWeight: 1, payload: {} },

    { id: "p_gold", kind: "perk", label: "Gold Rush", icon: "trending-up", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "gold_rush" } },

    { id: "p_coupon", kind: "perk", label: "Coupon King", icon: "sell", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { perkId: "coupon_king" } },

  ],

  boss: [
    { id: "boss_wipe", kind: "bank_wipe", label: "LOSE ALL", icon: "dangerous", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["negative", "stakes", "rare"], payload: { wipeBank: true }, presentation: { rarity: "curse" } },
    { id: "boss_75", kind: "bank_cut", label: "LOSE 75%", icon: "remove-circle", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["negative", "stakes"], payload: { bankPercent: -0.75 } },
    { id: "boss_jackpot", kind: "money", label: "JACKPOT +$800", icon: "emoji-events", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { moneyDelta: 800 } },
    { id: "boss_vip", kind: "perk", label: "VIP Roller", icon: "workspace-premium", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "vip_roller" } },
    { id: "boss_wide", kind: "perk", label: "+1 Slice", icon: "unfold-more", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "extra_slice" } },
    { id: "boss_double", kind: "money", label: "DOUBLE $", icon: "attach-money", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { bankPercent: 1 } },
    { id: "boss_comp", kind: "perk", label: "Compounder", icon: "savings", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { perkId: "compounder" }, presentation: { rarity: "rare" } },
  ],

  curse: [
    { id: "c_loss_md", kind: "money_loss", label: "-$80", icon: "remove-circle", iconFamily: "MaterialIcons", baseWeight: 3, weightTags: ["negative"], payload: { moneyDelta: -80 } },
    { id: "c_debuff", kind: "debuff", label: "Debt Mark", icon: "skull", iconFamily: "MaterialCommunityIcons", baseWeight: 3, weightTags: ["negative"], payload: { debuffId: "debt_mark" } },
    { id: "c_rust", kind: "debuff", label: "Rusted", icon: "alert-octagon", iconFamily: "MaterialCommunityIcons", baseWeight: 2, weightTags: ["negative"], payload: { debuffId: "rusted_gear" } },
    { id: "c_cut", kind: "bank_cut", label: "LOSE 25%", icon: "percent", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["negative", "stakes"], payload: { bankPercent: -0.25 } },
    { id: "c_money", kind: "money", label: "+$60", icon: "add-circle", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive"], payload: { moneyDelta: 60 } },
    { id: "c_perk", kind: "perk", label: "Iron Reserve", icon: "shield", iconFamily: "MaterialCommunityIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { perkId: "iron_reserve" } },
    { id: "c_neutral", kind: "neutral", label: "—", icon: "remove", iconFamily: "MaterialIcons", baseWeight: 1, payload: {} },
  ],

  expansion: [

    { id: "x_money", kind: "money", label: "+$40", icon: "add-circle", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive"], payload: { moneyDelta: 40 } },

    { id: "x_loss", kind: "money_loss", label: "-$30", icon: "remove-circle", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["negative"], payload: { moneyDelta: -30 } },

    { id: "x_perk", kind: "perk", label: "Gold Rush", icon: "trending-up", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "gold_rush" } },

    { id: "x_debuff", kind: "debuff", label: "Debt Mark", icon: "skull", iconFamily: "MaterialCommunityIcons", baseWeight: 1, weightTags: ["negative"], payload: { debuffId: "debt_mark" } },

    { id: "x_perk_lucky", kind: "perk", label: "Lucky", icon: "stars", iconFamily: "MaterialIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "lucky_streak" } },

    { id: "x_neutral", kind: "neutral", label: "Extra", icon: "more-horiz", iconFamily: "MaterialIcons", baseWeight: 1, payload: {} },

    { id: "x_iron", kind: "perk", label: "Iron Reserve", icon: "shield", iconFamily: "MaterialCommunityIcons", baseWeight: 2, weightTags: ["positive", "rare"], payload: { perkId: "iron_reserve" } },

    { id: "x_wide", kind: "perk", label: "+1 Slice", icon: "unfold-more", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { perkId: "extra_slice" } },

    { id: "x_hot", kind: "perk", label: "Hot Table", icon: "whatshot", iconFamily: "MaterialIcons", baseWeight: 1, weightTags: ["positive", "rare"], payload: { perkId: "hot_table" } },

  ],

};

