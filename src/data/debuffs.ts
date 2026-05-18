import type { IconFamily } from "../schemas";
import { withRegistryIcons } from "../game/content/withRegistryIcons";

export type DebuffDefinition = {
  id: string;
  name: string;
  icon: string;
  iconFamily: IconFamily;
  description: string;
  moneyTax?: number;
  negativeWeightBonus?: number;
};

const DEBUFF_CATALOG_RAW: Record<string, DebuffDefinition> = {
  debt_mark: {
    id: "debt_mark",
    name: "Debt Mark",
    icon: "skull-crossbones",
    iconFamily: "MaterialCommunityIcons",
    description: "-10% money on wins",
    moneyTax: 0.1,
  },
  rusted_gear: {
    id: "rusted_gear",
    name: "Rusted Gear",
    icon: "cog-off",
    iconFamily: "MaterialCommunityIcons",
    description: "+20% negative slice weight",
    negativeWeightBonus: 0.2,
  },
  curse_of_greed: {
    id: "curse_of_greed",
    name: "Curse of Greed",
    icon: "fire-alert",
    iconFamily: "MaterialCommunityIcons",
    description: "Taxes 15% of money gains",
    moneyTax: 0.15,
  },
};

export const DEBUFF_CATALOG = withRegistryIcons(DEBUFF_CATALOG_RAW, "debuff");
