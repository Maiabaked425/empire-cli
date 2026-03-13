// Archipelago world map: "The Shattered Isles" — 10 territories, 4 factions
// A chain of islands connected by bridges and shallow waters
// Map layout:
//   [Coral Haven] --- [Tidecrest]
//        |                |
//   [Stormwatch] --- [Pearl Shoals] --- [Ember Isle]
//        |                |                |
//   [Driftwood]      [Serpent Bay] --- [Obsidian Rock]
//                         |
//                    [Fog Marsh] --- [Skyspire]

import type { Territory, Faction, WorldMap } from '../game-types.js';

const TERRITORIES: Territory[] = [
  {
    id: 'coral_haven',
    name: 'Coral Haven',
    type: 'city',
    owner: 'tide_lords',
    armies: 3,
    resources: { gold: 5, food: 3, wood: 1, stone: 1 },
    adjacentTo: ['tidecrest', 'stormwatch'],
    buildings: [],
  },
  {
    id: 'tidecrest',
    name: 'Tidecrest',
    type: 'plains',
    owner: 'tide_lords',
    armies: 2,
    resources: { gold: 2, food: 3, wood: 2, stone: 1 },
    adjacentTo: ['coral_haven', 'pearl_shoals'],
    buildings: [],
  },
  {
    id: 'stormwatch',
    name: 'Stormwatch',
    type: 'mountain',
    owner: 'storm_kin',
    armies: 3,
    resources: { gold: 1, food: 1, wood: 0, stone: 5 },
    adjacentTo: ['coral_haven', 'pearl_shoals', 'driftwood'],
    buildings: [],
  },
  {
    id: 'pearl_shoals',
    name: 'Pearl Shoals',
    type: 'plains',
    owner: null,
    armies: 0,
    resources: { gold: 3, food: 2, wood: 1, stone: 1 },
    adjacentTo: ['tidecrest', 'stormwatch', 'ember_isle', 'serpent_bay'],
    buildings: [],
  },
  {
    id: 'ember_isle',
    name: 'Ember Isle',
    type: 'mountain',
    owner: 'flame_brood',
    armies: 3,
    resources: { gold: 2, food: 0, wood: 0, stone: 6 },
    adjacentTo: ['pearl_shoals', 'obsidian_rock'],
    buildings: [],
  },
  {
    id: 'driftwood',
    name: 'Driftwood',
    type: 'forest',
    owner: 'storm_kin',
    armies: 2,
    resources: { gold: 1, food: 2, wood: 5, stone: 0 },
    adjacentTo: ['stormwatch'],
    buildings: [],
  },
  {
    id: 'serpent_bay',
    name: 'Serpent Bay',
    type: 'city',
    owner: null,
    armies: 0,
    resources: { gold: 4, food: 2, wood: 1, stone: 2 },
    adjacentTo: ['pearl_shoals', 'obsidian_rock', 'fog_marsh'],
    buildings: [],
  },
  {
    id: 'obsidian_rock',
    name: 'Obsidian Rock',
    type: 'mountain',
    owner: 'flame_brood',
    armies: 2,
    resources: { gold: 1, food: 0, wood: 0, stone: 5 },
    adjacentTo: ['ember_isle', 'serpent_bay'],
    buildings: [],
  },
  {
    id: 'fog_marsh',
    name: 'Fog Marsh',
    type: 'forest',
    owner: 'mist_walkers',
    armies: 3,
    resources: { gold: 2, food: 4, wood: 3, stone: 0 },
    adjacentTo: ['serpent_bay', 'skyspire'],
    buildings: [],
  },
  {
    id: 'skyspire',
    name: 'Skyspire',
    type: 'mountain',
    owner: 'mist_walkers',
    armies: 2,
    resources: { gold: 3, food: 1, wood: 0, stone: 4 },
    adjacentTo: ['fog_marsh'],
    buildings: [],
  },
];

const FACTIONS: Faction[] = [
  {
    id: 'tide_lords',
    name: 'Tide Lords',
    personality: 'mercantile',
    color: 'cyan',
    territories: ['coral_haven', 'tidecrest'],
    gold: 25,
    food: 15,
    wood: 8,
    stone: 5,
    totalArmies: 5,
  },
  {
    id: 'storm_kin',
    name: 'Storm Kin',
    personality: 'aggressive',
    color: 'blue',
    territories: ['stormwatch', 'driftwood'],
    gold: 15,
    food: 10,
    wood: 20,
    stone: 15,
    totalArmies: 5,
  },
  {
    id: 'flame_brood',
    name: 'Flame Brood',
    personality: 'aggressive',
    color: 'red',
    territories: ['ember_isle', 'obsidian_rock'],
    gold: 12,
    food: 5,
    wood: 2,
    stone: 25,
    totalArmies: 5,
  },
  {
    id: 'mist_walkers',
    name: 'Mist Walkers',
    personality: 'diplomatic',
    color: 'magenta',
    territories: ['fog_marsh', 'skyspire'],
    gold: 18,
    food: 12,
    wood: 10,
    stone: 10,
    totalArmies: 5,
  },
];

/** The Shattered Isles — 10 territories, 4 factions, island chain */
export const ARCHIPELAGO_MAP: WorldMap = {
  id: 'archipelago',
  name: 'The Shattered Isles',
  description: '10 territories, 4 factions — island chain with chokepoints',
  territories: TERRITORIES,
  factions: FACTIONS,
  layoutIds: [
    ['coral_haven', '────', 'tidecrest'],
    ['│', '', '│'],
    ['stormwatch', '────', 'pearl_shoals', '────', 'ember_isle'],
    ['│', '', '│', '', '│'],
    ['driftwood', '', 'serpent_bay', '────', 'obsidian_rock'],
    ['', '', '│'],
    ['', '', 'fog_marsh', '────', 'skyspire'],
  ],
};
