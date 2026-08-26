import {
  type StellarBlackHoleFormationChannel,
} from './stellar-black-hole-formation-channel';

import {
  type StellarBrownDwarfClass,
} from './stellar-brown-dwarf-class';

import {
  type StellarEvolutionState,
  StellarEvolutionState as StellarEvolutionStates,
} from './stellar-evolution-state';

import {
  type StellarEvolutionInput,
} from './stellar-evolution-input';

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
 * Point-14.8 deterministic evolutionary assessment for one isolated stellar
 * progenitor at a specific age.
 *
 * The assessment intentionally keeps theoretical phase durations separate from
 * the Star entity. Point 15.3 may later derive generated-star age/remaining
 * life from the same model without forcing those values into Star at phase 14.
 */
export class StellarEvolutionAssessment {

  constructor(
    readonly input:
      StellarEvolutionInput,

    readonly evolutionState:
      StellarEvolutionState,

    readonly mainSequenceClass:
      StellarMainSequenceClass | null,

    readonly brownDwarfClass:
      StellarBrownDwarfClass | null,

    readonly postMainSequenceStage:
      StellarPostMainSequenceStage | null,

    readonly whiteDwarfComposition:
      StellarWhiteDwarfComposition | null,

    readonly neutronStarFormationChannel:
      StellarNeutronStarFormationChannel | null,

    readonly blackHoleFormationChannel:
      StellarBlackHoleFormationChannel | null,

    readonly mainSequenceLifetimeBillionYears:
      number | null,

    readonly postMainSequenceDurationBillionYears:
      number | null,
  ) {
    const isBrownDwarf =
      evolutionState.name ===
      StellarEvolutionStates.BROWN_DWARF.name;

    if (
      isBrownDwarf
    ) {
      if (
        brownDwarfClass ===
          null ||
        mainSequenceClass !==
          null ||
        postMainSequenceStage !==
          null ||
        whiteDwarfComposition !==
          null ||
        neutronStarFormationChannel !==
          null ||
        blackHoleFormationChannel !==
          null ||
        mainSequenceLifetimeBillionYears !==
          null ||
        postMainSequenceDurationBillionYears !==
          null
      ) {
        throw new RangeError(
          'BROWN_DWARF assessments require only a brown-dwarf class and no stellar-burning lifetime.',
        );
      }

      return;
    }

    assertPositiveFinite(
      mainSequenceLifetimeBillionYears,
      'mainSequenceLifetimeBillionYears',
    );

    assertPositiveFinite(
      postMainSequenceDurationBillionYears,
      'postMainSequenceDurationBillionYears',
    );

    const isMainSequence =
      evolutionState.name ===
      StellarEvolutionStates.MAIN_SEQUENCE.name;

    if (
      isMainSequence !==
        (
          mainSequenceClass !==
          null
        )
    ) {
      throw new RangeError(
        'MAIN_SEQUENCE assessment/classification mismatch.',
      );
    }

    const isGiant =
      evolutionState.name ===
      StellarEvolutionStates.GIANT.name;

    const isSupergiant =
      evolutionState.name ===
      StellarEvolutionStates.SUPERGIANT.name;

    if (
      isGiant ||
      isSupergiant
    ) {
      if (
        postMainSequenceStage ===
          null
      ) {
        throw new RangeError(
          `${evolutionState.name} assessments require a post-main-sequence stage.`,
        );
      }
    } else if (
      postMainSequenceStage !==
        null
    ) {
      throw new RangeError(
        `${evolutionState.name} assessments cannot carry a post-main-sequence stage.`,
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
        'GIANT assessments cannot use the SUPERGIANT stage.',
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
        'SUPERGIANT assessments require the SUPERGIANT stage.',
      );
    }

    assertExclusiveRemnantDetail(
      evolutionState,
      StellarEvolutionStates.WHITE_DWARF,
      whiteDwarfComposition,
      'white-dwarf composition',
    );

    assertExclusiveRemnantDetail(
      evolutionState,
      StellarEvolutionStates.NEUTRON_STAR,
      neutronStarFormationChannel,
      'neutron-star formation channel',
    );

    assertExclusiveRemnantDetail(
      evolutionState,
      StellarEvolutionStates.STELLAR_BLACK_HOLE,
      blackHoleFormationChannel,
      'stellar-black-hole formation channel',
    );

    if (
      brownDwarfClass !==
        null
    ) {
      throw new RangeError(
        `${evolutionState.name} assessments cannot carry a brown-dwarf class.`,
      );
    }
  }
}

function assertPositiveFinite(
  value:
    number | null,

  propertyName:
    string,
): asserts value is number {

  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and greater than 0 for stellar-burning branches.`,
    );
  }
}

function assertExclusiveRemnantDetail<T>(
  state:
    StellarEvolutionState,

  requiredState:
    StellarEvolutionState,

  detail:
    T | null,

  detailName:
    string,
): void {

  const isRequiredState =
    state.name ===
    requiredState.name;

  if (
    isRequiredState !==
      (
        detail !==
        null
      )
  ) {
    throw new RangeError(
      `${requiredState.name} assessment/${detailName} mismatch.`,
    );
  }
}
