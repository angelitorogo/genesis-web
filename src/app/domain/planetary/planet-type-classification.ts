import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from './planetary-orbit-habitable-zone-relation';

import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from './planetary-system-habitable-zone-evolution-regime';

import {
  PlanetType,
} from './planet-type';

/**
 * Point-19.4 auditable type classification for one mature Planet.
 *
 * The type is derived from already-frozen point-18 formation/orbit context and
 * point-19.2 bulk physics. The diagnostic source values are intentionally kept
 * beside the classification so later coherence tests can explain why a world
 * entered one broad family without replaying hidden randomness.
 *
 * OCEAN/DESERT/VOLCANIC are coarse physical phenotypes only. They do not assert
 * confirmed liquid surface water, atmospheric aridity or active geology; those
 * detailed contracts belong to phases 20 and later.
 */
export class PlanetTypeClassification {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly planetType:
      PlanetType,

    readonly sourceMassEarth:
      number,

    readonly sourceRadiusEarth:
      number,

    readonly sourceDensityGramsPerCubicCentimeter:
      number,

    readonly sourceEnvelopeMassFraction01:
      number,

    readonly sourceIceBearingSolidFraction01:
      number,

    readonly radiativeHabitableZoneRelation:
      PlanetaryOrbitHabitableZoneRelation,

    readonly stellarEvolutionRegime:
      PlanetarySystemHabitableZoneEvolutionRegime,

    readonly referenceMeanInsolationEarth:
      number,

    readonly tidalHeatingProxy:
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
        'Point-19.4 type classification must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetTypeClassification requires a BodySeed.',
      );
    }

    if (
      !Object.values(
        PlanetType,
      ).includes(
        planetType,
      )
    ) {
      throw new RangeError(
        'planetType must be a known PlanetType.',
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

    assertNormalized(
      sourceEnvelopeMassFraction01,
      'sourceEnvelopeMassFraction01',
    );

    assertNormalized(
      sourceIceBearingSolidFraction01,
      'sourceIceBearingSolidFraction01',
    );

    if (
      !Object.values(
        PlanetaryOrbitHabitableZoneRelation,
      ).includes(
        radiativeHabitableZoneRelation,
      )
    ) {
      throw new RangeError(
        'radiativeHabitableZoneRelation must be a known PlanetaryOrbitHabitableZoneRelation.',
      );
    }

    if (
      !Object.values(
        PlanetarySystemHabitableZoneEvolutionRegime,
      ).includes(
        stellarEvolutionRegime,
      )
    ) {
      throw new RangeError(
        'stellarEvolutionRegime must be a known PlanetarySystemHabitableZoneEvolutionRegime.',
      );
    }

    assertPositiveFinite(
      referenceMeanInsolationEarth,
      'referenceMeanInsolationEarth',
    );

    assertNonNegativeFinite(
      tidalHeatingProxy,
      'tidalHeatingProxy',
    );
  }

  get isGiant():
    boolean {

    return (
      this.planetType ===
        PlanetType.GAS_GIANT ||
      this.planetType ===
        PlanetType.ICE_GIANT
    );
  }

  get isEnvelopeRich():
    boolean {

    return (
      this.planetType ===
        PlanetType.MINI_NEPTUNE ||
      this.isGiant
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
