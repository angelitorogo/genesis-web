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
  type StellarBrownDwarfClass,
} from './stellar-brown-dwarf-class';

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
 * Point 14.2 adds the broad O/B/A/F/G/K/M family for MAIN_SEQUENCE stars and
 * point 14.3 adds the broad L/T/Y family for the BROWN_DWARF branch. These are
 * domain-level families only: mass, radius, luminosity, temperature, detailed
 * spectral subtype/color, age, metallicity, discovery state and rendering data
 * remain later-roadmap contracts.
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

    readonly brownDwarfClass:
      StellarBrownDwarfClass | null = null,
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

    const isBrownDwarf =
      evolutionState.name ===
      StellarEvolutionStates.BROWN_DWARF.name;

    if (
      isBrownDwarf &&
      brownDwarfClass ===
        null
    ) {
      throw new RangeError(
        'BROWN_DWARF stars require a StellarBrownDwarfClass.',
      );
    }

    if (
      !isBrownDwarf &&
      brownDwarfClass !==
        null
    ) {
      throw new RangeError(
        `${evolutionState.name} stars cannot carry a brown-dwarf class.`,
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
