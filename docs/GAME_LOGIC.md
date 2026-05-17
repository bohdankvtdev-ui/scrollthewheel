# Game logic architecture

Modular roguelike layer wired into the scroll + spin UI.

## Folders

| Path | Purpose |
|------|---------|
| `src/game/wheels/database/` | 9-wheel config, prizes, validation (`npm run validate:wheels`) |
| `src/game/runState/` | Run state, stability, `runEffects`, lifecycle |
| `src/game/runState/runEffects.ts` | Debt Bomb, Lock, Boss Ghost, Corruption, Doom Spiral |
| `src/game/services/wheelResolver.ts` | Slice → money/perks → run effects → jokers → chips |
| `src/game/perks/wheelTypeModifiers.ts` | Wheel-archetype synergies (Coin Magnet, Hot Hand, …) |
| `src/systems/WheelSystem.ts` | Build wheels from DB + cycle scaling |
| `src/systems/RunManager.ts` | Spin rules, cycle complete, fail states |
| `src/hooks/useRunLogic.ts` | Hook for screens: spin, scroll, previews |

## Economy model
| `src/game/runState/` | Run state, `runEffects`, lifecycle |
| Resource | Scope | Use |
|----------|--------|-----|
| **Money** | Per run | Spin outcomes, shop purchases |
| **Chips** | Global meta | Score from runs; top bar |
| **Stability** | Per run | HP — 0 ends run |
| **Perks / relics** | Per run | Odds and money flow |
| **Debuffs** | Per run | Taxes and negative bias |

Legacy `run.deck[]` = in-run casino modifier chips (builder wheel).

## 9-wheel cycle

1. Money · 2. Percent · 3. Risk · 4. Perk · 5. Drain · 6. Lucky · 7. Builder · 8. Chaos · 9. Boss

Defined in `wheelDatabase.ts` (`FLOOR_WHEEL_ORDER`). `WHEEL_COUNT = 9`.

After wheel 9: **cycle complete** → optional blind bonus chips → `cycleLevel++` → harder wheels.

## Pipeline

```
wheelDatabase.ts
    → loader.buildFloorDefinitionsFromDatabase()
    → WheelSystem.buildFloorWheels() + getCycleParams()
    → run.wheels[]

spin: ProbabilityResolver + wheelTypeModifiers
        → runEffects.applyRunEffect()
        → jokerEngine
    → RunManager.checkRunEnd()

advance: RunManager.advanceWheel() → completeCycle() on last wheel
```

## Fail states

| Phase | When |
|-------|------|
| `lost_stability` | Stability ≤ 0 |
| `lost_money` | Money &lt; 0, or $0 + negative slice |
| `lost_instant` | Doom Spiral 5% roll (or similar critical) |

Blind quota is **optional bonus** at cycle end, not a hard gate.

## Cycle scaling

`getCycleParams(cycleLevel)` in `gdd.ts`:

- Cycle 2+: extra negative bias, shop price mult, rarer lucky weights
- Cycle 3+: some wheels forced to risk archetype
- Cycle 4+: double-boss modifier on wheel 9 build

## Extending

1. **New prize:** `prizeCatalog.ts` → row in `wheelDatabase.ts` → `validate:wheels`
2. **New run effect:** `RunEffectId` in `gdd.ts` → handler in `runEffects.ts` → prize `runEffectId` in payload
3. **New perk synergy:** `wheelTypeModifiers.ts` + `data/perks.ts`

See `docs/GDD.md` for player-facing design.

