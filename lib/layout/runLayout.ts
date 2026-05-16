/** Run HUD chrome heights — wheel gets remaining flex space. */
export const RUN_LAYOUT = {
  bar: 52,
  stageRail: 108,
  /** @deprecated Stakes banner removed — kept 0 so layout math stays stable */
  bossStrip: 0,
  loadout: 48,
  prizeFlash: 68,
  /** @deprecated */ header: 52,
  /** @deprecated */ context: 76,
  /** @deprecated */ effectsDock: 58,
  /** @deprecated */ footerUpgrades: 58,
} as const;
