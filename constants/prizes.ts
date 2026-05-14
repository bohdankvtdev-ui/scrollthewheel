export const PRIZE_SLICES = [
  { id: "1", label: "$50" },
  { id: "2", label: "$100" },
  { id: "3", label: "$250" },
  { id: "4", label: "$500" },
  { id: "5", label: "$1K" },
  { id: "6", label: "$5K" },
] as const;

export const SLICE_COUNT = PRIZE_SLICES.length;
export const SLICE_DEG = 360 / SLICE_COUNT;
