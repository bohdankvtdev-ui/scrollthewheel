import { DEBUFF_CATALOG } from "../../data/debuffs";
import { PERK_CATALOG } from "../../data/perks";
import { RELIC_CATALOG } from "../../data/relics";
import { EffectIcon } from "./EffectIcon";

type UpgradeChipProps = {
  kind: "perk" | "debuff" | "relic";
  id: string;
  stack?: number;
};

const KIND_STYLE = {
  perk: { bg: "#FEF9C3" },
  debuff: { bg: "#FEE2E2" },
  relic: { bg: "#EDE9FE" },
} as const;

export function UpgradeChip({ kind, id, stack = 1 }: UpgradeChipProps) {
  const catalog =
    kind === "perk" ? PERK_CATALOG[id] : kind === "debuff" ? DEBUFF_CATALOG[id] : RELIC_CATALOG[id];
  if (catalog == null) return null;

  const effectHint =
    stack > 1 ? `×${stack} · ${catalog.description}` : catalog.description;

  return (
    <EffectIcon
      icon={catalog.icon}
      iconFamily={catalog.iconFamily}
      effectHint={effectHint}
      size="sm"
      accentBg={KIND_STYLE[kind].bg}
    />
  );
}
