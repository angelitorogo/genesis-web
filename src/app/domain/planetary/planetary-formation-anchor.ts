import {
  ProtoplanetCompositionMixture,
} from './protoplanet-composition-mixture';

/**
 * Point-17.7 formation anchor handed to phase 18.
 *
 * An anchor is not yet a final planet and assemblyRadiusAu is intentionally not
 * a final orbital element. It preserves the physically meaningful endpoint of
 * the 17.4-17.5 formation chain so PlanetarySystemGenerator can later decide
 * final planet count, architecture and orbital elements without regenerating
 * or contradicting the frozen protoplanetary history.
 */
export class PlanetaryFormationAnchor {

  readonly sourceFormationOrdinals:
    readonly number[];

  constructor(
    readonly anchorOrdinal:
      number,

    sourceFormationOrdinals:
      readonly number[],

    readonly assemblyRadiusAu:
      number,

    readonly solidCoreMassEarth:
      number,

    readonly compositionMixture:
      ProtoplanetCompositionMixture,

    readonly consolidationIndex01:
      number,

    readonly envelopeAcquisitionPotential01:
      number,

    readonly volatileRetentionPotential01:
      number,

    readonly dynamicalExcitationIndex01:
      number,

    readonly collisionCount:
      number,
  ) {
    if (
      !Number.isInteger(
        anchorOrdinal,
      ) ||
      anchorOrdinal <=
        0
    ) {
      throw new RangeError(
        'anchorOrdinal must be a positive integer.',
      );
    }

    validateOrdinals(
      sourceFormationOrdinals,
    );

    assertPositiveFinite(
      assemblyRadiusAu,
      'assemblyRadiusAu',
    );

    assertPositiveFinite(
      solidCoreMassEarth,
      'solidCoreMassEarth',
    );

    assertNormalized(
      consolidationIndex01,
      'consolidationIndex01',
    );

    assertNormalized(
      envelopeAcquisitionPotential01,
      'envelopeAcquisitionPotential01',
    );

    assertNormalized(
      volatileRetentionPotential01,
      'volatileRetentionPotential01',
    );

    assertNormalized(
      dynamicalExcitationIndex01,
      'dynamicalExcitationIndex01',
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

    this.sourceFormationOrdinals =
      Object.freeze([
        ...sourceFormationOrdinals,
      ]);
  }

  get hasCollisionHistory():
    boolean {

    return (
      this.collisionCount >
      0
    );
  }

  get isIceBearing():
    boolean {

    return (
      this.compositionMixture
        .iceBearingFraction01 >
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
