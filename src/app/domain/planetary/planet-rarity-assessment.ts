import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetType,
} from './planet-type';

import {
  PlanetRarityTrait,
} from './planet-rarity-trait';

export const PLANET_RARITY_V1_PUFFY_MAX_DENSITY_GRAMS_PER_CUBIC_CENTIMETER =
  1;

export const PLANET_RARITY_V1_PUFFY_MIN_ENVELOPE_MASS_FRACTION01 =
  0.10;

export const PLANET_RARITY_V1_ULTRA_DENSE_MIN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER =
  8;

export const PLANET_RARITY_V1_EXTREME_SURFACE_GRAVITY_EARTH =
  3;

export const PLANET_RARITY_V1_RAPID_ROTATION_MAX_HOURS =
  6;

export const PLANET_RARITY_V1_EXTREME_OBLIQUITY_MIN_DEGREES =
  60;

export const PLANET_RARITY_V1_STRONGLY_RETROGRADE_MIN_DEGREES =
  135;

export const PLANET_RARITY_V1_HIGH_ECCENTRICITY_MIN =
  0.30;

export const PLANET_RARITY_V1_EXTREME_INSOLATION_MIN_EARTH =
  1_000;

export const PLANET_RARITY_V1_EXTREME_TIDAL_HEATING_MIN =
  1_000;

export const PLANET_RARITY_V1_MASSIVE_SOLID_MIN_MASS_EARTH =
  8;

export const PLANET_RARITY_V1_MASSIVE_SOLID_MAX_ENVELOPE_MASS_FRACTION01 =
  0.03;

export const PLANET_RARITY_V1_METAL_RICH_MIN_FRACTION_OF_SOLIDS01 =
  0.40;

export const PLANET_RARITY_V1_VOLATILE_RICH_MIN_ICE_BEARING_FRACTION_OF_SOLIDS01 =
  0.60;

export const PLANET_RARITY_V1_EXTREME_BASE_ALBEDO_LOW_MAX =
  0.08;

export const PLANET_RARITY_V1_EXTREME_BASE_ALBEDO_HIGH_MIN =
  0.70;

/**
 * Frozen numerical inputs used by point 19.8 to determine basic rarity traits.
 */
export interface PlanetRaritySourceSnapshot {
  readonly planetType:
    PlanetType;
  readonly massEarth:
    number;
  readonly radiusEarth:
    number;
  readonly densityGramsPerCubicCentimeter:
    number;
  readonly surfaceGravityEarth:
    number;
  readonly envelopeMassFraction01:
    number;
  readonly rotationPeriodHours:
    number;
  readonly axialTiltDegrees:
    number;
  readonly orbitalEccentricity:
    number;
  readonly referenceMeanInsolationEarth:
    number;
  readonly tidalHeatingProxy:
    number;
  readonly metallicCoreFractionOfSolids01:
    number;
  readonly iceBearingFractionOfSolids01:
    number;
  readonly referenceBondAlbedo01:
    number;
  readonly typePhysicallyCoherent:
    boolean;
}

/**
 * Point-19.8 deterministic basic-rarity assessment for one mature Planet.
 *
 * V1 is deliberately diagnostic: it never changes the planet, never creates a
 * rarity seed and never rolls an independent "special" chance. A trait exists
 * only when an already-generated physical quantity reaches an explicitly rare
 * tail threshold. If the point-19.7 type/bulk/composition audit is incoherent,
 * rarity tagging is suppressed rather than celebrating an invalid state.
 */
export class PlanetRarityAssessment {

  readonly traits:
    readonly PlanetRarityTrait[];

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourcePlanetType:
      PlanetType,

    readonly sourceMassEarth:
      number,

    readonly sourceRadiusEarth:
      number,

    readonly sourceDensityGramsPerCubicCentimeter:
      number,

    readonly sourceSurfaceGravityEarth:
      number,

    readonly sourceEnvelopeMassFraction01:
      number,

    readonly sourceRotationPeriodHours:
      number,

    readonly sourceAxialTiltDegrees:
      number,

    readonly sourceOrbitalEccentricity:
      number,

    readonly sourceReferenceMeanInsolationEarth:
      number,

    readonly sourceTidalHeatingProxy:
      number,

    readonly sourceMetallicCoreFractionOfSolids01:
      number,

    readonly sourceIceBearingFractionOfSolids01:
      number,

    readonly sourceReferenceBondAlbedo01:
      number,

    readonly sourceTypePhysicallyCoherent:
      boolean,

