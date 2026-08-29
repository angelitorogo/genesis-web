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
  type PlanetInternalComposition,
} from './planet-internal-composition';

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
  type PlanetType,
} from './planet-type';

import {
  type PlanetTypeClassification,
} from './planet-type-classification';

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
 * product. Point 19.4 then attaches one deterministic coarse planet-type
 * classification and point 19.5 adds an approximate conserved internal mass
 * budget. Albedo/surface and rarity flags remain absent until points 19.6..19.8.
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

    readonly typeClassification:
      PlanetTypeClassification,

    readonly internalComposition:
      PlanetInternalComposition,
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
      typeClassification,
      internalComposition,
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

    if (
      !approximatelyEqual(
        typeClassification
          .sourceMassEarth,
        physicalProperties
          .massEarth,
      ) ||
      !approximatelyEqual(
        typeClassification
          .sourceRadiusEarth,
        physicalProperties
          .radiusEarth,
      ) ||
      !approximatelyEqual(
        typeClassification
          .sourceDensityGramsPerCubicCentimeter,
        physicalProperties
          .densityGramsPerCubicCentimeter,
      ) ||
      !approximatelyEqual(
        typeClassification
          .sourceEnvelopeMassFraction01,
        physicalProperties
          .envelopeMassFraction01,
      )
    ) {
      throw new RangeError(
        'Point-19.4 type classification must preserve the exact point-19.2 bulk-physical source values.',
      );
    }

    if (
      typeClassification
        .radiativeHabitableZoneRelation !==
      habitableZoneClassification
        .radiativeRelation
    ) {
      throw new RangeError(
        'Point-19.4 type classification must preserve the exact point-18.7 radiative HZ relation.',
      );
    }

    if (
      typeClassification
        .stellarEvolutionRegime !==
      hostPlanetarySystem
        .habitableZone
        .stellarEvolutionRegime
    ) {
      throw new RangeError(
        'Point-19.4 type classification must preserve the point-18.6 stellar-evolution strength of the thermal context.',
      );
    }

    if (
      !approximatelyEqual(
        typeClassification
          .sourceIceBearingSolidFraction01,
        architectureSlot
          .inheritedCompositionMixture
          .iceBearingFraction01,
      )
    ) {
      throw new RangeError(
        'Point-19.4 type classification must preserve the frozen point-18.2 ice-bearing solid fraction.',
      );
    }

    const expectedReferenceMeanInsolationEarth =
      hostPlanetarySystem
        .habitableZone
        .referenceLuminositySolar /
      (
        orbit.semiMajorAxisAu **
          2 *
        Math.sqrt(
          1 -
          orbit.eccentricity **
            2,
        )
      );

    if (
      !approximatelyEqual(
        typeClassification
          .referenceMeanInsolationEarth,
        expectedReferenceMeanInsolationEarth,
      )
    ) {
      throw new RangeError(
        'Point-19.4 reference mean insolation must be derived from the frozen point-18.3 orbit and point-18.6 reference luminosity.',
      );
    }

    const expectedTidalHeatingProxy =
      orbitalPeriod
        .gravitatingMassSolar **
        2 *
      physicalProperties
        .radiusEarth **
        5 *
      orbit
        .eccentricity **
        2 /
      (
        physicalProperties
          .massEarth *
        orbit
          .semiMajorAxisAu **
          6
      );

    if (
      !approximatelyEqual(
        typeClassification
          .tidalHeatingProxy,
        expectedTidalHeatingProxy,
      )
    ) {
      throw new RangeError(
        'Point-19.4 tidal-heating proxy must be derived from the frozen host mass/orbit and point-19.2 bulk physics.',
      );
    }

    if (
      !approximatelyEqual(
        internalComposition
          .sourceSolidMassEarth,
        physicalProperties
          .inheritedSolidCoreMassEarth,
      ) ||
      !approximatelyEqual(
        internalComposition
          .sourceEnvelopeMassEarth,
        physicalProperties
          .accretedEnvelopeMassEarth,
      ) ||
      !approximatelyEqual(
        internalComposition
          .gaseousEnvelopeMassEarth,
        physicalProperties
          .accretedEnvelopeMassEarth,
      ) ||
      !approximatelyEqual(
        internalComposition
          .totalMassEarth,
        physicalProperties
          .massEarth,
      )
    ) {
      throw new RangeError(
        'Point-19.5 internal composition must conserve the exact point-19.2 solid, envelope and total masses.',
      );
    }

    const sourceMixture =
      architectureSlot
        .inheritedCompositionMixture;

    if (
      !approximatelyEqual(
        internalComposition
          .sourceRefractoryRichFraction01,
        sourceMixture
          .refractoryRichFraction01,
      ) ||
      !approximatelyEqual(
        internalComposition
          .sourceRockyFraction01,
        sourceMixture
          .rockyFraction01,
      ) ||
      !approximatelyEqual(
        internalComposition
          .sourceIceRichFraction01,
        sourceMixture
          .iceRichFraction01,
      ) ||
      !approximatelyEqual(
        internalComposition
          .sourceVolatileRichFraction01,
        sourceMixture
          .volatileRichFraction01,
      )
    ) {
      throw new RangeError(
        'Point-19.5 internal composition must preserve the exact point-18.2 source-family mixture.',
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

  get planetType():
    PlanetType {

    return this
      .typeClassification
      .planetType;
  }

  get metallicCoreMassEarth():
    number {

    return this
      .internalComposition
      .metallicCoreMassEarth;
  }

  get silicateInteriorMassEarth():
    number {

    return this
      .internalComposition
      .silicateInteriorMassEarth;
  }

  get condensedIceMassEarth():
    number {

    return this
      .internalComposition
      .condensedIceMassEarth;
  }

  get volatileRichInteriorMassEarth():
    number {

    return this
      .internalComposition
      .volatileRichInteriorMassEarth;
  }

  get gaseousEnvelopeMassEarth():
    number {

    return this
      .internalComposition
      .gaseousEnvelopeMassEarth;
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

  typeClassification:
    PlanetTypeClassification,

  internalComposition:
    PlanetInternalComposition,
): void {

  const bodyObjects = [
    architectureSlot,
    orbit,
    orbitalPeriod,
    habitableZoneClassification,
    designation,
    physicalProperties,
    rotationProperties,
    typeClassification,
    internalComposition,
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
