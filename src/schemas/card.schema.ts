export type CardEffect =
  | { type: "flat_money"; amount: number }
  | { type: "slice_weight_mult"; tag: string; mult: number }
  | { type: "money_shield"; amount: number }
  | { type: "reroll_next"; count: number }
  | { type: "expand_slices"; toCount: 6 | 8 | 10 | 12 };

export type CardDefinition = {
  id: string;
  name: string;
  rarity: "common" | "uncommon" | "rare";
  icon: string;
  iconFamily: "MaterialIcons" | "MaterialCommunityIcons" | "Ionicons";
  effects: CardEffect[];
};
