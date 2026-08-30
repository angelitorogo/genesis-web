import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  type MoonEnvironmentState,
} from './moon-environment-state';

import {
  type MoonOrbitalElements,
} from './moon-orbital-elements';

import {
  type MoonPhysicalProperties,
} from './moon-physical-properties';

import {
  type MoonTidalState,
} from './moon-tidal-state';

/**
 * Point-21.3 individually materialized relevant natural satellite.
 *
 * `moonOrdinal` is a stable local ordinal under the host Planet and is sufficient
 * for deterministic point-21.3 property derivation. It is deliberately not a
 * MoonLocator or MoonSeed. Point 21.4 now attaches a deterministic tidal/spin
 * state without changing the frozen point-21.3 physical/orbital values. Point
 * 21.5 now adds a first-order atmosphere/water/geology environment state without
 * changing frozen 21.3/21.4 sources. Point 21.8 remains responsible for seeds
 * and designations.
 */
export class RelevantMoon {

  constructor(
    readonly hostPlanetOrdinal:
      number,

    readonly hostPlanetLocator:
      BodyLocator,

    readonly hostPlanetSeed:
      BodySeed,

    readonly moonOrdinal:
      number,

    readonly physicalProperties:
      MoonPhysicalProperties,

    readonly orbit:
      MoonOrbitalElements,

    readonly tidalState:
      MoonTidalState,

    readonly environmentState:
      MoonEnvironmentState,
  ) {
    if (
      !Number.isInteger(
        hostPlanetOrdinal,
      ) ||
      hostPlanetOrdinal <=
        0
    ) {
      throw new RangeError(
        'RelevantMoon hostPlanetOrdinal must be a positive integer.',
      );
    }

    if (
      hostPlanetLocator
        .bodyIndex !==
      BigInt(
        hostPlanetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'RelevantMoon must preserve the canonical host Planet BodyLocator.',
      );
    }

    if (
      hostPlanetSeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'RelevantMoon requires the canonical host Planet BodySeed as parent context.',
      );
    }

    if (
      !Number.isInteger(
        moonOrdinal,
      ) ||
      moonOrdinal <=
        0
    ) {
      throw new RangeError(
        'RelevantMoon moonOrdinal must be a positive integer.',
      );
    }

    if (
      physicalProperties
        .hostPlanetOrdinal !==
        hostPlanetOrdinal ||
      physicalProperties
        .moonOrdinal !==
        moonOrdinal ||
      orbit
        .hostPlanetOrdinal !==
        hostPlanetOrdinal ||
      orbit
        .moonOrdinal !==
        moonOrdinal ||
      tidalState
        .hostPlanetOrdinal !==
        hostPlanetOrdinal ||
      tidalState
        .moonOrdinal !==
        moonOrdinal ||
      environmentState
        .hostPlanetOrdinal !==
        hostPlanetOrdinal ||
      environmentState
        .moonOrdinal !==
        moonOrdinal
    ) {
      throw new RangeError(
        'RelevantMoon physical/orbital/tidal/environment products must preserve the exact host/moon ordinals.',
      );
    }


    if (
      !approximatelyEqual(
        tidalState
          .sourceMoonMassEarth,
        physicalProperties
          .massEarth,
      ) ||
      !approximatelyEqual(
        tidalState
          .sourceMoonRadiusEarth,
        physicalProperties
          .radiusEarth,
      ) ||
      !approximatelyEqual(
        tidalState
          .sourceSemiMajorAxisPlanetRadii,
        orbit
          .semiMajorAxisPlanetRadii,
      ) ||
      !approximatelyEqual(
        tidalState
          .sourceSemiMajorAxisKilometers,
        orbit
          .semiMajorAxisKilometers,
      ) ||
      !approximatelyEqual(
        tidalState
          .sourceEccentricity,
        orbit
          .eccentricity,
      ) ||
      !approximatelyEqual(
        tidalState
          .sourceOrbitalPeriodDays,
        orbit
          .orbitalPeriodDays,
      )
    ) {
      throw new RangeError(
        'RelevantMoon tidal state must preserve the exact point-21.3 moon physical/orbital sources.',
      );
    }

    if (
      !approximatelyEqual(
        environmentState
          .sourceMoonMassEarth,
        physicalProperties
          .massEarth,
      ) ||
      !approximatelyEqual(
        environmentState
          .sourceMoonRadiusEarth,
        physicalProperties
          .radiusEarth,
      ) ||
      !approximatelyEqual(
        environmentState
          .sourceMoonMeanDensityGramsPerCubicCentimeter,
        physicalProperties
          .meanDensityGramsPerCubicCentimeter,
      ) ||
      !approximatelyEqual(
        environmentState
          .sourceMoonSurfaceGravityEarth,
        physicalProperties
          .surfaceGravityEarth,
      ) ||
      !approximatelyEqual(
        environmentState
          .sourceTidalHeatingIndex01,
        tidalState
          .tidalHeatingIndex01,
      )
    ) {
      throw new RangeError(
        'RelevantMoon environment state must preserve the exact point-21.3/21.4 moon sources.',
      );
    }
  }

  get massEarth():
    number {

    return this
      .physicalProperties
      .massEarth;
  }

  get radiusEarth():
    number {

    return this
      .physicalProperties
      .radiusEarth;
  }

  get meanDensityGramsPerCubicCentimeter():
    number {

    return this
      .physicalProperties
      .meanDensityGramsPerCubicCentimeter;
  }

  get surfaceGravityEarth():
    number {

    return this
      .physicalProperties
      .surfaceGravityEarth;
  }

  get semiMajorAxisPlanetRadii():
    number {

    return this
      .orbit
      .semiMajorAxisPlanetRadii;
  }

  get orbitalPeriodDays():
    number {

    return this
      .orbit
      .orbitalPeriodDays;
  }

  get tidalHeatingIndex01():
    number {

    return this
      .tidalState
      .tidalHeatingIndex01;
  }

  get tidalLockingIndex01():
    number {

    return this
      .tidalState
      .tidalLockingIndex01;
  }

  get rotationPeriodHours():
    number {

    return this
      .tidalState
      .rotationPeriodHours;
  }

  get isTidallyLocked():
    boolean {

    return this
      .tidalState
      .isTidallyLocked;
  }

  get atmosphereRegime() {
    return this
      .environmentState
      .atmosphereRegime;
  }

  get waterRegime() {
    return this
      .environmentState
      .waterRegime;
  }

  get geologyRegime() {
    return this
      .environmentState
      .geologyRegime;
  }

  get hasAtmosphere():
    boolean {

    return this
      .environmentState
      .hasAtmosphere;
  }

  get hasWater():
    boolean {

    return this
      .environmentState
      .hasWater;
  }

  get hasSubsurfaceOcean():
    boolean {

    return this
      .environmentState
      .hasSubsurfaceOcean;
  }

  get hasSurfaceLiquidWater():
    boolean {

    return this
      .environmentState
      .hasSurfaceLiquidWater;
  }

  get isGeologicallyActive():
    boolean {

    return this
      .environmentState
      .isGeologicallyActive;
  }
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

  return Math.abs(
    left -
    right,
  ) <=
    1e-9 *
    scale;
}
