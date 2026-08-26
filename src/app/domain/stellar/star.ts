import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type StellarEvolutionState,
} from './stellar-evolution-state';

/**
 * Point-14.1 domain identity for the canonical stellar primary of one
 * planetary system.
 *
 * The existing GENESIS procedural hierarchy intentionally has no StarLocator:
 * SystemLocator is the stable identity of the V1 system/primary-star target
 * and BodyLocator descends directly from that system. Point 14.1 therefore
 * does not insert a new seed or locator level and cannot perturb any frozen
 * procedural vector.
 *
 * This model deliberately contains no spectral class, mass, metallicity,
 * radius, luminosity, temperature, age, discovery state or rendering data.
 * Those properties and the rules that derive them belong to later roadmap
 * points. At 14.1 only identity plus the canonical evolutionary state are
 * materialized.
 */
export class Star {

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly locator:
      SystemLocator,

    readonly evolutionState:
      StellarEvolutionState,
  ) {}

  get galaxyIndex():
    bigint {

    return this
      .locator
      .galaxyIndex;
  }

  get sectorKey():
    bigint {

    return this
      .locator
      .sectorKey;
  }

  get galacticObjectIndex():
    bigint {

    return this
      .locator
      .galacticObjectIndex;
  }
}
