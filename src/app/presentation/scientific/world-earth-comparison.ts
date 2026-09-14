export interface WorldEarthComparisonInput {
  readonly worldLabel:
    string;

  readonly massEarth:
    number;

  readonly radiusEarth:
    number;

  readonly densityGramsPerCubicCentimeter:
    number;

  readonly surfaceGravityEarth:
    number;
}

export interface WorldEarthComparisonModel {
  readonly worldLabel:
    string;

  readonly massEarth:
    number;

  readonly radiusEarth:
    number;

  readonly densityEarth:
    number;

  readonly surfaceGravityEarth:
    number;

  readonly surfaceAreaEarth:
    number;

  readonly volumeEarth:
    number;

  readonly earthDiameterPercent:
    number;

  readonly worldDiameterPercent:
    number;
}

const EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER =
  5.514;

/**
 * Point-26.9 presentation-only comparison against Earth.
 *
 * All world properties are already-resolved scientific values. This assembler
 * only computes dimensionless ratios and the normalized linear diameters used
 * by the fiche visualization; it never regenerates physical state.
 */
export class WorldEarthComparisonAssembler {

  private constructor() {}

  static build(
    input:
      WorldEarthComparisonInput,
  ): WorldEarthComparisonModel {

    assertLabel(
      input.worldLabel,
    );
    assertPositiveFinite(
      input.massEarth,
      'massEarth',
    );
    assertPositiveFinite(
      input.radiusEarth,
      'radiusEarth',
    );
    assertPositiveFinite(
      input.densityGramsPerCubicCentimeter,
      'densityGramsPerCubicCentimeter',
    );
    assertPositiveFinite(
      input.surfaceGravityEarth,
      'surfaceGravityEarth',
    );

    const largestRadiusEarth =
      Math.max(
        1,
        input.radiusEarth,
      );

    return Object.freeze({
      worldLabel:
        input.worldLabel,
      massEarth:
        input.massEarth,
      radiusEarth:
        input.radiusEarth,
      densityEarth:
        input.densityGramsPerCubicCentimeter /
        EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
      surfaceGravityEarth:
        input.surfaceGravityEarth,
      surfaceAreaEarth:
        input.radiusEarth ** 2,
      volumeEarth:
        input.radiusEarth ** 3,
      earthDiameterPercent:
        100 /
        largestRadiusEarth,
      worldDiameterPercent:
        100 *
        input.radiusEarth /
        largestRadiusEarth,
    });
  }
}

function assertLabel(
  value:
    string,
): void {

  if (
    value.trim().length ===
      0
  ) {
    throw new RangeError(
      'worldLabel must be non-empty.',
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  label:
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
      `${label} must be positive and finite.`,
    );
  }
}
