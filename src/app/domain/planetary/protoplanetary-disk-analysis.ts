import {
  ProtoplanetaryDiskStage,
} from './protoplanetary-disk-stage';

import {
  StellarYouthStage,
} from '../stellar/stellar-youth-stage';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-17.6 scientific readout produced by ANALYZE DISK.
 *
 * This is an observation-facing summary of the already-frozen 17.1-17.5
 * formation Ground Truth. It deliberately does not create mature planets,
 * orbital eccentricities/inclinations, resonances or a second formation model.
 */
export class ProtoplanetaryDiskAnalysis {

  constructor(
    readonly stellarYouthStage:
      StellarYouthStage,

    readonly diskStage:
      ProtoplanetaryDiskStage,

    readonly diskAgeMillionYears:
      number,

    readonly diskMassSolar:
      number,

    readonly innerRadiusAu:
      number,

    readonly characteristicRadiusAu:
      number,

    readonly outerRadiusAu:
      number,

    readonly gasMassFraction01:
      number,

    readonly dustMassFraction01:
      number,

    readonly gapCount:
      number,

    readonly condensationRegionCount:
      number,

    readonly waterSnowLineRadiusAu:
      number | null,

    readonly initialCandidateCount:
      number,

    readonly candidateSolidMassEarth:
      number,

    readonly survivingBodyCount:
      number,

    readonly migratedBodyCount:
      number,

    readonly collisionCount:
      number,
  ) {
    if (
      !StellarYouthStage
        .values
        .includes(
          stellarYouthStage,
        )
    ) {
      throw new RangeError(
        'stellarYouthStage must be a canonical StellarYouthStage.',
      );
    }

    if (
      !ProtoplanetaryDiskStage
        .values
        .includes(
          diskStage,
        )
    ) {
      throw new RangeError(
        'diskStage must be a canonical ProtoplanetaryDiskStage.',
      );
    }

    assertNonNegativeFinite(
      diskAgeMillionYears,
      'diskAgeMillionYears',
    );

    assertPositiveFinite(
      diskMassSolar,
      'diskMassSolar',
    );

    assertPositiveFinite(
      innerRadiusAu,
      'innerRadiusAu',
    );

    assertPositiveFinite(
      characteristicRadiusAu,
      'characteristicRadiusAu',
    );

    assertPositiveFinite(
      outerRadiusAu,
      'outerRadiusAu',
    );

    if (
      !(
        innerRadiusAu <
          characteristicRadiusAu &&
        characteristicRadiusAu <
          outerRadiusAu
      )
    ) {
      throw new RangeError(
        'Disk radii must satisfy innerRadiusAu < characteristicRadiusAu < outerRadiusAu.',
      );
    }

    assertNormalized(
      gasMassFraction01,
      'gasMassFraction01',
    );

    assertNormalized(
      dustMassFraction01,
      'dustMassFraction01',
    );

    if (
      Math.abs(
        gasMassFraction01 +
          dustMassFraction01 -
          1,
      ) >
      CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Gas and dust mass fractions must sum to 1.',
      );
    }

    assertNonNegativeInteger(
      gapCount,
      'gapCount',
    );

    assertPositiveInteger(
      condensationRegionCount,
      'condensationRegionCount',
    );

    if (
      waterSnowLineRadiusAu !==
        null
    ) {
      assertPositiveFinite(
        waterSnowLineRadiusAu,
        'waterSnowLineRadiusAu',
      );

      if (
        waterSnowLineRadiusAu <
          innerRadiusAu -
            CONSISTENCY_TOLERANCE ||
        waterSnowLineRadiusAu >
          outerRadiusAu +
            CONSISTENCY_TOLERANCE
      ) {
        throw new RangeError(
          'waterSnowLineRadiusAu must remain inside the disk envelope.',
        );
      }
    }

    assertNonNegativeInteger(
      initialCandidateCount,
      'initialCandidateCount',
    );

    assertNonNegativeFinite(
      candidateSolidMassEarth,
      'candidateSolidMassEarth',
    );

    assertNonNegativeInteger(
      survivingBodyCount,
      'survivingBodyCount',
    );

    assertNonNegativeInteger(
      migratedBodyCount,
      'migratedBodyCount',
    );

    assertNonNegativeInteger(
      collisionCount,
      'collisionCount',
    );

    if (
      survivingBodyCount >
        initialCandidateCount ||
      migratedBodyCount >
        survivingBodyCount ||
      collisionCount !==
        initialCandidateCount -
          survivingBodyCount
    ) {
      throw new RangeError(
        'Point-17.6 candidate/survivor/migration/collision counts are inconsistent with the frozen 17.4-17.5 population.',
      );
    }

    if (
      initialCandidateCount ===
        0 &&
      candidateSolidMassEarth >
        CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'An empty candidate population cannot expose positive candidate solid mass.',
      );
    }
  }

  get hasGaps():
    boolean {

    return this.gapCount >
      0;
  }

  get hasCandidatePopulation():
    boolean {

    return this.initialCandidateCount >
      0;
  }

  get hasEarlyMigration():
    boolean {

    return this.migratedBodyCount >
      0;
  }

  get hasEarlyCollisions():
    boolean {

    return this.collisionCount >
      0;
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
    number,

  propertyName:
    string,
): void {

  if (
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

function assertNonNegativeInteger(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isInteger(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      `${propertyName} must be a non-negative integer.`,
    );
  }
}

function assertPositiveInteger(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isInteger(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be a positive integer.`,
    );
  }
}
