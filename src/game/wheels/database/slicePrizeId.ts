/** Slice ids are `{wheelInstanceId}_{catalogPrizeId}_{index}` (e.g. `wheel_1_money_50_0`). */
const SLICE_ID_RE = /^(wheel_\d+(?:_f\d+)?)_(.+)_\d+$/;

export function catalogPrizeIdFromSliceId(sliceId: string): string | null {
  const m = sliceId.match(SLICE_ID_RE);
  return m?.[2] ?? null;
}
