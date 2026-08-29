import {
  type BodyLocator,
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  type PlanetaryArchitectureSlot,
} from './planetary-architecture-slot';

import {
  type PlanetaryDesignation,
} from './planetary-designation';

import {
  type PlanetaryOrbitHabitableZoneClassification,
} from './planetary-orbit-habitable-zone-classification';

import {
  type PlanetPhysicalProperties,
} from './planet-physical-properties';

import {
  type PlanetaryOrbitalElements,
} from './planetary-orbital-elements';

import {
  type PlanetaryOrbitalPeriod,
} from './planetary-orbital-period';

import {
  type PlanetRotationProperties,
} from './planet-rotation-properties';

import {
  type PlanetarySystem,
} from './planetary-system';

import {
  type PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

/**
 * Point-19.1 root domain entity for one mature planet.
 *
 * Phase 18 already froze the body's identity, formation lineage, orbital
 * geometry, period, system-level stability context, habitable-zone relation and
 * designation. Point 19.1 deliberately does not regenerate or copy any of those
 * facts: it binds the exact frozen phase-18 projections into one Planet boundary
 * that later point-19 generators can enrich with physical properties.
 *
 * No new locator or seed level exists here. BodyLocator/BodySeed remain the
 * canonical identity of the planet. Point 19.2 adds one coherent bulk-physical
 * state (mass/radius/density/gravity), and point 19.3 adds sidereal rotation,
 * apparent solar-day length and axial tilt without changing any frozen earlier
 * product. Planet type, internal composition, albedo/surface and rarity flags
 * remain absent until points 19.4..19.8.
 */
export class Planet {

  constructor(
    readonly hostPlanetarySystem:
      PlanetarySystem,

    readonly planetOrdinal:
      number,

    readonly architectureSlot:
      PlanetaryArchitectureSlot,

    readonly orbit:
      PlanetaryOrbitalElements,

    readonly orbitalPeriod:
      PlanetaryOrbitalPeriod,

    readonly habitableZoneClassification:
      PlanetaryOrbitHabitableZoneClassification,

    readonly designation:
      PlanetaryDesignation,

    readonly physicalProperties:
      PlanetPhysicalProperties,

    readonly rotationProperties:
      PlanetRotationProperties,
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
      planetOrdinal >
      hostPlanetarySystem.planetCount
    ) {
      throw new RangeError(
        'Point-19.1 planetOrdinal must address an existing mature point-18 planet.',
      );
    }

    const index =
      planetOrdinal -
      1;

    if (
      hostPlanetarySystem
        .planetSlots[index] !==
        architectureSlot
    ) {
      throw new RangeError(
        'Point-19.1 Planet must retain the exact point-18.2 architecture slot for planetOrdinal.',
      );
    }

    if (
      hostPlanetarySystem
        .orbits[index] !==
        orbit
    ) {
      throw new RangeError(
        'Point-19.1 Planet must retain the exact point-18.3 orbit for planetOrdinal.',
      );
    }

    if (
      hostPlanetarySystem
        .orbitalPeriods[index] !==
        orbitalPeriod
    ) {
      throw new RangeError(
        'Point-19.1 Planet must retain the exact point-18.4 orbital period for planetOrdinal.',
      );
    }

    if (
      hostPlanetarySystem
        .orbitHabitableZoneClassifications[index] !==
        habitableZoneClassification
    ) {
      throw new RangeError(
        'Point-19.1 Planet must retain the exact point-18.7 habitable-zone classification for planetOrdinal.',
      );
    }

    if (
      hostPlanetarySystem
        .planetDesignations[index] !==
        designation
    ) {
      throw new RangeError(
        'Point-19.1 Planet must retain the exact point-18.8 designation for planetOrdinal.',
      );
    }

    assertSharedBodyIdentity(
      planetOrdinal,
      architectureSlot,
      orbit,
      orbitalPeriod,
      habitableZoneClassification,
      designation,
      physicalProperties,
      rotationProperties,
    );

    if (
      !approximatelyEqual(
        physicalProperties
          .inheritedSolidCoreMassEarth,
        architectureSlot
          .inheritedSolidCoreMassEarth,
      )
    ) {
      throw new RangeError(
        'Point-19.2 physical properties must preserve the exact point-18.2 inherited solid-core mass.',
      );
    }

    if (
      !approximatelyEqual(
        rotationProperties
          .sourceOrbitalPeriodHours,
        orbitalPeriod
          .periodDays *
          24,
      )
    ) {
      throw new RangeError(
        'Point-19.3 rotation properties must reuse the exact point-18.4 orbital period.',
      );
    }
  }

  get generationKey():
    UniverseGenerationKey {

    return this
      .hostPlanetarySystem
      .generationKey;
  }

  get systemLocator():
    SystemLocator {

    return this
      .hostPlanetarySystem
      .locator;
  }

  get locator():
    BodyLocator {

    return this
      .architectureSlot
      .bodyLocator;
  }

  get seed():
    BodySeed {

    return this
      .architectureSlot
      .bodySeed;
  }

  get bodyIndex():
    bigint {

    return this
      .locator
      .bodyIndex;
  }

  get name():
    string {

    return this
      .designation
      .name;
  }

  get orbitTopology():
    PlanetarySystemOrbitTopology {

    return this
      .hostPlanetarySystem
      .architecture
      .orbitTopology;
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

  get densityGramsPerCubicCentimeter():
    number {

    return this
      .physicalProperties
      .densityGramsPerCubicCentimeter;
  }

  get surfaceGravityEarth():
    number {

    return this
      .physicalProperties
      .surfaceGravityEarth;
  }

  get surfaceGravityMetersPerSecondSquared():
    number {

    return this
      .physicalProperties
      .surfaceGravityMetersPerSecondSquared;
  }

  get rotationPeriodHours():
    number {

    return this
      .rotationProperties
      .rotationPeriodHours;
  }

  get dayLengthHours():
    number | null {

    return this
      .rotationProperties
      .dayLengthHours;
  }

  get axialTiltDegrees():
    number {

    return this
      .rotationProperties
      .axialTiltDegrees;
  }

  get isRetrogradeRotation():
    boolean {

    return this
      .rotationProperties
      .isRetrograde;
  }

  get isTidallySynchronized():
    boolean {

    return this
      .rotationProperties
      .isTidallySynchronized;
  }
}

function assertSharedBodyIdentity(
  planetOrdinal:
    number,

  architectureSlot:
    PlanetaryArchitectureSlot,

  orbit:
    PlanetaryOrbitalElements,

  orbitalPeriod:
    PlanetaryOrbitalPeriod,

  habitableZoneClassification:
    PlanetaryOrbitHabitableZoneClassification,

  designation:
    PlanetaryDesignation,

  physicalProperties:
    PlanetPhysicalProperties,

  rotationProperties:
    PlanetRotationProperties,
): void {

  const bodyObjects = [
    architectureSlot,
    orbit,
    orbitalPeriod,
    habitableZoneClassification,
    designation,
    physicalProperties,
    rotationProperties,
  ] as const;

  for (
    const bodyObject
    of bodyObjects
  ) {
    if (
      bodyObject.planetOrdinal !==
      planetOrdinal
    ) {
      throw new RangeError(
        'Every Planet source projection must preserve the same planetOrdinal.',
      );
    }

    if (
      !sameBodyLocator(
        architectureSlot.bodyLocator,
        bodyObject.bodyLocator,
      ) ||
      architectureSlot.bodySeed.normalizedValue !==
        bodyObject.bodySeed.normalizedValue
    ) {
      throw new RangeError(
        'Every Planet source projection must preserve the exact point-18 BodyLocator/BodySeed identity.',
      );
    }
  }
}

function sameBodyLocator(
  left:
    BodyLocator,

  right:
    BodyLocator,
): boolean {

  return (
    left.galaxyIndex ===
      right.galaxyIndex &&
    left.sectorKey ===
      right.sectorKey &&
    left.galacticObjectIndex ===
      right.galacticObjectIndex &&
    left.bodyIndex ===
      right.bodyIndex
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
    1e-9 *
      scale
  );
}
