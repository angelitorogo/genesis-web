import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type StellarEvolutionState,
  StellarEvolutionState as StellarEvolutionStates,
} from './stellar-evolution-state';

import {
  type StellarMainSequenceClass,
} from './stellar-main-sequence-class';

/**
 * Point-14.1/14.2 domain identity for the canonical stellar primary of one
 * planetary system.
 *
 * The existing GENESIS procedural hierarchy intentionally has no StarLocator:
 * SystemLocator is the stable identity of the V1 system/primary-star target
 * and BodyLocator descends directly from that system. Phase 14 therefore does
 * not insert a new seed or locator level and cannot perturb frozen procedural
 * vectors.
 *
 * Point 14.2 adds only the broad O/B/A/F/G/K/M family when the evolutionary
 * state is MAIN_SEQUENCE. It deliberately does not add mass, radius,
 * luminosity, temperature, detailed spectral subtype/color, age, metallicity,
 * discovery state or rendering data. Those contracts belong to later roadmap
 * points.
 */
export class Star {

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly locator:
      SystemLocator,

    readonly evolutionState:
      StellarEvolutionState,

    readonly mainSequenceClass:
      StellarMainSequenceClass | null,
  ) {
    const isMainSequence =
      evolutionState.name ===
      StellarEvolutionStates.MAIN_SEQUENCE.name;

    if (
      isMainSequence &&
      mainSequenceClass ===
        null
    ) {
      throw new RangeError(
        'MAIN_SEQUENCE stars require a StellarMainSequenceClass.',
      );
    }

    if (
      !isMainSequence &&
      mainSequenceClass !==
        null
    ) {
      throw new RangeError(
        `${evolutionState.name} stars cannot carry a main-sequence class.`,
      );
    }
  }

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