    traits:
      readonly PlanetRarityTrait[],
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
        'Point-19.8 rarity assessment must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetRarityAssessment requires a BodySeed.',
      );
    }

    if (
      !Object.values(
        PlanetType,
      ).includes(
        sourcePlanetType,
      )
    ) {
      throw new RangeError(
        'sourcePlanetType must be a known PlanetType.',
      );
    }

    assertPositiveFinite(
      sourceMassEarth,
      'sourceMassEarth',
    );

    assertPositiveFinite(
      sourceRadiusEarth,
      'sourceRadiusEarth',
    );

    assertPositiveFinite(
      sourceDensityGramsPerCubicCentimeter,
      'sourceDensityGramsPerCubicCentimeter',
    );

    assertPositiveFinite(
      sourceSurfaceGravityEarth,
      'sourceSurfaceGravityEarth',
    );

    assertNormalized(
      sourceEnvelopeMassFraction01,
      'sourceEnvelopeMassFraction01',
    );

    assertPositiveFinite(
      sourceRotationPeriodHours,
      'sourceRotationPeriodHours',
    );

    if (
      !Number.isFinite(
        sourceAxialTiltDegrees,
      ) ||
      sourceAxialTiltDegrees <
        0 ||
      sourceAxialTiltDegrees >
        180
    ) {
      throw new RangeError(
        'sourceAxialTiltDegrees must be finite and in [0, 180].',
      );
    }

    if (
      !Number.isFinite(
        sourceOrbitalEccentricity,
      ) ||
      sourceOrbitalEccentricity <
        0 ||
      sourceOrbitalEccentricity >=
        1
    ) {
      throw new RangeError(
        'sourceOrbitalEccentricity must be finite and in [0, 1).',
      );
    }

    assertPositiveFinite(
      sourceReferenceMeanInsolationEarth,
      'sourceReferenceMeanInsolationEarth',
    );

    assertNonNegativeFinite(
      sourceTidalHeatingProxy,
      'sourceTidalHeatingProxy',
    );

    assertNormalized(
      sourceMetallicCoreFractionOfSolids01,
      'sourceMetallicCoreFractionOfSolids01',
    );

    assertNormalized(
      sourceIceBearingFractionOfSolids01,
      'sourceIceBearingFractionOfSolids01',
    );

    assertNormalized(
      sourceReferenceBondAlbedo01,
      'sourceReferenceBondAlbedo01',
    );

    const uniqueTraits =
      new Set(
        traits,
      );

    if (
      uniqueTraits.size !==
      traits.length
    ) {
      throw new RangeError(
        'Point-19.8 rarity traits must be unique.',
      );
    }

    for (
      const trait
      of traits
    ) {
      if (
        !Object.values(
          PlanetRarityTrait,
        ).includes(
          trait,
        )
      ) {
        throw new RangeError(
          'Point-19.8 rarity traits must contain known values only.',
        );
      }
    }

    const expectedTraits =
      planetRarityTraitsForSourcesV1({
        planetType:
          sourcePlanetType,
        massEarth:
          sourceMassEarth,
        radiusEarth:
          sourceRadiusEarth,
        densityGramsPerCubicCentimeter:
          sourceDensityGramsPerCubicCentimeter,
        surfaceGravityEarth:
          sourceSurfaceGravityEarth,
        envelopeMassFraction01:
          sourceEnvelopeMassFraction01,
        rotationPeriodHours:
          sourceRotationPeriodHours,
        axialTiltDegrees:
          sourceAxialTiltDegrees,
        orbitalEccentricity:
          sourceOrbitalEccentricity,
        referenceMeanInsolationEarth:
          sourceReferenceMeanInsolationEarth,
        tidalHeatingProxy:
          sourceTidalHeatingProxy,
        metallicCoreFractionOfSolids01:
          sourceMetallicCoreFractionOfSolids01,
        iceBearingFractionOfSolids01:
          sourceIceBearingFractionOfSolids01,
        referenceBondAlbedo01:
          sourceReferenceBondAlbedo01,
        typePhysicallyCoherent:
          sourceTypePhysicallyCoherent,
      });

    if (
      traits.length !==
        expectedTraits.length ||
      traits.some(
        (
          trait,
          index,
        ) =>
          trait !==
          expectedTraits[index],
      )
    ) {
      throw new RangeError(
        'Point-19.8 rarity traits must exactly match the frozen V1 physical rarity thresholds and order.',
      );
    }

    this.traits =
      Object.freeze([
        ...traits,
      ]);
  }

  get rarityCount():
    number {

    return this
      .traits
      .length;
  }

  get hasRarities():
    boolean {

    return (
      this.rarityCount >
      0
    );
  }

  get isAssessmentEligible():
    boolean {

    return this
      .sourceTypePhysicallyCoherent;
  }

  hasTrait(
    trait:
      PlanetRarityTrait,
  ): boolean {

    return this
      .traits
      .includes(
        trait,
      );
  }
}

