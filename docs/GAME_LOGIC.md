# Game logic architecture

Modular roguelike layer wired into the existing scroll + spin UI.

## Folders

| Path | Purpose |
|------|---------|
| `src/game/wheels/` | 10-wheel floor prototype, archetypes, `WheelOutcome` type |
| `src/game/perks/` | Joker catalog, triggers (`onSpin`, `onGainMoney`, …), `applyJokerEvent` |
| `src/game/runState/` | Extended run state, chip scoring, lifecycle (`createRunState`, …) |
| `src/game/services/wheelResolver.ts` | Pick outcome → apply money/perks → jokers → meta chips |
| `src/hooks/useRunLogic.ts` | Hook for screens: spin, scroll, previews |

## Economy model

| Resource | Scope | Use |
|----------|--------|-----|
| **Money** | Per run | Spin outcomes, shop purchases; run ends at $0 |
| **Chips** | Global meta | Score from runs; shown in top bar; **not** spent in-run |
| **Jokers / perks** | Per run | `run.perks[]`; modify odds and money flow |

Legacy `run.deck[]` = in-run casino modifier chips (builder wheel); separate from meta chips.

## 10-wheel floor

1. Money · 2. Percent · 3. Risk · 4. Joker Offer · 5. Drain · 6. Lucky · 7. Builder · 8. Jackpot · 9. Curse · 10. Boss

Defined in `game/wheels/floorPrototype.ts`; `loop.ts` exports `WHEEL_COUNT = 10`.

## Integration points

- `runStore.applySpinResult` → `resolveWheelSpin()`
- `runStore.claimAndAdvance` → advances wheel; grants meta chips on run end
- `RunManager.createInitialRun` → seeds `chipsEarnedThisRun`, `modifiers`
- `metaStore.grantChips` → persists `totalChips`

## Extending

1. **New joker:** `data/perks.ts` + trigger in `perks/jokerCatalog.ts` + logic in `perks/jokerEngine.ts` and/or `PerkSystem.ts`
2. **New wheel:** add row to `FLOOR_PROTOTYPE_WHEELS` + pool in `prizes.ts`
3. **New slice:** `SLICE_POOLS` entry with `payload` (`moneyDelta`, `perkId`, …)

See `docs/GDD.md` for player-facing design.
