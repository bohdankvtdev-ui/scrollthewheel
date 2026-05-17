import type { RelicDefinition } from "../schemas";
import { withRegistryIcons } from "../game/content/withRegistryIcons";

const RELIC_CATALOG_RAW: Record<string, RelicDefinition> = {
  lucky_coin: {
    id: "lucky_coin",
    name: "Lucky Coin",
    icon: "monetization-on",
    iconFamily: "MaterialIcons",
    stackable: false,
    description: "+10% positive slice weight",
    weightTagMult: { positive: 1.1 },
    moneyMult: 1.05,
  },
  void_lens: {
    id: "void_lens",
    name: "Void Lens",
    icon: "diamond",
    iconFamily: "MaterialIcons",
    stackable: false,
    description: "-15% negative slice weight",
    weightTagMult: { negative: 0.85 },
  },
  boss_slayer: {
    id: "boss_slayer",
    name: "Boss Slayer",
    icon: "sword-cross",
    iconFamily: "MaterialCommunityIcons",
    stackable: true,
    description: "Boss wheel negatives −12%",
    weightTagMult: { negative: 0.88 },
  },
  coin_magnet: {
    id: "coin_magnet",
    name: "Coin Magnet",
    icon: "attach-money",
    iconFamily: "MaterialIcons",
    stackable: false,
    description: "Money wheel gains +15%",
    moneyMult: 1.15,
    weightTagMult: { positive: 1.1 },
  },
  firewall: {
    id: "firewall",
    name: "Firewall",
    icon: "security",
    iconFamily: "MaterialIcons",
    stackable: false,
    description: "Blocks corruption chains",
    weightTagMult: { negative: 0.9 },
  },
  debt_shield: {
    id: "debt_shield",
    name: "Debt Shield",
    icon: "shield",
    iconFamily: "MaterialCommunityIcons",
    stackable: false,
    description: "First negative hit each cycle ignored",
  },
  hot_hand: {
    id: "hot_hand",
    name: "Hot Hand",
    icon: "whatshot",
    iconFamily: "MaterialIcons",
    stackable: false,
    description: "Every 5th spin luckier",
    weightTagMult: { rare: 1.15 },
  },
  iron_grit: {
    id: "iron_grit",
    name: "Iron Grit",
    icon: "fitness-center",
    iconFamily: "MaterialIcons",
    stackable: false,
    description: "First time bank hits $0, survive with $1",
  },
};

export const RELIC_CATALOG = withRegistryIcons(RELIC_CATALOG_RAW, "relic");
