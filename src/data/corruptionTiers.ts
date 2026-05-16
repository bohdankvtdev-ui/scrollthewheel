export type CorruptionTier = {
  level: number;
  label: string;
  baseline: number;
  negativeWeightMult: number;
  moneyTaxRate?: number;
  visualIntensity: number;
};

export const CORRUPTION_TIERS: CorruptionTier[] = [
  { level: 0, label: "Clean", baseline: 0, negativeWeightMult: 1, visualIntensity: 0 },
  { level: 1, label: "Tainted", baseline: 2, negativeWeightMult: 1.1, moneyTaxRate: 0.02, visualIntensity: 0.25 },
  { level: 2, label: "Corrupt", baseline: 5, negativeWeightMult: 1.25, moneyTaxRate: 0.04, visualIntensity: 0.5 },
  { level: 3, label: "Ruined", baseline: 8, negativeWeightMult: 1.45, moneyTaxRate: 0.07, visualIntensity: 0.75 },
  { level: 4, label: "Doomed", baseline: 12, negativeWeightMult: 1.7, moneyTaxRate: 0.1, visualIntensity: 1 },
];

export function getCorruptionTier(corruption: number): CorruptionTier {
  let tier = CORRUPTION_TIERS[0]!;
  for (const t of CORRUPTION_TIERS) {
    if (corruption >= t.baseline) tier = t;
  }
  return tier;
}
