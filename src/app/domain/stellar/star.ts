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

import {
  type StellarNeutronStarFormationChannel,
} from './stellar-neutron-star-formation-channel';

import {
  type StellarPostMainSequenceStage,
  StellarPostMainSequenceStage as StellarPostMainSequenceStages,
} from './stellar-post-main-sequence-stage';

import {
  type StellarWhiteDwarfComposition,
} from './stellar-white-dwarf-composition';

/**
 * Phase-14 domain identity for the canonical stellar primary of one planetary
 * system.
 *
 * The existing GENESIS procedural hierarchy intentionally has no StarLocator:
 * SystemLocator is the stable identity of the V1 system/primary-star target
 * and BodyLocator descends directly from that system. Phase 14 therefore does
 * not insert a new seed or locator level and cannot perturb frozen procedural
 * vectors.
 *
 * Point 14.2 adds O/B/A/F/G/K/M for MAIN_SEQUENCE stars, point 14.3 adds L/T/Y
 * for BROWN_DWARF, and point 14.4 distinguishes the post-main-sequence RGB/AGB
 * giant stages from the massive SUPERGIANT branch. Point 14.5 adds the broad
 * internal composition family of WHITE_DWARF remnants without conflating it
 * with later DA/DB/etc. spectral-atmospheric classification. Point 14.6 marks
 * NEUTRON_STAR objects as compact remnants with an explicit coarse formation
 * channel, while deliberately leaving pulsar/magnetar behaviour to later
 * rotation/activity contracts. These are domain-level evolutionary families
 * only: mass, radius, luminosity, temperature, detailed
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

    readonly postMainSequenceStage:
      StellarPostMainSequenceStage | null = null,

    readonly whiteDwarfComposition:
      StellarWhiteDwarfComposition | null = null,

    readonly neutronStarFormationChannel:
      StellarNeutronStarFormationChannel | null = null,
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

    const isGiant =
      evolutionState.name ===
      StellarEvolutionStates.GIANT.name;

    const isSupergiant =
      evolutionState.name ===
      StellarEvolutionStates.SUPERGIANT.name;

    if (
      (
        isGiant ||
        isSupergiant
      ) &&
      postMainSequenceStage ===
        null
    ) {
      throw new RangeError(
        `${evolutionState.name} stars require a StellarPostMainSequenceStage.`,
      );
    }

    if (
      !isGiant &&
      !isSupergiant &&
      postMainSequenceStage !==
        null
    ) {
      throw new RangeError(
        `${evolutionState.name} stars cannot carry a post-main-sequence stage.`,
      );
    }

    if (
      isGiant &&
      postMainSequenceStage !==
        null &&
      postMainSequenceStage.name ===
        StellarPostMainSequenceStages.SUPERGIANT.name
    ) {
      throw new RangeError(
        'GIANT stars must use RED_GIANT_BRANCH or ASYMPTOTIC_GIANT_BRANCH.',
      );
    }

    if (
      isSupergiant &&
      postMainSequenceStage !==
        null &&
      postMainSequenceStage.name !==
        StellarPostMainSequenceStages.SUPERGIANT.name
    ) {
      throw new RangeError(
        'SUPERGIANT stars require the SUPERGIANT post-main-sequence stage.',
      );
    }

    const isWhiteDwarf =
      evolutionState.name ===
      StellarEvolutionStates.WHITE_DWARF.name;

    if (
      isWhiteDwarf &&
      whiteDwarfComposition ===
        null
    ) {
      throw new RangeError(
        'WHITE_DWARF stars require a StellarWhiteDwarfComposition.',
      );
    }

    if (
      !isWhiteDwarf &&
      whiteDwarfComposition !==
        null
    ) {
      throw new RangeError(
        `${evolutionState.name} stars cannot carry a white-dwarf composition.`,
      );
    }

    const isNeutronStar =
      evolutionState.name ===
      StellarEvolutionStates.NEUTRON_STAR.name;

    if (
      isNeutronStar &&
      neutronStarFormationChannel ===
        null
    ) {
      throw new RangeError(
        'NEUTRON_STAR remnants require a StellarNeutronStarFormationChannel.',
      );
    }

    if (
      !isNeutronStar &&
      neutronStarFormationChannel !==
        null
    ) {
      throw new RangeError(
        `${evolutionState.name} stars cannot carry a neutron-star formation channel.`,
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
