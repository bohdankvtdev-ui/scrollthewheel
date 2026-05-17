import { getPerkEffect } from "../effects/perkEffects";

/** @deprecated Use `getPerkEffect(id)?.line` */
export function perkEffectDescription(perkId: string): string {
  return getPerkEffect(perkId)?.line ?? "";
}
