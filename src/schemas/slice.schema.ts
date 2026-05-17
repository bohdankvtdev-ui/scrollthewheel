export type IconFamily = "MaterialIcons" | "MaterialCommunityIcons" | "Ionicons";

export type SliceKind =
  | "money"
  | "money_loss"
  | "perk"
  | "debuff"
  | "deck_add"
  | "deck_remove"
  | "deck_upgrade"
  | "relic_offer"
  | "booster"
  | "neutral"
  | "bank_wipe"
  | "bank_cut"
  | "run_effect";

export type SliceWeightTag = "negative" | "positive" | "rare" | "stakes";

export type SlicePayload = {
  moneyDelta?: number;
  perkId?: string;
  debuffId?: string;
  cardId?: string;
  relicId?: string;
  /** 0–1 fraction of current bank (negative = loss). */
  bankPercent?: number;
  wipeBank?: boolean;
  /** Add N slices on next wheel layout (gradual 6→7→8). */
  sliceDelta?: number;
  /** @deprecated use sliceDelta: 1 */
  expandSlicesTo?: 6 | 8 | 10 | 12;
  /** Meta slice — see `runEffects.ts` */
  runEffectId?: string;
};

export type SliceDefinition = {
  id: string;
  kind: SliceKind;
  label: string;
  icon: string;
  iconFamily: IconFamily;
  baseWeight: number;
  weightTags?: SliceWeightTag[];
  payload: SlicePayload;
  presentation?: {
    colorIndex?: number;
    rarity?: "common" | "rare" | "curse";
    /** Wedge fill — paired with iconColor for this slot index */
    segmentColor?: string;
    iconColor?: string;
    captionColor?: string;
    chipColor?: string;
  };
};

export type WeightedSlice = SliceDefinition & {
  effectiveWeight: number;
};
