import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type GalaxySeed,
} from '../seed/hierarchical-seeds';

import {
  type GalacticNucleus,
} from './galactic-nucleus';

import {
  type GalaxyDesignation,
} from './galaxy-designation';

import {
  type GalaxyPhysicalProperties,
} from './galaxy-physical-properties';

import {
  type GalaxyType,
} from './galaxy-type';

const SIGNED_LONG_MAX =
  (1n << 63n) -
  1n;

/**
 * Domain model of a galaxy.
 *
 * At roadmap point 4.7 it contains:
 *
 * - procedural identity;
 * - procedural designation;
 * - canonical galaxy type;
 * - baseline physical properties;
 * - physical structure;
 * - galactic nucleus.
 *
 * Exploration state belongs to roadmap point 4.8.
 */
export class Galaxy {

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly index:
      bigint,

    readonly seed:
      GalaxySeed,

    readonly designation:
      GalaxyDesignation,

    readonly type:
      GalaxyType,

    readonly physicalProperties:
      GalaxyPhysicalProperties,

    readonly nucleus:
      GalacticNucleus | null,
  ) {
    if (
      index <
        0n ||
      index >
        SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        `Galaxy index must be a non-negative signed Long: ${index}.`,
      );
    }
  }
}