export function planetRarityTraitsForSourcesV1(
  sources:
    PlanetRaritySourceSnapshot,
): readonly PlanetRarityTrait[] {

  if (
    !sources.typePhysicallyCoherent
  ) {
    return Object.freeze([]);
  }

  const traits:
    PlanetRarityTrait[] = [];

  if (
    sources.densityGramsPerCubicCentimeter <=
      PLANET_RARITY_V1_PUFFY_MAX_DENSITY_GRAMS_PER_CUBIC_CENTIMETER &&
    sources.envelopeMassFraction01 >=
      PLANET_RARITY_V1_PUFFY_MIN_ENVELOPE_MASS_FRACTION01
  ) {
    traits.push(
      PlanetRarityTrait.PUFFY_LOW_DENSITY,
    );
  }

  if (
    sources.densityGramsPerCubicCentimeter >=
    PLANET_RARITY_V1_ULTRA_DENSE_MIN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER
  ) {
    traits.push(
      PlanetRarityTrait.ULTRA_DENSE,
    );
  }

  if (
    sources.surfaceGravityEarth >=
    PLANET_RARITY_V1_EXTREME_SURFACE_GRAVITY_EARTH
  ) {
    traits.push(
      PlanetRarityTrait.EXTREME_SURFACE_GRAVITY,
    );
  }

  if (
    sources.rotationPeriodHours <=
    PLANET_RARITY_V1_RAPID_ROTATION_MAX_HOURS
  ) {
    traits.push(
      PlanetRarityTrait.RAPID_ROTATOR,
    );
  }

  const alignmentDistanceDegrees =
    Math.min(
      sources.axialTiltDegrees,
      180 -
        sources.axialTiltDegrees,
    );

  if (
    alignmentDistanceDegrees >=
    PLANET_RARITY_V1_EXTREME_OBLIQUITY_MIN_DEGREES
  ) {
    traits.push(
      PlanetRarityTrait.EXTREME_OBLIQUITY,
    );
  }

  if (
    sources.axialTiltDegrees >=
    PLANET_RARITY_V1_STRONGLY_RETROGRADE_MIN_DEGREES
  ) {
    traits.push(
      PlanetRarityTrait.STRONGLY_RETROGRADE_ROTATION,
    );
  }

  if (
    sources.orbitalEccentricity >=
    PLANET_RARITY_V1_HIGH_ECCENTRICITY_MIN
  ) {
    traits.push(
      PlanetRarityTrait.HIGH_ORBITAL_ECCENTRICITY,
    );
  }

  if (
    sources.referenceMeanInsolationEarth >=
    PLANET_RARITY_V1_EXTREME_INSOLATION_MIN_EARTH
  ) {
    traits.push(
      PlanetRarityTrait.EXTREME_IRRADIATION,
    );
  }

  if (
    sources.tidalHeatingProxy >=
    PLANET_RARITY_V1_EXTREME_TIDAL_HEATING_MIN
  ) {
    traits.push(
      PlanetRarityTrait.EXTREME_TIDAL_HEATING,
    );
  }

  if (
    sources.massEarth >=
      PLANET_RARITY_V1_MASSIVE_SOLID_MIN_MASS_EARTH &&
    sources.envelopeMassFraction01 <
      PLANET_RARITY_V1_MASSIVE_SOLID_MAX_ENVELOPE_MASS_FRACTION01
  ) {
    traits.push(
      PlanetRarityTrait.MASSIVE_SOLID_WORLD,
    );
  }

  if (
    sources.metallicCoreFractionOfSolids01 >=
    PLANET_RARITY_V1_METAL_RICH_MIN_FRACTION_OF_SOLIDS01
  ) {
    traits.push(
      PlanetRarityTrait.METAL_RICH_INTERIOR,
    );
  }

  if (
    sources.iceBearingFractionOfSolids01 >=
    PLANET_RARITY_V1_VOLATILE_RICH_MIN_ICE_BEARING_FRACTION_OF_SOLIDS01
  ) {
    traits.push(
      PlanetRarityTrait.VOLATILE_RICH_INTERIOR,
    );
  }

  if (
    sources.referenceBondAlbedo01 <=
      PLANET_RARITY_V1_EXTREME_BASE_ALBEDO_LOW_MAX ||
    sources.referenceBondAlbedo01 >=
      PLANET_RARITY_V1_EXTREME_BASE_ALBEDO_HIGH_MIN
  ) {
    traits.push(
      PlanetRarityTrait.EXTREME_BASE_ALBEDO,
    );
  }

  return Object.freeze(
    traits,
  );
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
      `${propertyName} must be finite and greater than or equal to 0: ${value}.`,
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
      `${propertyName} must be finite and in [0, 1]: ${value}.`,
    );
  }
}
