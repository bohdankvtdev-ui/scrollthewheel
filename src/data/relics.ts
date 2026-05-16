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
    description: "+25% boss damage",
    weightTagMult: { boss: 1.25 },
  },
};

export const RELIC_CATALOG = withRegistryIcons(RELIC_CATALOG_RAW, "relic");
