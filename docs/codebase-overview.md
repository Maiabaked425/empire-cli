# Empire CLI — Codebase Overview

> CLI turn-based strategy RPG • TypeScript + Node.js • ~2400 LOC across 17 source files

## Architecture

```
src/
├── index.ts                     # Entry point: menus, game loop, command dispatch
├── game-types.ts                # All type definitions (Territory, Faction, GameState, etc.)
├── state/
│   └── game-state-manager.ts    # Save/load, win condition, state factory
├── engine/
│   ├── combat-resolver.ts       # Power-ratio battle system
│   ├── army-manager.ts          # Recruit, move, merge, casualty handling
│   ├── resource-calculator.ts   # Per-turn income, upkeep, starvation
│   ├── building-manager.ts      # Walls, barracks, market definitions
│   ├── diplomacy-manager.ts     # Alliance, peace, trade engine
│   └── ai-turn-processor.ts     # NPC faction decision-making
├── ui/
│   └── display-helpers.ts       # Terminal rendering: maps, status bars, info panels
├── data/
│   ├── map-registry.ts          # Central map catalog
│   ├── default-world-map.ts     # The Mainland (12 territories, 6 factions)
│   └── archipelago-world-map.ts # The Shattered Isles (14 territories, 6 factions)
└── ai/
    ├── narrator.ts              # Public narration facade
    ├── narrator-prompts.ts      # Prompt templates for battles/turns/gameover
    ├── narrator-client.ts       # Gemini & Ollama backends
    └── narrator-config.ts       # Config persistence (~/.empire-cli/config.json)
```

## Data Flow

```
User Input → processCommand() → Engine Modules → mutate GameState → UI Render
                                      ↓
                              AI Turn Processor → same Engine Modules
                                      ↓
                              Narrator (optional) → Gemini/Ollama → flavor text
```

## Core Type System (`game-types.ts`)

| Type | Role |
|------|------|
| `Territory` | Map tile: owner, armies, resources, buildings, adjacency list |
| `Faction` | Player/AI: personality, color, resources, territory list |
| `Army` | Unit group: faction, units, morale, location |
| `Resources` | `{ gold, food, wood, stone }` |
| `CombatResult` | Battle outcome: casualties, capture flag, log |
| `DiplomaticRelation` | Pair-wise relation: status, turns remaining |
| `WorldMap` | Map template: territories, factions, `layoutIds` for spatial rendering |
| `GameState` | Live state: Maps of territories/factions/armies, turn, diplomacy, log |
| `PlayerIdentity` | Leader name, nation name, slogan (all optional w/ fallbacks) |

## Game Loop (`index.ts`)

```
while (!gameOver):
  printStatus()                    # Show resources, armies, relations
  for 3 actions:
    input → processCommand()       # Military/building/diplomacy commands

  --- End of Turn ---
  processTurnResources()           # All factions: +income, -upkeep
  runAiTurns()                     # NPC factions recruit & attack
  tickDiplomacy()                  # Peace treaties count down & expire
  checkWinCondition()              # First to own all territories wins
  turn++
```

**Action economy:** 3 actions/turn. `map`, `info`, `status`, `help`, `save`, `diplo` are free.

## Key Patterns & Techniques

### 1. Mutable State with Army/Territory Sync

`Territory.armies` is the source of truth for unit counts. `Army` objects track location and morale. `ensureArmyRecord()` reconciles mismatches — called after loads, merges, and edge-case mutations.

```typescript
// army-manager.ts
function ensureArmyRecord(state, factionId, territoryId) {
  // If territory has armies but no Army object → create one
  // If Army exists but territory.armies differs → sync
}
```

### 2. Power-Ratio Combat (`combat-resolver.ts`)

No RNG dice rolls. Deterministic power ratios decide outcomes:

```
attackPower  = units × (morale / 100)
defensePower = units × (morale / 100) × terrainBonus × wallBonus

ratio = attackPower / defensePower
```

| Ratio | Result | Attacker Loss | Defender Loss |
|-------|--------|---------------|---------------|
| ≥ 2.0 | Decisive victory | 10% | 100% |
| 1.2–2.0 | Victory | 25% | 60% |
| 0.8–1.2 | Pyrrhic win | 50% | heavy |
| < 0.8 | Defeat | 60% | minimal |

**Terrain bonuses:** plains=1.0, forest=1.2, mountain=1.5, city=1.3. Walls add +0.3.

### 3. Personality-Driven Systems

`FactionPersonality` (`aggressive | defensive | mercantile | diplomatic`) drives both AI behavior and diplomacy acceptance rates — one config, multiple effects:

