/**
 * Single ledger for in-run chip grants — tuning lives here.
 */
export const CHIP_GRANTS = {
  /** Minimum chips from any wheel prize that pays chips */
  wheelPrizeChipMin: 3,
  /** Flat bonus after W1/W2 — 0; wheel prize min covers early shop chips */
  earlyAfterWheel1: 0,
  earlyAfterWheel2: 0,
  /** Cash win: floor(bankGain / divisor) */
  cashWinDivisor: 220,
  perkWheelOffer: 3,
  luckyJackpotMinDelta: 400,
  luckyJackpotBonus: 3,
  moneyWheelCashBonus: 0,
  floorClearBase: 2,
  floorClearPerFloor: 1,
  cycleClearChipsBase: 1,
  cycleClearChipsPerCycle: 1,
} as const;

export function chipsFromCashWin(deltaMoney: number): number {
  if (deltaMoney <= 0) return 0;
  const scaled = Math.floor(deltaMoney / CHIP_GRANTS.cashWinDivisor);
  return Math.max(CHIP_GRANTS.wheelPrizeChipMin, scaled);
}

export function cycleClearChipReward(cycle: number): number {
  const c = Math.max(1, cycle);
  return CHIP_GRANTS.cycleClearChipsBase + c * CHIP_GRANTS.cycleClearChipsPerCycle;
}

export function floorClearChipBase(floor: number): number {
  const f = Math.max(1, floor);
  return CHIP_GRANTS.floorClearBase + f * CHIP_GRANTS.floorClearPerFloor;
}
