import type { CardDefinition } from "../schemas";
import { withRegistryIcons } from "../game/content/withRegistryIcons";

/** Casino chips — passive run modifiers (not fantasy spell cards). */
const CARD_CATALOG_RAW: Record<string, CardDefinition> = {
  copper_chip: {
    id: "copper_chip",
    name: "Copper Chip",
    rarity: "common",
    icon: "paid",
    iconFamily: "MaterialIcons",
    effects: [{ type: "flat_money", amount: 25 }],
  },
  weighted_die: {
    id: "weighted_die",
    name: "Loaded Die",
    rarity: "uncommon",
    icon: "casino",
    iconFamily: "MaterialIcons",
    effects: [{ type: "slice_weight_mult", tag: "positive", mult: 1.12 }],
  },
  purity_charm: {
    id: "purity_charm",
    name: "Vault Token",
    rarity: "rare",
    icon: "security",
    iconFamily: "MaterialIcons",
    effects: [{ type: "money_shield", amount: 1 }],
  },
  wide_wheel_card: {
    id: "wide_wheel_card",
    name: "Wide Table",
    rarity: "rare",
    icon: "unfold-more",
    iconFamily: "MaterialIcons",
    effects: [{ type: "expand_slices", toCount: 8 }],
  },
};

/** Icons overridden by `src/game/content/iconRegistry.ts` → `card` table. */
export const CARD_CATALOG = withRegistryIcons(CARD_CATALOG_RAW, "card");
