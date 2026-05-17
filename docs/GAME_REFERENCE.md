# SpinWheel — Game reference

**Goal:** grow **bank ($)** forever. **Shop chips** buy perks. **9 wheels** per cycle, then harder **cycle 2, 3, 4…**

**Code rev:** wheel DB **15** · effect registry `src/game/effects/`

---

## 1. Design pillars

| Pillar | Meaning |
|--------|---------|
| **One perk → one job** | Each perk does a single thing (land odds, $ payout, % payout, shield, shop). |
| **Wheel identity** | Money = $, Percent = %, Perk = perks, Lucky = random jackpots. |
| **Infinite cycles** | Every 3 cycles = advancement tier: more $, more risk, deeper random pools. |
| **Player build** | Pick a luck path (money / perk / all), stack payout perks, survive escalating risk. |

---

## 2. Effect system (add new perks here)

**Registry:** `src/game/effects/perkEffects.ts`

| Scope | What it targets |
|-------|------------------|
| `money_wheel` | Wheel 1 only |
| `perk_wheel` | Wheel 4 only |
| `percent_wheel` | Wheel 2 (via payout mult) |
| `all_positive` | Any positive wedge |
| `money_payout` | Flat $ after landing |
| `percent_payout` | Bank gained from +% slices |
| `risk_chaos` | Risk / Chaos / Drain losses |
| `shop` / `cycle_quota` / `on_acquire` | Meta |

**Kinds:** `land_weight` · `payout_mult` · `bank_gain_mult` · `loss_mult` · `shield` · `quota_mult` · `next_payout_double`

Runtime: `applyPerkSpinEffects` (odds) · `applyPerkMoneyPayout` · `applyPerkPercentGain` · `applyPerkLossMult`

---

## 3. Perk catalog (one line each)

### Luck path (pick one or combine)

| Perk | Id | Single effect |
|------|-----|----------------|
| Lucky Money | `lucky_money` | **+12%** land on Money wheel cash wedges |
| Lucky Perk | `lucky_perk` | **+12%** land on Perk wheel offers |
| Lucky Charm | `lucky_streak` | **+10%** land on every positive wedge |

### Money path

| Perk | Id | Single effect |
|------|-----|----------------|
| Loaded Money | `high_roller` | **+10%** land on Money wheel (stacks with Lucky Money) |
| Gold Rush | `gold_rush` | **+25%** $ from money wedges |
| Compounder | `compounder` | **+5%** $ per cycle cleared |
| Double Down | `double_down` | Next **+$** wedge **×2** |

### Percent path

| Perk | Id | Single effect |
|------|-----|----------------|
| Percent Plus | `vip_roller` | **+15%** bank gained from percent **gains** only |

### Other

| Perk | Id | Single effect |
|------|-----|----------------|
| Hot Table | `hot_table` | **+10%** land on **rare** wedges |
| Iron Shield | `iron_reserve` | **+1 shield** on acquire |
| Safe Harbor | `safe_harbor` | **−20%** $ lost on Risk / Chaos / Drain |
| Coupon King | `coupon_king` | Shop **×0.85** |
| Cycle Cushion | `ante_insurance` | Cycle bonus quota **×0.88** |

**Shop tree:** `loop.ts` → `SHOP_PERK_TREE` (Lucky Money / Lucky Perk / Lucky Charm at tier 0).

---

## 4. Shop advancements (run upgrades)

Separate from jokers — max **6** owned (`run.advancements`). Bought with **shop chips**; **rebuilds all wheels** on purchase.

| Upgrade | Id | Effect |
|---------|-----|--------|
| Cash Line | `money_on_all` | +$ wedge on every wheel except Money |
| Perk Line | `perk_on_all` | Perk-offer wedge on every wheel except Perk |
| Percent Drip | `percent_drip` | +4% bank wedge on every wheel except Percent |
| Lucky Dip | `lucky_dip` | +8% land on all positive wedges |
| Cycle Pay | `cycle_stipend` | +$75 bank each new cycle |
| Interest ×2 | `interest_boost` | Double end-of-cycle interest |
| Wide Shop | `shop_extra` | +1 joker & +1 advancement offer per visit |
| Pool Scout | `pool_scout` | Random wheels unlock prizes 1 cycle earlier |
| Soft Landing | `soft_landing` | First cash loss each cycle halved |

