import { CARD_CATALOG } from "../../data/cards";

/** Full label for prize flash / slice sheet (loadout modifier, not shop currency). */
export function deckAddPrizeLabel(cardId: string): string {
  const card = CARD_CATALOG[cardId];
  if (card == null) return "Add Modifier";
  return `+ ${card.name}`;
}

/** Short wedge caption (4–6 chars) — never generic "CHIP". */
export function deckAddWheelCaption(cardId: string): string {
  const short: Record<string, string> = {
    copper_chip: "COPR",
    weighted_die: "DIE",
    purity_charm: "VAULT",
    wide_wheel_card: "WIDE",
  };
  return short[cardId] ?? "MOD+";
}

export const DECK_UPGRADE_PRIZE_LABEL = "Promote Mod";
export const DECK_REMOVE_PRIZE_LABEL = "Scrap Last";
export const DECK_UPGRADE_WHEEL_CAPTION = "UP";
export const DECK_REMOVE_WHEEL_CAPTION = "SCRAP";
