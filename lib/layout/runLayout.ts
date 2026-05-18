/** Run HUD chrome heights — wheel gets remaining flex space. */
export const RUN_LAYOUT = {
  bar: 52,
  stageRail: 108,
  /** @deprecated Stakes banner removed — kept 0 so layout math stays stable */
  bossStrip: 0,
  loadout: 48,
  /** @deprecated Notices overlay the loadout — no reserved strip. */
  notice: 0,
  /** Bottom cue: tap to spin, results, and tactic pick (one shared height). */
  prizeFlash: 72,
  /** @deprecated Same as `prizeFlash`. */
  prizeFlashTactic: 72,
  /** Centered content width inside prize flash — not full-bleed. */
  prizeFlashMaxWidth: 340,
  /** @deprecated Tactics pick lives in prize flash bar. */
  microChoice: 0,
  /** @deprecated */ header: 52,
  /** @deprecated */ context: 76,
  /** @deprecated */ effectsDock: 58,
  /** @deprecated */ footerUpgrades: 58,
} as const;
