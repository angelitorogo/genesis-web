import {
  AsteroidCompositionRegime,
} from './asteroid-composition-regime';

import {
  AsteroidMultiplicityRegime,
} from './asteroid-multiplicity-regime';

import {
  AsteroidStructureRegime,
} from './asteroid-structure-regime';

const FRACTION_TOLERANCE =
  1e-9;

/**
 * Point-22.4 first-order compositional/structural classification for one
 * relevant asteroid.
 *
 * The fractions, density and albedo are coherent V1 proxies for simulation and
 * presentation. They are not laboratory mineralogy. Internal structure and
 * multiplicity are kept independent so, for example, a carbonaceous rubble pile
 * may also be a detached binary.
 */
export class AsteroidTaxonomy {

  constructor(
    readonly compositionRegime:
      AsteroidCompositionRegime,

    readonly structureRegime:
      AsteroidStructureRegime,

    readonly multiplicityRegime:
      AsteroidMultiplicityRegime,

    readonly carbonaceousFraction01:
      number,

    readonly silicateFraction01:
      number,

    readonly metalFraction01:
      number,

    readonly iceFraction01:
      number,

    readonly porosityIndex01:
      number,

    readonly bulkDensityGramsPerCubicCentimeter:
      number,

    readonly geometricAlbedo01:
      number,

    readonly binaryMassRatio01:
      number | null,

    readonly binarySeparationPrimaryRadii:
      number | null,
  ) {
    if (
      !Object.values(
        AsteroidCompositionRegime,
      ).includes(
        compositionRegime,
      ) ||
      !Object.values(
        AsteroidStructureRegime,
      ).includes(
        structureRegime,
      ) ||
      !Object.values(
        AsteroidMultiplicityRegime,
      ).includes(
        multiplicityRegime,
      )
    ) {
      throw new RangeError(
        'AsteroidTaxonomy requires known composition, structure and multiplicity regimes.',
      );
    }

    const fractions = [
      carbonaceousFraction01,
      silicateFraction01,
      metalFraction01,
      iceFraction01,
    ];

    for (
      const fraction
      of fractions
    ) {
      assertUnitInterval(
        fraction,
        'composition fraction',
      );
    }

    const totalFraction =
      fractions.reduce(
        (
          total,
          value,
        ) =>
          total +
          value,
        0,
      );

    if (
      Math.abs(
        totalFraction -
        1,
      ) >
      FRACTION_TOLERANCE
    ) {
      throw new RangeError(
        'AsteroidTaxonomy composition fractions must sum to 1.',
      );
    }

    assertUnitInterval(
      porosityIndex01,
      'porosityIndex01',
    );

    if (
      !Number.isFinite(
        bulkDensityGramsPerCubicCentimeter,
      ) ||
      bulkDensityGramsPerCubicCentimeter <=
        0
    ) {
      throw new RangeError(
        'bulkDensityGramsPerCubicCentimeter must be positive and finite.',
      );
    }

    assertUnitInterval(
      geometricAlbedo01,
      'geometricAlbedo01',
    );

    const isDetachedBinary =
      multiplicityRegime ===
      AsteroidMultiplicityRegime.BINARY;

    if (
      isDetachedBinary
    ) {
      if (
        binaryMassRatio01 ===
          null ||
        binarySeparationPrimaryRadii ===
          null ||
        !Number.isFinite(
          binaryMassRatio01,
        ) ||
        binaryMassRatio01 <=
          0 ||
        binaryMassRatio01 >
          1 ||
        !Number.isFinite(
          binarySeparationPrimaryRadii,
        ) ||
        binarySeparationPrimaryRadii <=
          1
      ) {
        throw new RangeError(
          'Detached binary asteroids require a valid mass ratio and separation above one primary radius.',
        );
      }
    } else if (
      binaryMassRatio01 !==
        null ||
      binarySeparationPrimaryRadii !==
        null
    ) {
      throw new RangeError(
        'Only detached BINARY asteroids may expose detached-companion parameters.',
      );
    }
  }

  get isRubblePile():
    boolean {

    return (
      this.structureRegime ===
      AsteroidStructureRegime.RUBBLE_PILE
    );
  }

  get isContactBinary():
    boolean {

    return (
      this.multiplicityRegime ===
      AsteroidMultiplicityRegime.CONTACT_BINARY
    );
  }

  get isDetachedBinary():
    boolean {

    return (
      this.multiplicityRegime ===
      AsteroidMultiplicityRegime.BINARY
    );
  }

  get isBinaryLike():
    boolean {

    return (
      this.isContactBinary ||
      this.isDetachedBinary
    );
  }

  get isIceBearing():
    boolean {

    return (
      this.iceFraction01 >=
      0.15
    );
  }

  get isMetalRich():
    boolean {

    return (
      this.metalFraction01 >=
      0.5
    );
  }
}

function assertUnitInterval(
  value:
    number,

  label:
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
      `${label} must be finite in [0, 1].`,
    );
  }
}
