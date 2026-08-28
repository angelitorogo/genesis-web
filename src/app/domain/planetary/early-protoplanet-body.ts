import {
  ProtoplanetCompositionMixture,
} from './protoplanet-composition-mixture';

import {
  ProtoplanetMigrationDirection,
} from './protoplanet-migration-direction';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-17.5 surviving early body after the simplified migration/collision
 * pass.
 *
 * solidMassEarth contains solids only. V1 does not yet accrete disk gas or
 * eject material. sourceFormationOrdinals trace the survivor back to the
 * frozen point-17.4 candidates that were perfectly merged into it.
 */
export class EarlyProtoplanetBody {

  readonly sourceFormationOrdinals:
    readonly number[];

  constructor(
    sourceFormationOrdinals:
      readonly number[],

    readonly formationMassWeightedRadiusAu:
      number,

    readonly orbitalRadiusAu:
      number,

    readonly solidMassEarth:
      number,

    readonly compositionMixture:
      ProtoplanetCompositionMixture,

    readonly growthPotential01:
      number,

    readonly gasAccretionPotential01:
      number,

    readonly migrationDirection:
      ProtoplanetMigrationDirection,

    readonly migrationStrength01:
      number,

    readonly collisionCount:
      number,
  ) {
    validateOrdinals(
      sourceFormationOrdinals,
    );

    assertPositiveFinite(
      formationMassWeightedRadiusAu,
      'formationMassWeightedRadiusAu',
    );

    assertPositiveFinite(
      orbitalRadiusAu,
      'orbitalRadiusAu',
    );

    assertPositiveFinite(
      solidMassEarth,
      'solidMassEarth',
    );

    assertNormalized(
      growthPotential01,
      'growthPotential01',
    );

    assertNormalized(
      gasAccretionPotential01,
      'gasAccretionPotential01',
    );

    if (
      !Object.values(
        ProtoplanetMigrationDirection,
      ).includes(
        migrationDirection,
      )
    ) {
      throw new RangeError(
        'migrationDirection must be a known ProtoplanetMigrationDirection.',
      );
    }

    assertNormalized(
      migrationStrength01,
      'migrationStrength01',
    );

    if (
      !Number.isInteger(
        collisionCount,
      ) ||
      collisionCount <
        0 ||
      collisionCount !==
        sourceFormationOrdinals.length -
          1
    ) {
      throw new RangeError(
        'collisionCount must equal sourceFormationOrdinals.length - 1.',
      );
    }

    const displacement =
      orbitalRadiusAu -
      formationMassWeightedRadiusAu;

    if (
      Math.abs(
        displacement,
      ) <=
      CONSISTENCY_TOLERANCE
    ) {
      if (
        migrationDirection !==
          ProtoplanetMigrationDirection.NONE ||
        migrationStrength01 >
          CONSISTENCY_TOLERANCE
      ) {
        throw new RangeError(
          'A body without net radial displacement must use NONE migration with zero strength.',
        );
      }
    } else if (
      displacement <
      0
    ) {
      if (
        migrationDirection !==
        ProtoplanetMigrationDirection.INWARD
      ) {
        throw new RangeError(
          'An inward-displaced body must use INWARD migration.',
        );
      }
    } else if (
      migrationDirection !==
      ProtoplanetMigrationDirection.OUTWARD
    ) {
      throw new RangeError(
        'An outward-displaced body must use OUTWARD migration.',
      );
    }

    this.sourceFormationOrdinals =
      Object.freeze([
        ...sourceFormationOrdinals,
      ]);
  }

  get hasMigrated():
    boolean {

    return (
      this.migrationDirection !==
      ProtoplanetMigrationDirection.NONE
    );
  }

  get hasCollided():
    boolean {

    return (
      this.collisionCount >
      0
    );
  }
}

function validateOrdinals(
  ordinals:
    readonly number[],
): void {

  if (
    ordinals.length ===
    0
  ) {
    throw new RangeError(
      'At least one source formation ordinal is required.',
    );
  }

  let previous =
    0;

  for (
    const ordinal
    of ordinals
  ) {
    if (
      !Number.isInteger(
        ordinal,
      ) ||
      ordinal <=
        previous
    ) {
      throw new RangeError(
        'sourceFormationOrdinals must contain unique positive integers in ascending order.',
      );
    }

    previous =
      ordinal;
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
      `${propertyName} must be finite and greater than 0: ${value}.`,
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
      `${propertyName} must be finite and in range [0, 1]: ${value}.`,
    );
  }
}
