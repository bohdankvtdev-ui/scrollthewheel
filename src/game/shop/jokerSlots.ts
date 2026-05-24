import type { RunState } from "../../schemas";
import { countUniqueJokerSlots, isJokerSlotFull as isSlotFull } from "../perks/perkStacks";

export { countUniqueJokerSlots as countJokers };

export function isJokerSlotFull(run: RunState): boolean {
  return isSlotFull(run);
}
