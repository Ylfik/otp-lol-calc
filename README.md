# Udyr Calc

A damage and sustain calculator for Udyr on Summoner's Rift, comparing three builds side by side.

Single HTML file, no build step, no server. Open it and it runs.

**[Live version](https://ylfik.github.io/udyr-calc/)**
---

## What it does

- Three builds compared at once: items, runes, shards, level and ability ranks
- Full stat block for each build, grouped into offense / defense / utility
- Damage **and healing** for all four stances, over a realistic combo
- Item and rune passives folded into the maths, not just their raw stats
- Item search that understands stats: `leth`, `ad crit`, `ah>=20`, `gold<1300`
- Builds saved in the browser, or exported as a portable `.json`

---

## The combo of reference

Every number is measured over the same sequence: **4 basic attacks — 2 in the stance, then 2 awakened.**

This is the standard in-game pattern, and it matters for how passives are counted:

| Passive type | Triggers in the combo |
|---|---|
| On-hit (Fray, Cleave, Mist's Edge, Shock…) | 4 |
| Spellblade | 2, one per stance cast |
| Every third attack (Kraken Slayer) | 1 |
| Energized (Voltaic, Stormrazor, Statikk) | 1, charged before the fight and no time to recharge |
| Actives and once-per-combo effects | 1 |

The combo is stepped through **one attack at a time**, because passives that scale off the
target's *current* health hit for less as the target drops. Blade of the Ruined King is the
clearest case: computing `4 × 9% of max health` overstates it by more than double.

Damage keeps accruing after the target would have died — the number is a measure of output,
not a time-to-kill.

---

## Where the numbers come from

| Data | Source |
|---|---|
| Item stats, costs, passive values | League of Legends Wiki, `Module:ItemData` |
| Rune values | Riot `runesReforged.json` |
| Item and rune icons | Riot Data Dragon / Community Dragon |
| Ability formulas | Ported from the original spreadsheet, verified value by value |

**Melee values throughout**, since Udyr is melee. Where the wiki gives a melee/ranged split
(Mist's Edge 9%/6%, Titanic Cleave 1%/0.5%, Fanfare 30%/20% attack speed), the melee figure is used.

Only items flagged `classic sr 5v5 = true` are included. ARAM, Arena and Prismatic items are out,
as are items Data Dragon still lists but that no longer exist in the shop.

---

## Conventions

**Nothing or max.** A conditional passive is either off, or counted at full value — Conqueror at
12 stacks, Black Cleaver at 5, Legend runes capped. Each one has its own toggle so you decide.

**Penetration order.** Armor shred first, then lethality, then percentage penetration.

**Crit** uses the in-game formula: `1 + chance × (0.75 + bonus crit damage)`.

**Move speed** applies the real soft caps: `×0.8 + 83` above 415, `×0.5 + 230` above 490.

**Healing** separates the two sources, because they behave differently: life steal only heals off
basic attack damage, omnivamp heals off everything. Heal and shield power boosts cast heals and
shields, not vampirism.

---

## Known limits

- Effects that only hit secondary targets (the Hydra family's Cleave) are listed but deal nothing,
  since the calculator measures single-target output.
- Abyssal Mask and Shadowflame amplify magic damage only; the engine applies their amp to the whole
  combo, so turn them off on an AD build.
- Terminus alternates Light and Dark hits — over 4 attacks you get 2 stacks of each, not 3, so its
  conditional bonus is optimistic on this combo.
- Spear of Shojin amplifies ability, pet and proc damage but not basic attacks.

---

## Saving

Two independent routes, because a page opened from a local `file://` path can't always use browser
storage:

- **Save / Del** — named pages kept in the browser, per browser and per address
- **Export / Import** — a portable `udyr-builds.json` you can move between machines or share

Saves do not follow you from a local file to the hosted version, or between browsers. Export is the
format of exchange.

---

## Credits

Made by **Ylfik**.

Built from my own Google Sheets calculator and rewritten as a web app with the help of an AI
assistant, which wrote the code and cross-checked every value against the official item and rune
data. The damage model, the build choices and the testing are mine.

Udyr Calc isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or
anyone officially involved in producing or managing Riot Games properties. Riot Games and all
associated properties are trademarks or registered trademarks of Riot Games, Inc.
