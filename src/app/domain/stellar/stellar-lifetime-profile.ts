import {
  type StellarEvolutionAssessment,
} from './stellar-evolution-assessment';

import {
  StellarEvolutionState,
} from './stellar-evolution-state';

export const STELLAR_LIFETIME_V1_MAX_AGE_BILLION_YEARS =
  13.8;

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-15.3 generated age and finite stellar-evolution lifetime for one
 * procedurally materialized V1 stellar primary.
 *
 * ageBillionYears is the current age of the object in Gyr and is bounded by the
 * V1 cosmic-age envelope used by the stellar-population model.
 *
 * terminalAgeBillionYears is the age at which the isolated-star phase-14 model
 * reaches its first terminal compact remnant. remainingLifeBillionYears is the
 * time from the current age to that terminal age.
 *
 * Brown dwarfs deliberately expose null terminal/remaining lifetime because V1
 * models their cooling family (L/T/Y) but no finite destruction endpoint.
 * Terminal white-dwarf/neutron-star/stellar-black-hole assessments expose
 * remainingLifeBillionYears = 0: this means the modeled progenitor stellar life
 * has already ended, not that the compact remnant ceases to exist.
 *
 * The associated StellarEvolutionAssessment is retained so consumers can
 * materialize the canonical phase-14 Star without recalculating or guessing a
 * state from the age.
 */
export class StellarLifetimeProfile {

  constructor(
    readonly ageBillionYears:
      number,

    readonly terminalAgeBillionYears:
      number | null,

    readonly remainingLifeBillionYears:
      number | null,

    readonly evolutionAssessment:
      StellarEvolutionAssessment,
  ) {
    if (
      !Number.isFinite(
        ageBillionYears,
      ) ||
      ageBillionYears <
        0 ||
      ageBillionYears >
        STELLAR_LIFETIME_V1_MAX_AGE_BILLION_YEARS
    ) {
      throw new RangeError(
        `ageBillionYears must be finite and in [0, ${STELLAR_LIFETIME_V1_MAX_AGE_BILLION_YEARS}].`,
      );
    }

    if (
      Math.abs(
        evolutionAssessment
          .input
          .ageBillionYears -
        ageBillionYears,
      ) >
      CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'StellarLifetimeProfile age must match its StellarEvolutionAssessment input age.',
      );
    }

    const isBrownDwarf =
      evolutionAssessment
        .evolutionState
        .name ===
      StellarEvolutionState
        .BROWN_DWARF
        .name;

    if (
      isBrownDwarf
    ) {
      if (
        terminalAgeBillionYears !==
          null ||
        remainingLifeBillionYears !==
          null
      ) {
        throw new RangeError(
          'BROWN_DWARF lifetime profiles do not have a finite V1 terminal or remaining lifetime.',
        );
      }

      return;
    }

    assertPositiveFinite(
      terminalAgeBillionYears,
      'terminalAgeBillionYears',
    );

    assertNonNegativeFinite(
      remainingLifeBillionYears,
      'remainingLifeBillionYears',
    );

    const mainSequenceLifetime =
      evolutionAssessment
        .mainSequenceLifetimeBillionYears;

    const postMainSequenceDuration =
      evolutionAssessment
        .postMainSequenceDurationBillionYears;

    if (
      mainSequenceLifetime ===
        null ||
      postMainSequenceDuration ===
        null
    ) {
      throw new RangeError(
        'Stellar-burning lifetime profiles require phase-14 main-sequence and post-main-sequence durations.',
      );
    }

    const expectedTerminalAge =
      mainSequenceLifetime +
      postMainSequenceDuration;

    if (
      !approximatelyEqual(
        terminalAgeBillionYears,
        expectedTerminalAge,
      )
    ) {
      throw new RangeError(
        'terminalAgeBillionYears must equal the phase-14 main-sequence plus post-main-sequence duration.',
      );
    }

    const expectedRemainingLife =
      Math.max(
        0,
        expectedTerminalAge -
          ageBillionYears,
      );

    if (
      !approximatelyEqual(
        remainingLifeBillionYears,
        expectedRemainingLife,
      )
    ) {
      throw new RangeError(
        'remainingLifeBillionYears must equal max(0, terminalAgeBillionYears - ageBillionYears).',
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
      `${propertyName} must be finite and greater than 0.`,
    );
  }
}

function assertNonNegativeFinite(
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
    value <
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and non-negative.`,
    );
  }
}

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        left,
      ),
      Math.abs(
        right,
      ),
    );

  return (
    Math.abs(
      left -
      right,
    ) <=
    CONSISTENCY_TOLERANCE *
      scale
  );
}
