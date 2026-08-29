import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type PlanetaryArchitectureSlot,
} from '../../domain/planetary/planetary-architecture-slot';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from '../../domain/planetary/planetary-orbit-habitable-zone-relation';

import {
  type PlanetPhysicalProperties,
} from '../../domain/planetary/planet-physical-properties';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  PlanetTypeClassification,
} from '../../domain/planetary/planet-type-classification';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from '../../domain/planetary/planetary-system-habitable-zone-evolution-regime';

const V1_GAS_GIANT_MIN_MASS_EARTH =
  30;

const V1_GAS_GIANT_MIN_ENVELOPE_FRACTION =
  0.20;

const V1_GAS_GIANT_STRONG_ENVELOPE_MIN_MASS_EARTH =
  15;

const V1_GAS_GIANT_STRONG_ENVELOPE_FRACTION =
  0.50;

const V1_ICE_GIANT_MIN_MASS_EARTH =
  8;

const V1_ICE_GIANT_MAX_MASS_EARTH =
  40;

const V1_ICE_GIANT_MIN_RADIUS_EARTH =
  2.5;

const V1_ICE_GIANT_MIN_ENVELOPE_FRACTION =
  0.08;

const V1_ICE_GIANT_MIN_ICE_BEARING_SOLID_FRACTION =
  0.35;

const V1_MINI_NEPTUNE_MIN_ENVELOPE_FRACTION =
  0.03;

const V1_MINI_NEPTUNE_MIN_RADIUS_EARTH =
  1.5;

const V1_MINI_NEPTUNE_MIN_MASS_EARTH =
  2;

const V1_SOLID_WORLD_MAX_ENVELOPE_FRACTION =
  0.03;

const V1_VOLCANIC_MIN_DRY_SOLID_FRACTION =
  0.55;

const V1_VOLCANIC_MIN_REFERENCE_MEAN_INSOLATION_EARTH =
  300;

const V1_VOLCANIC_MIN_TIDAL_HEATING_PROXY =
  100;

const V1_ICE_MIN_ICE_BEARING_SOLID_FRACTION =
  0.45;

const V1_OCEAN_MIN_ICE_BEARING_SOLID_FRACTION =
  0.35;

const V1_DESERT_MAX_ICE_BEARING_SOLID_FRACTION =
  0.25;

const V1_SUPER_EARTH_MIN_MASS_EARTH =
  1.8;

/**
 * Point-19.4 deterministic coarse planet-type classifier.
 *
 * V1 deliberately consumes zero new PRNG draws. The nine roadmap families are
 * derived from the already-generated bulk state plus frozen formation and orbit
 * context: retained envelope fraction, total mass/radius, inherited solid
 * ice/volatile fraction, radiative HZ relation and a coarse irradiation/tidal
 * heating context.
 *
 * The labels OCEAN, DESERT and VOLCANIC are broad physical phenotypes only.
 * They do not pre-empt phase-20 atmosphere, climate, water or detailed geology.
 * Point 19.5 likewise remains the owner of detailed internal composition.
 */
export class PlanetTypeGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    physicalProperties:
      PlanetPhysicalProperties,
  ): PlanetTypeClassification {

    assertGenerationContext(
      generationKey,
      planetarySystem,
    );

    const index =
      validatePhysicalPropertiesIdentity(
        planetarySystem,
        physicalProperties,
      );

    return classifyV1(
      planetarySystem,
      index,
      physicalProperties,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    physicalProperties:
      readonly PlanetPhysicalProperties[],
  ): readonly PlanetTypeClassification[] {

    assertGenerationContext(
      generationKey,
      planetarySystem,
    );

    if (
      physicalProperties.length !==
      planetarySystem.planetCount
    ) {
      throw new RangeError(
        'PlanetTypeGenerator requires exactly one point-19.2 physical state for every mature planet.',
      );
    }

    return Object.freeze(
      physicalProperties.map(
        (
          properties,
          index,
        ) => {
          const resolvedIndex =
            validatePhysicalPropertiesIdentity(
              planetarySystem,
              properties,
            );

          if (
            resolvedIndex !==
            index
          ) {
            throw new RangeError(
              'Point-19.2 physical states must be supplied in frozen planetOrdinal order for point 19.4 classification.',
            );
          }

          return classifyV1(
            planetarySystem,
            index,
            properties,
          );
        },
      ),
    );
  }
}

