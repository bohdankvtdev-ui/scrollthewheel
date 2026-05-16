export type ResolveContext = {
  negativeWeightMult: number;
  positiveWeightMult: number;
  rareWeightMult: number;
  bossWeightMult: number;
  wheelNegativeBias: number;
  tagMults: Record<string, number>;
  /** When true, land % = slice baseWeight only (wheelDatabase `chance` values). */
  exactLandWeights?: boolean;
};

export const DEFAULT_RESOLVE_CONTEXT: ResolveContext = {
  negativeWeightMult: 1,
  positiveWeightMult: 1,
  rareWeightMult: 1,
  bossWeightMult: 1,
  wheelNegativeBias: 0,
  tagMults: {},
};
