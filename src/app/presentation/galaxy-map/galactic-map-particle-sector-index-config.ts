import {
  type GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

import {
  type GalacticMapParticleSectorIndexConfig,
} from './galactic-map-particle-sector-index';

import {
  sectorCellSize,
} from './galactic-map-sector-overlay';

/**
 * Main-thread-only extraction of canonical grid geometry for point 10.9.
 * The worker receives only these scalar values, never the exploration model or
 * physical sector contents.
 */
export function galacticMapParticleSectorIndexConfig(
  coverage:
    GalacticMapExplorationCoverage,

  haloOuterRadiusNormalized:
    number,
): GalacticMapParticleSectorIndexConfig {

  return Object.freeze({
    cellSize:
      sectorCellSize(
        coverage,
        haloOuterRadiusNormalized,
      ),

    minCoordinate:
      coverage.grid.minCoordinate,

    maxCoordinate:
      coverage.grid.maxCoordinate,
  });
}
