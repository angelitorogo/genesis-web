import {
  StellarSystemMultiplicity,
} from '../stellar/stellar-system-multiplicity';

const BOUNDARY_TOLERANCE =
  1e-12;

/**
 * Point-16.5 dynamical circumbinary-planet regime.
 *
 * OPEN_OUTER applies to an isolated A-B binary: V1 defines the dynamically
 * conservative inner edge but no artificial outer cutoff.
 *
 * TERTIARY_BOUNDED applies to a hierarchical triple where C leaves a finite
 * stable annulus around the inner A-B pair.
 *
 * DYNAMICALLY_EXCLUDED applies to a triple where the conservative outer limit
 * imposed by C falls at or inside the conservative circumbinary inner edge.
 */
export enum CircumbinaryPlanetCompatibilityRegime {
  OPEN_OUTER =
    'OPEN_OUTER',

  TERTIARY_BOUNDED =
    'TERTIARY_BOUNDED',

  DYNAMICALLY_EXCLUDED =
    'DYNAMICALLY_EXCLUDED',
}

/**
 * Dynamical point-16.5 compatibility envelope for P-type planets orbiting the
 * A-B barycentre.
 *
 * This is not a planet catalogue and does not assert that planets formed or
 * survived stellar evolution. It only describes the simplified coplanar V1
 * interval in which a circumbinary test-particle orbit is permitted by the
 * frozen stellar architecture. Habitability is deliberately deferred to 16.6.
 */
export class CircumbinaryPlanetCompatibility {

  constructor(
    readonly hostMultiplicity:
      StellarSystemMultiplicity,

    readonly regime:
      CircumbinaryPlanetCompatibilityRegime,

    readonly minimumStableSemiMajorAxisAu:
      number,

    readonly maximumStableSemiMajorAxisAu:
      number | null,

    readonly referenceMinimumPeriodYears:
      number,

    readonly referenceMaximumPeriodYears:
      number | null,

    readonly binaryMassFraction:
      number,

    readonly tertiaryMassFraction:
      number | null,
  ) {
    if (
      hostMultiplicity !==
        StellarSystemMultiplicity.BINARY &&
      hostMultiplicity !==
        StellarSystemMultiplicity.TRIPLE
    ) {
      throw new RangeError(
        'Circumbinary planet compatibility is defined only for BINARY or TRIPLE stellar systems.',
      );
    }

    assertPositiveFinite(
      minimumStableSemiMajorAxisAu,
      'minimumStableSemiMajorAxisAu',
    );

    assertPositiveFinite(
      referenceMinimumPeriodYears,
      'referenceMinimumPeriodYears',
    );

    assertMassFraction(
      binaryMassFraction,
      'binaryMassFraction',
    );

    if (
      hostMultiplicity ===
      StellarSystemMultiplicity.BINARY
    ) {
      if (
        regime !==
          CircumbinaryPlanetCompatibilityRegime.OPEN_OUTER ||
        maximumStableSemiMajorAxisAu !==
          null ||
        referenceMaximumPeriodYears !==
          null ||
        tertiaryMassFraction !==
          null
      ) {
        throw new RangeError(
          'BINARY circumbinary compatibility must be OPEN_OUTER with no tertiary/outer cutoff.',
        );
      }

      return;
    }

    if (
      maximumStableSemiMajorAxisAu ===
        null ||
      referenceMaximumPeriodYears ===
        null ||
      tertiaryMassFraction ===
        null
    ) {
      throw new RangeError(
        'TRIPLE circumbinary compatibility requires a finite C-imposed outer boundary.',
      );
    }

    assertPositiveFinite(
      maximumStableSemiMajorAxisAu,
      'maximumStableSemiMajorAxisAu',
    );

    assertPositiveFinite(
      referenceMaximumPeriodYears,
      'referenceMaximumPeriodYears',
    );

    assertMassFraction(
      tertiaryMassFraction,
      'tertiaryMassFraction',
    );

    const scale =
      Math.max(
        1,
        minimumStableSemiMajorAxisAu,
        maximumStableSemiMajorAxisAu,
      );

    const hasPositiveAnnulus =
      maximumStableSemiMajorAxisAu -
        minimumStableSemiMajorAxisAu >
      BOUNDARY_TOLERANCE *
        scale;

    if (
      regime ===
        CircumbinaryPlanetCompatibilityRegime.TERTIARY_BOUNDED &&
      !hasPositiveAnnulus
    ) {
      throw new RangeError(
        'TERTIARY_BOUNDED circumbinary compatibility requires maximumStableSemiMajorAxisAu > minimumStableSemiMajorAxisAu.',
      );
    }

    if (
      regime ===
        CircumbinaryPlanetCompatibilityRegime.DYNAMICALLY_EXCLUDED &&
      hasPositiveAnnulus
    ) {
      throw new RangeError(
        'DYNAMICALLY_EXCLUDED circumbinary compatibility cannot contain a positive stable annulus.',
      );
    }

    if (
      regime !==
        CircumbinaryPlanetCompatibilityRegime.TERTIARY_BOUNDED &&
      regime !==
        CircumbinaryPlanetCompatibilityRegime.DYNAMICALLY_EXCLUDED
    ) {
      throw new RangeError(
        `Unsupported TRIPLE circumbinary compatibility regime: ${String(regime)}.`,
      );
    }
  }

  get isCompatible():
    boolean {

    return this.regime !==
      CircumbinaryPlanetCompatibilityRegime.DYNAMICALLY_EXCLUDED;
  }

  get isOuterBounded():
    boolean {

    return this
      .maximumStableSemiMajorAxisAu !==
      null;
  }

  get stableAnnulusWidthAu():
    number | null {

    if (
      this.maximumStableSemiMajorAxisAu ===
      null
    ) {
      return null;
    }

    return Math.max(
      0,
      this.maximumStableSemiMajorAxisAu -
        this.minimumStableSemiMajorAxisAu,
    );
  }

  get stableSpanRatio():
    number | null {

    if (
      this.maximumStableSemiMajorAxisAu ===
      null
    ) {
      return null;
    }

    return (
      this.maximumStableSemiMajorAxisAu /
      this.minimumStableSemiMajorAxisAu
    );
  }

  containsSemiMajorAxisAu(
    semiMajorAxisAu:
      number,
  ): boolean {

    if (
      !Number.isFinite(
        semiMajorAxisAu,
      ) ||
      semiMajorAxisAu <=
        0 ||
      semiMajorAxisAu <
        this.minimumStableSemiMajorAxisAu
    ) {
      return false;
    }

    if (
      this.maximumStableSemiMajorAxisAu !==
        null &&
      semiMajorAxisAu >
        this.maximumStableSemiMajorAxisAu
    ) {
      return false;
    }

    return this.isCompatible;
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

function assertMassFraction(
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
      0 ||
    value >
      0.5
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in range (0, 0.5]: ${value}.`,
    );
  }
}
