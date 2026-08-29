import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-19.5 approximate internal mass budget of one mature Planet.
 *
 * V1 separates the already-frozen total mass into five coarse material buckets:
 * a metal-rich differentiated core, silicate interior, condensed ices,
 * volatile-rich condensed/interior material and the accreted gaseous envelope.
 *
 * The buckets are deliberately mass budgets rather than radial shell radii,
 * mineralogy, phase diagrams, atmospheric chemistry or surface reservoirs.
 * Those more detailed realizations belong to later roadmap phases. In
 * particular, condensedIceMassEarth does not assert exposed surface ice or
 * liquid water and volatileRichInteriorMassEarth is not an atmosphere.
 */
export class PlanetInternalComposition {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourceSolidMassEarth:
      number,

    readonly sourceEnvelopeMassEarth:
      number,

    readonly sourceRefractoryRichFraction01:
      number,

    readonly sourceRockyFraction01:
      number,

    readonly sourceIceRichFraction01:
      number,

    readonly sourceVolatileRichFraction01:
      number,

    readonly metallicCoreMassEarth:
      number,

    readonly silicateInteriorMassEarth:
      number,

    readonly condensedIceMassEarth:
      number,

    readonly volatileRichInteriorMassEarth:
      number,

    readonly gaseousEnvelopeMassEarth:
      number,
  ) {
    if (
      !Number.isInteger(
        planetOrdinal,
      ) ||
      planetOrdinal <=
        0
    ) {
      throw new RangeError(
        'planetOrdinal must be a positive integer.',
      );
    }

    if (
      bodyLocator.bodyIndex !==
      BigInt(
        planetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'Point-19.5 internal composition must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetInternalComposition requires a BodySeed.',
      );
    }

    assertPositiveFinite(
      sourceSolidMassEarth,
      'sourceSolidMassEarth',
    );

    assertNonNegativeFinite(
      sourceEnvelopeMassEarth,
      'sourceEnvelopeMassEarth',
    );

    const sourceFractions = [
      sourceRefractoryRichFraction01,
      sourceRockyFraction01,
      sourceIceRichFraction01,
      sourceVolatileRichFraction01,
    ];

    for (
      const fraction
      of sourceFractions
    ) {
      assertNormalized(
        fraction,
        'source composition fraction',
      );
    }

    if (
      !approximatelyEqual(
        sum(
          sourceFractions,
        ),
        1,
      )
    ) {
      throw new RangeError(
        'Point-19.5 source composition fractions must sum to 1.',
      );
    }

    const solidComponentMasses = [
      metallicCoreMassEarth,
      silicateInteriorMassEarth,
      condensedIceMassEarth,
      volatileRichInteriorMassEarth,
    ];

    for (
      const componentMass
      of solidComponentMasses
    ) {
      assertNonNegativeFinite(
        componentMass,
        'solid internal component mass',
      );
    }

    assertNonNegativeFinite(
      gaseousEnvelopeMassEarth,
      'gaseousEnvelopeMassEarth',
    );

    if (
      !approximatelyEqual(
        sum(
          solidComponentMasses,
        ),
        sourceSolidMassEarth,
      )
    ) {
      throw new RangeError(
        'Point-19.5 metal, silicate, ice and volatile-rich interior masses must conserve the point-19.2 solid mass.',
      );
    }

    if (
      !approximatelyEqual(
        gaseousEnvelopeMassEarth,
        sourceEnvelopeMassEarth,
      )
    ) {
      throw new RangeError(
        'Point-19.5 gaseous-envelope mass must preserve the exact point-19.2 accreted envelope mass.',
      );
    }
  }

  get totalMassEarth():
    number {

    return (
      this.sourceSolidMassEarth +
      this.sourceEnvelopeMassEarth
    );
  }

  get solidInteriorMassEarth():
    number {

    return this
      .sourceSolidMassEarth;
  }

  get iceBearingInteriorMassEarth():
    number {

    return (
      this.condensedIceMassEarth +
      this.volatileRichInteriorMassEarth
    );
  }

  get metallicCoreMassFraction01():
    number {

    return this
      .metallicCoreMassEarth /
      this
        .totalMassEarth;
  }

  get silicateInteriorMassFraction01():
    number {

    return this
      .silicateInteriorMassEarth /
      this
        .totalMassEarth;
  }

  get condensedIceMassFraction01():
    number {

    return this
      .condensedIceMassEarth /
      this
        .totalMassEarth;
  }

  get volatileRichInteriorMassFraction01():
    number {

    return this
      .volatileRichInteriorMassEarth /
      this
        .totalMassEarth;
  }

  get gaseousEnvelopeMassFraction01():
    number {

    return this
      .gaseousEnvelopeMassEarth /
      this
        .totalMassEarth;
  }

  get solidMassFraction01():
    number {

    return this
      .sourceSolidMassEarth /
      this
        .totalMassEarth;
  }

  get iceBearingFractionOfSolids01():
    number {

    return this
      .iceBearingInteriorMassEarth /
      this
        .sourceSolidMassEarth;
  }

  get sourceIceBearingFraction01():
    number {

    return (
      this.sourceIceRichFraction01 +
      this.sourceVolatileRichFraction01
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
      `${propertyName} must be finite and greater than 0: ${value}.`,
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
      `${propertyName} must be finite and non-negative: ${value}.`,
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

function sum(
  values:
    readonly number[],
): number {

  return values.reduce(
    (
      total,
      value,
    ) =>
      total +
      value,
    0,
  );
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