function assertGenerationContext(
  generationKey:
    UniverseGenerationKey,

  planetarySystem:
    PlanetarySystem,
): void {

  if (
    generationKey.generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  if (
    !generationKey.equals(
      planetarySystem.generationKey,
    )
  ) {
    throw new RangeError(
      'PlanetTypeGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
    );
  }
}

function validatePhysicalPropertiesIdentity(
  planetarySystem:
    PlanetarySystem,

  physicalProperties:
    PlanetPhysicalProperties,
): number {

  const index =
    physicalProperties.planetOrdinal -
    1;

  if (
    index <
      0 ||
    index >=
      planetarySystem.planetCount
  ) {
    throw new RangeError(
      'Point-19.2 physical properties do not address an existing mature planet.',
    );
  }

  const slot =
    planetarySystem.planetSlots[index];

  if (
    !sameBodyIdentity(
      slot,
      physicalProperties,
    )
  ) {
    throw new RangeError(
      'PlanetTypeGenerator requires point-19.2 physical properties to preserve the exact point-18 BodyLocator/BodySeed identity.',
    );
  }

  if (
    !approximatelyEqual(
      slot.inheritedSolidCoreMassEarth,
      physicalProperties.inheritedSolidCoreMassEarth,
    )
  ) {
    throw new RangeError(
      'PlanetTypeGenerator requires the frozen point-18.2 solid-core mass to be preserved.',
    );
  }

  return index;
}

function classifyV1(
  planetarySystem:
    PlanetarySystem,

  index:
    number,

  physicalProperties:
    PlanetPhysicalProperties,
): PlanetTypeClassification {

  const slot =
    planetarySystem.planetSlots[index];

  const orbit =
    planetarySystem.orbits[index];

  const period =
    planetarySystem.orbitalPeriods[index];

  const habitableZoneClassification =
    planetarySystem
      .orbitHabitableZoneClassifications[index];

  const iceBearingSolidFraction01 =
    slot
      .inheritedCompositionMixture
      .iceBearingFraction01;

  const referenceMeanInsolationEarth =
    planetarySystem
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

  const tidalHeatingProxy =
    period
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

  const stellarEvolutionRegime =
    planetarySystem
      .habitableZone
      .stellarEvolutionRegime;

  const hasPersistentReferenceThermalContext =
    stellarEvolutionRegime !==
    PlanetarySystemHabitableZoneEvolutionRegime.REFERENCE_ONLY;

  const planetType =
    classifyPlanetTypeV1(
      physicalProperties,
      habitableZoneClassification
        .radiativeRelation,
      iceBearingSolidFraction01,
      referenceMeanInsolationEarth,
      tidalHeatingProxy,
      hasPersistentReferenceThermalContext,
    );

  return new PlanetTypeClassification(
    physicalProperties.planetOrdinal,
    physicalProperties.bodyLocator,
    physicalProperties.bodySeed,
    planetType,
    physicalProperties.massEarth,
    physicalProperties.radiusEarth,
    physicalProperties.densityGramsPerCubicCentimeter,
    physicalProperties.envelopeMassFraction01,
    iceBearingSolidFraction01,
    habitableZoneClassification.radiativeRelation,
    stellarEvolutionRegime,
    referenceMeanInsolationEarth,
    tidalHeatingProxy,
  );
}

function classifyPlanetTypeV1(
  physicalProperties:
    PlanetPhysicalProperties,

  radiativeRelation:
    PlanetaryOrbitHabitableZoneRelation,

  iceBearingSolidFraction01:
    number,

  referenceMeanInsolationEarth:
    number,

  tidalHeatingProxy:
    number,

  hasPersistentReferenceThermalContext:
    boolean,
): PlanetType {

  const envelopeMassFraction01 =
    physicalProperties
      .envelopeMassFraction01;

  if (
    isIceGiantV1(
      physicalProperties,
      envelopeMassFraction01,
      iceBearingSolidFraction01,
    )
  ) {
    return PlanetType.ICE_GIANT;
  }

  if (
    isGasGiantV1(
      physicalProperties,
      envelopeMassFraction01,
    )
  ) {
    return PlanetType.GAS_GIANT;
  }

  if (
    envelopeMassFraction01 >=
      V1_MINI_NEPTUNE_MIN_ENVELOPE_FRACTION &&
    (
      physicalProperties.radiusEarth >=
        V1_MINI_NEPTUNE_MIN_RADIUS_EARTH ||
      physicalProperties.massEarth >=
        V1_MINI_NEPTUNE_MIN_MASS_EARTH
    )
  ) {
    return PlanetType.MINI_NEPTUNE;
  }

  const isSolidDominated =
    envelopeMassFraction01 <
    V1_SOLID_WORLD_MAX_ENVELOPE_FRACTION;

  const drySolidFraction01 =
    1 -
    iceBearingSolidFraction01;

  if (
    isSolidDominated &&
    drySolidFraction01 >=
      V1_VOLCANIC_MIN_DRY_SOLID_FRACTION &&
    (
      (
        hasPersistentReferenceThermalContext &&
        referenceMeanInsolationEarth >=
          V1_VOLCANIC_MIN_REFERENCE_MEAN_INSOLATION_EARTH
      ) ||
      tidalHeatingProxy >=
        V1_VOLCANIC_MIN_TIDAL_HEATING_PROXY
    )
  ) {
    return PlanetType.VOLCANIC;
  }

  if (
    isSolidDominated &&
    hasPersistentReferenceThermalContext &&
    iceBearingSolidFraction01 >=
      V1_ICE_MIN_ICE_BEARING_SOLID_FRACTION &&
    radiativeRelation ===
      PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE
  ) {
    return PlanetType.ICE;
  }

  if (
    isSolidDominated &&
    hasPersistentReferenceThermalContext &&
    iceBearingSolidFraction01 >=
      V1_OCEAN_MIN_ICE_BEARING_SOLID_FRACTION &&
    radiativeRelation ===
      PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE
  ) {
    return PlanetType.OCEAN;
  }

  if (
    isSolidDominated &&
    hasPersistentReferenceThermalContext &&
    iceBearingSolidFraction01 <=
      V1_DESERT_MAX_ICE_BEARING_SOLID_FRACTION &&
    radiativeRelation ===
      PlanetaryOrbitHabitableZoneRelation.WHOLLY_INTERIOR_TO_ZONE
  ) {
    return PlanetType.DESERT;
  }

  if (
    physicalProperties.massEarth >=
    V1_SUPER_EARTH_MIN_MASS_EARTH
  ) {
    return PlanetType.SUPER_EARTH;
  }

  /*
   * ROCKY is the solid-world fallback. The inherited mixture can still contain
   * modest ice/volatile fractions; point 19.5 owns the internal-composition
   * breakdown and point 20 decides actual surface/climate state.
   */
  return PlanetType.ROCKY;
}

function isIceGiantV1(
  physicalProperties:
    PlanetPhysicalProperties,

  envelopeMassFraction01:
    number,

  iceBearingSolidFraction01:
    number,
): boolean {

  return (
    physicalProperties.massEarth >=
      V1_ICE_GIANT_MIN_MASS_EARTH &&
    physicalProperties.massEarth <=
      V1_ICE_GIANT_MAX_MASS_EARTH &&
    physicalProperties.radiusEarth >=
      V1_ICE_GIANT_MIN_RADIUS_EARTH &&
    envelopeMassFraction01 >=
      V1_ICE_GIANT_MIN_ENVELOPE_FRACTION &&
    iceBearingSolidFraction01 >=
      V1_ICE_GIANT_MIN_ICE_BEARING_SOLID_FRACTION
  );
}

function isGasGiantV1(
  physicalProperties:
    PlanetPhysicalProperties,

  envelopeMassFraction01:
    number,
): boolean {

  return (
    (
      physicalProperties.massEarth >=
        V1_GAS_GIANT_MIN_MASS_EARTH &&
      envelopeMassFraction01 >=
        V1_GAS_GIANT_MIN_ENVELOPE_FRACTION
    ) ||
    (
      physicalProperties.massEarth >=
        V1_GAS_GIANT_STRONG_ENVELOPE_MIN_MASS_EARTH &&
      envelopeMassFraction01 >=
        V1_GAS_GIANT_STRONG_ENVELOPE_FRACTION
    )
  );
}


function sameBodyIdentity(
  slot:
    PlanetaryArchitectureSlot,

  physicalProperties:
    PlanetPhysicalProperties,
): boolean {

  return (
    slot.planetOrdinal ===
      physicalProperties.planetOrdinal &&
    slot.bodyLocator.galaxyIndex ===
      physicalProperties.bodyLocator.galaxyIndex &&
    slot.bodyLocator.sectorKey ===
      physicalProperties.bodyLocator.sectorKey &&
    slot.bodyLocator.galacticObjectIndex ===
      physicalProperties.bodyLocator.galacticObjectIndex &&
    slot.bodyLocator.bodyIndex ===
      physicalProperties.bodyLocator.bodyIndex &&
    slot.bodySeed.normalizedValue ===
      physicalProperties.bodySeed.normalizedValue
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
