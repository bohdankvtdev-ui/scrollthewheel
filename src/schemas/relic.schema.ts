import type { IconFamily } from "./slice.schema";
import type { RunState } from "./run.schema";
import type { WeightedSlice } from "./slice.schema";

export type WeightContext = {
  slices: WeightedSlice[];
  run: RunState;
  wheelIndex: number;
  negativeWeightMult: number;
};

export type RelicDefinition = {
  id: string;
  name: string;
  icon: string;
  iconFamily: IconFamily;
  stackable: boolean;
  description: string;
  weightTagMult?: Partial<Record<string, number>>;
  moneyMult?: number;
  corruptionReduce?: number;
};

export type RelicHookContext = {
  run: RunState;
  wheelIndex: number;
  sliceId?: string;
};
