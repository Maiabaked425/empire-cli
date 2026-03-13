// Registry of all available world maps for map selection
import type { WorldMap } from '../game-types.js';
import { MAINLAND_MAP } from './default-world-map.js';
import { ARCHIPELAGO_MAP } from './archipelago-world-map.js';

/** All playable maps, ordered for menu display */
export const ALL_MAPS: WorldMap[] = [MAINLAND_MAP, ARCHIPELAGO_MAP];

/** Look up a map by id */
export function getMapById(id: string): WorldMap | undefined {
  return ALL_MAPS.find((m) => m.id === id);
}