Catalog: `src/game/advancements/advancementCatalog.ts` · slice inject: `applyAdvancements.ts`

---

## 5. Nine-wheel cycle

| # | Wheel | Fixed / random | Role |
|---|--------|----------------|------|
| 1 | Money | Fixed tiers, **$ scales per cycle** | Income |
| 2 | Percent | Fixed layout c1 vs c2+ | Stakes |
| 3 | Risk | **Random pool** | Swings |
| 4 | Perk | **Random pool**, skips owned | Build |
| 5 | Drain | **Random pool** | Pressure |
| 6 | Lucky | **Random pool** | Jackpot |
| 7 | Builder | **Random pool** | Modifiers |
| 8 | Chaos | **Random pool** | Variance |
| 9 | Boss | **Random pool** | Payout / doom |

Layouts seeded by `runId + cycle + wheelId`. Pools use **effective cycle** = cycle + advancement depth.

---

## 6. Cycle economy + infinite advancement

### Base compound (every cycle)

| Stat | Growth |
|------|--------|
| Money wedges | **~18%** compound per cycle |
| Money losses | **~12%** compound |
| % gains | **+0.8%** on positive % wedges |

### Advancement tier (every **3** cycles cleared)

| Tier at cycle | Bonus |
|---------------|--------|
| 1–3 | Tier 0 |
| 4–6 | Tier 1: **+4%** money mult, **+6%** risk bias, pool depth +1 |
| 7–9 | Tier 2: stacks again |
| … | Soft cap tier 20; cycle number still scales |

`getCycleAdvancement(cycle)` → `moneyMult`, `riskBias`, `effectivePoolCycle`, label `Cycle N · Tier T`.

### Long-run pressure

`getInfinitePressure(cycle)` adds smooth extra negative weight & stakes mult — runs never plateau.

---

## 7. Loop & lose

- Start **$0**, **0** shop chips, **6** wedges.
- **Heat meter (0–5):** bad spins add heat; wins cool it. At **5**, run ends (even at $0 bank).
- Lose: heat maxed, or bank **≤ $0** after you've spun (Iron Grit relic → once at **$1**).
- **Win streaks** grant bonus chips; **loss streaks** add extra heat.
- **Chip forge:** infinite shop upgrades (cash / % / loss guard / chips / shields).
- Optional cycle bonus: bank ≥ `180 + c×140 + (c−1)^1.25×60` → `8 + c×4` chips.
- Interest after boss: `min(5, floor(bank/5))`.

---

## 8. How to extend (designers)

1. Add row to `PERK_EFFECT_REGISTRY` (one scope, one kind, one value).
2. Add perk to `data/perks.ts` + `SHOP_PERK_TREE` + optional `perk_*` in `prizeCatalog.ts`.
3. Land / payout hooks are automatic if kind matches existing types.
4. New wheel pool entry in `wheelPrizePools.ts` with `minCycle` for late-game slices.

---

## 9. File map

| Topic | File |
|-------|------|
| Perk effects | `src/game/effects/perkEffects.ts` |
| Apply effects | `src/game/effects/applyPerkEffects.ts` |
| Infinite tiers | `src/game/effects/cycleAdvancement.ts` |
| $ / % scaling | `src/game/wheels/database/cycleEconomy.ts` |
| Wheel pools | `wheelPrizePools.ts`, `wheelPrizeBuilder.ts` |
| Shop jokers | `src/game/loop.ts` |
| Shop advancements | `src/game/advancements/` |
| Odds context | `src/hooks/useWheelModifiers.ts` |
| Payout | `src/systems/PerkSystem.ts` |

---

*One effect per perk · seeded random wheels · compound $ + advancement tiers for infinite runs.*
