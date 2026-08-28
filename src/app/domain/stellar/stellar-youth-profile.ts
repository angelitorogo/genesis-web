import {
  StellarYouthStage,
} from './stellar-youth-stage';

const RANGE_TOLERANCE =
  1e-9;

/**
 * Point-17.1 deterministic early-formation/youth overlay for one stellar or
 * substellar component.
 *
 * The profile does not replace the frozen point-15.1 reference mass/radius/
 * luminosity and does not rewrite the phase-14 StellarEvolutionState. Instead,
 * referenceRadiusMultiplier and referenceLuminosityMultiplier describe a
 * simplified early-age overlay that later phase-17 disk/formation models can
 * consume without mutating the canonical star.
 *
 * No protoplanetary disk, dust/gas inventory, condensation region or planet is
 * materialized here; those remain points 17.2+.
 */
export class StellarYouthProfile {

  constructor(
    readonly stage:
      StellarYouthStage,

    readonly ageMillionYears:
      number,

    readonly protostellarUpperAgeMillionYears:
      number | null,

    readonly preMainSequenceUpperAgeMillionYears:
      number | null,

    readonly youthUpperAgeMillionYears:
      number,

    readonly stageProgress01:
      number,

    readonly referenceRadiusMultiplier:
      number,

    readonly referenceLuminosityMultiplier:
      number,

    readonly accretionActivityIndex:
      number,
  ) {
    assertNonNegativeFinite(
      ageMillionYears,
      'ageMillionYears',
    );

    assertPositiveFinite(
      youthUpperAgeMillionYears,
      'youthUpperAgeMillionYears',
    );

    if (
      ageMillionYears -
        youthUpperAgeMillionYears >
      RANGE_TOLERANCE
    ) {
      throw new RangeError(
        'StellarYouthProfile age cannot exceed its youthUpperAgeMillionYears.',
      );
    }

    assertNormalized(
      stageProgress01,
      'stageProgress01',
    );

    assertAtLeastOneFinite(
      referenceRadiusMultiplier,
      'referenceRadiusMultiplier',
    );

    assertAtLeastOneFinite(
      referenceLuminosityMultiplier,
      'referenceLuminosityMultiplier',
    );

    assertNormalized(
      accretionActivityIndex,
      'accretionActivityIndex',
    );

    if (
      stage ===
      StellarYouthStage.YOUNG_BROWN_DWARF
    ) {
      if (
        protostellarUpperAgeMillionYears !==
          null ||
        preMainSequenceUpperAgeMillionYears !==
          null
      ) {
        throw new RangeError(
          'YOUNG_BROWN_DWARF profiles cannot expose stellar protostellar/pre-main-sequence cutoffs in V1.',
        );
      }

      return;
    }

    assertPositiveFinite(
      protostellarUpperAgeMillionYears,
      'protostellarUpperAgeMillionYears',
    );

    assertPositiveFinite(
      preMainSequenceUpperAgeMillionYears,
      'preMainSequenceUpperAgeMillionYears',
    );

    if (
      preMainSequenceUpperAgeMillionYears +
        RANGE_TOLERANCE <
      protostellarUpperAgeMillionYears
    ) {
      throw new RangeError(
        'preMainSequenceUpperAgeMillionYears cannot precede the protostellar cutoff.',
      );
    }

    if (
      youthUpperAgeMillionYears +
        RANGE_TOLERANCE <
      preMainSequenceUpperAgeMillionYears
    ) {
      throw new RangeError(
        'youthUpperAgeMillionYears cannot precede the pre-main-sequence cutoff.',
      );
    }

    if (
      stage ===
      StellarYouthStage.PROTOSTAR
    ) {
      if (
        ageMillionYears -
          protostellarUpperAgeMillionYears >
        RANGE_TOLERANCE
      ) {
        throw new RangeError(
          'PROTOSTAR age must lie inside the protostellar interval.',
        );
      }

      return;
    }

    if (
      stage ===
      StellarYouthStage.PRE_MAIN_SEQUENCE
    ) {
      if (
        ageMillionYears <=
          protostellarUpperAgeMillionYears ||
        ageMillionYears -
          preMainSequenceUpperAgeMillionYears >
        RANGE_TOLERANCE
      ) {
        throw new RangeError(
          'PRE_MAIN_SEQUENCE age must lie after the protostellar interval and before main-sequence arrival.',
        );
      }

      return;
    }

    if (
      stage ===
      StellarYouthStage.YOUNG_STAR
    ) {
      if (
        ageMillionYears <=
          preMainSequenceUpperAgeMillionYears ||
        ageMillionYears -
          youthUpperAgeMillionYears >
        RANGE_TOLERANCE
      ) {
        throw new RangeError(
          'YOUNG_STAR age must lie after pre-main-sequence contraction and inside the V1 youth interval.',
        );
      }

      return;
    }

    throw new RangeError(
      `Unsupported StellarYouthStage: ${stage.name}.`,
    );
  }

  get isProtostar():
    boolean {

    return (
      this.stage ===
      StellarYouthStage.PROTOSTAR
    );
  }

  get isPreMainSequence():
    boolean {

    return (
      this.stage ===
      StellarYouthStage.PRE_MAIN_SEQUENCE
    );
  }

  get isYoungMainSequenceStar():
    boolean {

    return (
      this.stage ===
      StellarYouthStage.YOUNG_STAR
    );
  }

  get isYoungBrownDwarf():
    boolean {

    return (
      this.stage ===
      StellarYouthStage.YOUNG_BROWN_DWARF
    );
  }
}

function assertNonNegativeFinite(
  value:
    number,

  propertyName:
    string,
): void {

  if (
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

function assertAtLeastOneFinite(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and at least 1.`,
    );
  }
}

function assertNormalized(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in [0, 1].`,
    );
  }
}
