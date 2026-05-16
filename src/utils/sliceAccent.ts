import type { SliceKind } from "../schemas";
import { Neo } from "../../theme/neoBrutal";

const KIND_TINT: Partial<Record<SliceKind, string>> = {
  money: "#FEF9C3",
  money_loss: "#FECACA",
  perk: "#EDE9FE",
  debuff: "#FEE2E2",
  deck_add: "#CFFAFE",
  deck_remove: "#FED7AA",
  deck_upgrade: "#D9F99D",
  relic_offer: "#FDE68A",
  booster: "#A7F3D0",
  neutral: "#E5E7EB",
  bank_wipe: "#FCA5A5",
  bank_cut: "#FDBA74",
};

export function sliceAccentForKind(kind: SliceKind, fallbackIndex = 0): string {
  return KIND_TINT[kind] ?? Neo.segmentColors[fallbackIndex % Neo.segmentColors.length]!;
}
