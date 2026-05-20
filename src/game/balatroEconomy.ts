/** Run pacing — shop, interest, perk cap, bankruptcy. */
export const BALATRO_ECONOMY = {
  /** Max perks in loadout (non-shield). */
  maxJokerSlots: 5,
  maxAdvancements: 6,
  shopOfferCount: 5,
  advancementOfferCount: 2,
  shopRerollBaseCost: 5,
  /** +$1 per $5 held, capped (end-of-ante interest). */
  interestDivisor: 5,
  interestCap: 5,
  sellRefundRatio: 0.5,
} as const;
