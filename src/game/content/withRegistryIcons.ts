import type { IconFamily } from "../../schemas";
import { ICON_REGISTRY } from "./iconRegistry";

type RegistryEntityType = "perk" | "card" | "debuff" | "relic";

/**
 * Merge icons from `iconRegistry.ts` into catalog records at module init.
 * Kept separate from `resolveIcon.ts` to avoid circular imports with `src/data/*`.
 */
export function withRegistryIcons<T extends { id: string; icon: string; iconFamily: IconFamily }>(
  catalog: Record<string, T>,
  type: RegistryEntityType
): Record<string, T> {
  const bucket = ICON_REGISTRY[type] as Record<string, { icon: string; iconFamily: IconFamily }>;
  const out: Record<string, T> = { ...catalog };
  for (const id of Object.keys(out)) {
    const reg = bucket[id];
    if (reg != null) {
      out[id] = { ...out[id]!, icon: reg.icon, iconFamily: reg.iconFamily };
    }
  }
  return out;
}
