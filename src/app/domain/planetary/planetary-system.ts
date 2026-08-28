import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  type StellarSystem,
} from '../stellar/stellar-system';

import {
  type PlanetarySystemFormationBlueprint,
} from './planetary-system-formation-blueprint';

/**
 * Phase-18 root aggregate for one planetary system.
 *
 * Point 18.1 deliberately establishes only the stable identity/boundary of the
 * mature planetary-system generator. It retains the exact phase-16 host stellar
 * system and the frozen point-17.7 formation blueprint that later phase-18
 * steps are allowed to consume.
 *
 * No final planet count, architecture, orbital elements, periods, stability,
 * habitable-zone classification or designations exist here yet. Those fields
 * are intentionally absent until points 18.2..18.8 define them.
 *
 * A planetary system does not introduce a new seed level: its procedural
 * identity is the existing SystemLocator/SystemSeed pair of the host stellar
 * system. BodySeed remains reserved for individual bodies generated later.
 */
export class PlanetarySystem {

  constructor(
    readonly hostStellarSystem:
      StellarSystem,

    readonly formationBlueprint:
      PlanetarySystemFormationBlueprint,
  ) {}

  get generationKey():
    UniverseGenerationKey {

    return this
      .hostStellarSystem
      .generationKey;
  }

  get locator():
    SystemLocator {

    return this
      .hostStellarSystem
      .locator;
  }

  get seed():
    SystemSeed {

    return this
      .hostStellarSystem
      .seed;
  }

  get formationAnchorCount():
    number {

    return this
      .formationBlueprint
      .anchorCount;
  }

  get hasFormationAnchors():
    boolean {

    return this
      .formationBlueprint
      .hasFormationAnchors;
  }
}