```typescript
// diplomacy-manager.ts — acceptance rates by personality
const ACCEPT_RATES = {
  aggressive:  { alliance: 0.15, peace: 0.20, trade: 0.40 },
  defensive:   { alliance: 0.50, peace: 0.70, trade: 0.50 },
  mercantile:  { alliance: 0.40, peace: 0.50, trade: 0.80 },
  diplomatic:  { alliance: 0.80, peace: 0.85, trade: 0.70 },
};
// +30% bonus if target faction is desperate (1 territory left)
```

AI behavior (`ai-turn-processor.ts`): aggressive factions attack more freely; desperate aggressive factions break alliances.

### 4. Canonical Diplomatic Pairs

Relations stored with alphabetically-sorted faction IDs to prevent duplicates:

```typescript
// Always factionA < factionB
function getRelation(diplomacy, a, b) {
  const [fA, fB] = [a, b].sort();
  return diplomacy.find(r => r.factionA === fA && r.factionB === fB);
}
```

### 5. Data-Driven Spatial Maps

Maps define `layoutIds: string[][]` — a 2D grid of territory IDs and connector symbols. The renderer dynamically populates each cell with live game state:

```typescript
// display-helpers.ts
const layout = worldMap.layoutIds;
for (const row of layout) {
  const parts = row.map(cell => {
    if (!cell) return ' '.repeat(CELL_W);       // empty space
    if (cell === '│') return pad('     │', W);   // vertical connector
    if (cell.includes('─')) return cell;          // horizontal connector
    return pad(renderTerritory(cell), W);         // live territory data
  });
  printLine(parts.join(''));
}
```

**ANSI-safe padding:** `stripAnsi()` strips color codes before measuring string width for alignment.

### 6. Graceful Degradation (AI Narrator)

Narrator is fully optional. If disabled, API key missing, or provider times out (5s), game continues without narration:

```typescript
// narrator-client.ts
async function callGemini(prompt): Promise<string | null> {
  try {
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject('timeout'), 5000))
    ]);
    return result.text();
  } catch { return null; }  // silent fallback
}
```

### 7. Backward-Compatible Saves

`fromSaveData()` backfills missing fields for old saves:

```typescript
// game-state-manager.ts
mapId: save.mapId ?? 'mainland',
playerIdentity: save.playerIdentity ?? { leaderName: '', nationName: '', slogan: '' },
diplomacy: save.diplomacy ?? [],
buildings: territory.buildings ?? [],  // pre-building-system saves
```

## Resource Economy (`resource-calculator.ts`)

Per-turn flow per faction:

```
Income  = Σ territory.resources  (each territory yields gold/food/wood/stone)
        + market bonus (+2 gold per market building)
Upkeep  = 1 food per army unit
Net     = income - upkeep  (clamped to ≥ 0)
```

Starvation (food=0) and bankruptcy (gold=0) logged as warnings but don't kill units.

## Building System (`building-manager.ts`)

| Building | Cost | Effect |
|----------|------|--------|
| Walls | 10 wood, 15 stone | +0.3 defense bonus in combat |
| Barracks | 8 wood, 5 stone | Recruit costs 2 gold instead of 3 |
| Market | 10 gold, 5 wood, 3 stone | +2 gold income per turn |

One of each per territory. Buildings persist through ownership changes.

## AI Turn Processing (`ai-turn-processor.ts`)

Each NPC faction per turn:
1. **Recruit** — if affordable, train up to 3 units in first territory
2. **Break alliances** — desperate aggressive factions (1 territory, <5 gold) betray allies
3. **Attack** — scan territories for adjacent weaker targets; one attack per turn; respects treaties

## Adding New Maps

1. Create `src/data/my-map.ts` exporting a `WorldMap` object
2. Define territories, factions, and `layoutIds` grid
3. Register in `src/data/map-registry.ts`:
   ```typescript
   import { MY_MAP } from './my-map.js';
   export const ALL_MAPS: WorldMap[] = [MAINLAND_MAP, ARCHIPELAGO_MAP, MY_MAP];
   ```

## Tech Stack

- **TypeScript** — strict types, ES modules (`"type": "module"`)
- **Node.js readline** — synchronous CLI input via `createInterface`
- **chalk v5** — terminal colors (ESM-only)
- **@google/generative-ai** — Gemini API for narrator
- **Ollama HTTP API** — local LLM alternative
- **JSON file persistence** — saves at `~/.empire-cli/saves/`, config at `~/.empire-cli/config.json`

## State Invariants

1. `Territory.armies === Σ Army.units` for matching territory/faction
2. `Territory.owner ∈ faction.territories` (bidirectional ownership)
3. Diplomatic pairs: always `factionA < factionB` alphabetically
4. Resources ≥ 0 (clamped after each turn)
5. Win condition: single faction owns all territories
