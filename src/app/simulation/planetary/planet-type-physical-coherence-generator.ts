import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetInternalComposition,
} from '../../domain/planetary/planet-internal-composition';

import {
  PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
  type PlanetPhysicalProperties,
} from '../../domain/planetary/planet-physical-properties';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type PlanetTypeClassification,
} from '../../domain/planetary/planet-type-classification';

import {
  PlanetTypePhysicalCoherenceAssessment,
} from '../../domain/planetary/planet-type-physical-coherence-assessment';

import {
  PlanetTypePhysicalCoherenceIssue,
} from '../../domain/planetary/planet-type-physical-coherence-issue';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from '../../domain/planetary/planetary-orbit-habitable-zone-relation';

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

const V1_REFRACTORY_RICH_INTERNAL_ICE_BEARING_FRACTION =
  0.01;

const V1_ROCKY_INTERNAL_ICE_BEARING_FRACTION =
  0.06;

const V1_ICE_RICH_INTERNAL_ICE_BEARING_FRACTION =
  0.45;

const V1_VOLATILE_RICH_INTERNAL_ICE_BEARING_FRACTION =
  0.68;

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-19.7 deterministic type <-> mass/radius/composition auditor.
 *
 * V1 consumes zero random draws and derives zero seeds. It does not mutate the
 * type chosen in point 19.4, bulk physics from 19.2 or internal composition from
 * 19.5. Instead it independently re-evaluates the frozen V1 family constraints
 * using the realized internal ice/envelope fractions and records any mismatch.
 */
export class PlanetTypePhysicalCoherenceGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    physicalProperties:
      PlanetPhysicalProperties,

    typeClassification:
      PlanetTypeClassification,

    internalComposition:
      PlanetInternalComposition,
  ): PlanetTypePhysicalCoherenceAssessment {

    assertGeneratorVersion(
      generationKey,
    );

    assertSharedIdentity(
      physicalProperties,
      typeClassification,
      internalComposition,
    );

    assertSourceConsistency(
      physicalProperties,
      typeClassification,
      internalComposition,
    );

    return assessV1(
      physicalProperties,
      typeClassification,
      internalComposition,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    physicalProperties:
      readonly PlanetPhysicalProperties[],

    typeClassifications:
      readonly PlanetTypeClassification[],

    internalCompositions:
      readonly PlanetInternalComposition[],
  ): readonly PlanetTypePhysicalCoherenceAssessment[] {

    assertGeneratorVersion(
      generationKey,
    );

    if (
      physicalProperties.length !==
        typeClassifications.length ||
      physicalProperties.length !==
        internalCompositions.length
    ) {
      throw new RangeError(
        'PlanetTypePhysicalCoherenceGenerator requires aligned point-19.2, 19.4 and 19.5 collections.',
      );
    }

    return Object.freeze(
      physicalProperties.map(
        (
          properties,
          index,
        ) => {
          const classification =
            typeClassifications[index];

          const composition =
            internalCompositions[index];

          assertSharedIdentity(
            properties,
            classification,
            composition,
          );

          assertSourceConsistency(
            properties,
            classification,
            composition,
          );

          if (
            properties.planetOrdinal !==
            index +
              1
          ) {
            throw new RangeError(
              'Point-19.7 inputs must be supplied in contiguous frozen planetOrdinal order.',
            );
          }

          return assessV1(
            properties,
            classification,
            composition,
          );
        },
      ),
    );
  }
}

function assertGeneratorVersion(
  generationKey:
    UniverseGenerationKey,
): void {

  if (
    generationKey.generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }
}

function assessV1(
  physicalProperties:
    PlanetPhysicalProperties,

  typeClassification:
    PlanetTypeClassification,

  internalComposition:
    PlanetInternalComposition,
): PlanetTypePhysicalCoherenceAssessment {

  const expectedDensity =
    PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER *
    physicalProperties.massEarth /
    physicalProperties.radiusEarth **
      3;

  const internalEnvelopeFraction =
    internalComposition
      .gaseousEnvelopeMassFraction01;

  const compositionSourceIceBearingFraction =
    internalComposition
      .sourceIceBearingFraction01;

  const internalIceBearingSolidFraction =
    internalComposition
      .iceBearingFractionOfSolids01;

  const expectedInternalIceBearingSolidFraction =
    expectedInternalIceBearingFractionV1(
      internalComposition,
    );

  const expectedPlanetType =
    classifyExpectedTypeV1(
      physicalProperties,
      compositionSourceIceBearingFraction,
      typeClassification,
    );

  const issues:
    PlanetTypePhysicalCoherenceIssue[] = [];

  if (
    !approximatelyEqual(
      physicalProperties
        .densityGramsPerCubicCentimeter,
      expectedDensity,
    )
  ) {
    issues.push(
      PlanetTypePhysicalCoherenceIssue.BULK_MASS_RADIUS_DENSITY_MISMATCH,
    );
  }

  if (
    !approximatelyEqual(
      physicalProperties
        .envelopeMassFraction01,
      internalEnvelopeFraction,
    )
  ) {
    issues.push(
      PlanetTypePhysicalCoherenceIssue.ENVELOPE_MASS_FRACTION_MISMATCH,
    );
  }

  if (
    !approximatelyEqual(
      typeClassification
        .sourceIceBearingSolidFraction01,
      compositionSourceIceBearingFraction,
    ) ||
    !approximatelyEqual(
      internalIceBearingSolidFraction,
      expectedInternalIceBearingSolidFraction,
    )
  ) {
    issues.push(
      PlanetTypePhysicalCoherenceIssue.ICE_BEARING_COMPOSITION_MISMATCH,
    );
  }

  if (
    typeClassification.planetType !==
    expectedPlanetType
  ) {
    issues.push(
      PlanetTypePhysicalCoherenceIssue.TYPE_RULE_MISMATCH,
    );
  }

  return new PlanetTypePhysicalCoherenceAssessment(
    physicalProperties.planetOrdinal,
    physicalProperties.bodyLocator,
    physicalProperties.bodySeed,
    typeClassification.planetType,
    expectedPlanetType,
    physicalProperties.massEarth,
    physicalProperties.radiusEarth,
    physicalProperties.densityGramsPerCubicCentimeter,
    expectedDensity,
    physicalProperties.envelopeMassFraction01,
    internalEnvelopeFraction,
    typeClassification.sourceIceBearingSolidFraction01,
    compositionSourceIceBearingFraction,
    internalIceBearingSolidFraction,
    expectedInternalIceBearingSolidFraction,
    issues,
  );
}

function expectedInternalIceBearingFractionV1(
  internalComposition:
    PlanetInternalComposition,
): number {

  return (
    internalComposition.sourceRefractoryRichFraction01 *
      V1_REFRACTORY_RICH_INTERNAL_ICE_BEARING_FRACTION +
    internalComposition.sourceRockyFraction01 *
      V1_ROCKY_INTERNAL_ICE_BEARING_FRACTION +
    internalComposition.sourceIceRichFraction01 *
      V1_ICE_RICH_INTERNAL_ICE_BEARING_FRACTION +
    internalComposition.sourceVolatileRichFraction01 *
      V1_VOLATILE_RICH_INTERNAL_ICE_BEARING_FRACTION
  );
}

function classifyExpectedTypeV1(
  physicalProperties:
    PlanetPhysicalProperties,

  iceBearingSolidFraction01:
    number,

  typeClassification:
    PlanetTypeClassification,
): PlanetType {

  const envelopeMassFraction01 =
    physicalProperties
      .envelopeMassFraction01;

  if (
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
  ) {
    return PlanetType.ICE_GIANT;
  }

  if (
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

  const hasPersistentReferenceThermalContext =
    typeClassification
      .stellarEvolutionRegime !==
    PlanetarySystemHabitableZoneEvolutionRegime.REFERENCE_ONLY;

  if (
    isSolidDominated &&
    drySolidFraction01 >=
      V1_VOLCANIC_MIN_DRY_SOLID_FRACTION &&
    (
      (
        hasPersistentReferenceThermalContext &&
        typeClassification.referenceMeanInsolationEarth >=
          V1_VOLCANIC_MIN_REFERENCE_MEAN_INSOLATION_EARTH
      ) ||
      typeClassification.tidalHeatingProxy >=
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
    typeClassification.radiativeHabitableZoneRelation ===
      PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE
  ) {
    return PlanetType.ICE;
  }

  if (
    isSolidDominated &&
    hasPersistentReferenceThermalContext &&
    iceBearingSolidFraction01 >=
      V1_OCEAN_MIN_ICE_BEARING_SOLID_FRACTION &&
    typeClassification.radiativeHabitableZoneRelation ===
      PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE
  ) {
    return PlanetType.OCEAN;
  }

  if (
    isSolidDominated &&
    hasPersistentReferenceThermalContext &&
    iceBearingSolidFraction01 <=
      V1_DESERT_MAX_ICE_BEARING_SOLID_FRACTION &&
    typeClassification.radiativeHabitableZoneRelation ===
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

  return PlanetType.ROCKY;
}

function assertSharedIdentity(
  physicalProperties:
    PlanetPhysicalProperties,

  typeClassification:
    PlanetTypeClassification,

  internalComposition:
    PlanetInternalComposition,
): void {

  const objects = [
    typeClassification,
    internalComposition,
  ];

  for (
    const object
    of objects
  ) {
    if (
      object.planetOrdinal !==
        physicalProperties.planetOrdinal ||
      !sameBodyLocator(
        object.bodyLocator,
        physicalProperties.bodyLocator,
      ) ||
      object.bodySeed.normalizedValue !==
        physicalProperties.bodySeed.normalizedValue
    ) {
      throw new RangeError(
        'Point-19.7 requires point-19.2/19.4/19.5 products to share the exact BodyLocator/BodySeed identity.',
      );
    }
  }
}

function assertSourceConsistency(
  physicalProperties:
    PlanetPhysicalProperties,

  typeClassification:
    PlanetTypeClassification,

  internalComposition:
    PlanetInternalComposition,
): void {

  if (
    !approximatelyEqual(
      typeClassification.sourceMassEarth,
      physicalProperties.massEarth,
    ) ||
    !approximatelyEqual(
      typeClassification.sourceRadiusEarth,
      physicalProperties.radiusEarth,
    ) ||
    !approximatelyEqual(
      typeClassification.sourceDensityGramsPerCubicCentimeter,
      physicalProperties.densityGramsPerCubicCentimeter,
    ) ||
    !approximatelyEqual(
      typeClassification.sourceEnvelopeMassFraction01,
      physicalProperties.envelopeMassFraction01,
    )
  ) {
    throw new RangeError(
      'Point-19.7 requires point-19.4 diagnostics to preserve the exact point-19.2 bulk source values.',
    );
  }

  if (
    !approximatelyEqual(
      internalComposition.totalMassEarth,
      physicalProperties.massEarth,
    )
  ) {
    throw new RangeError(
      'Point-19.7 requires point-19.5 internal composition to preserve the point-19.2 total mass.',
    );
  }
}

function sameBodyLocator(
  left:
    PlanetPhysicalProperties['bodyLocator'],

  right:
    PlanetPhysicalProperties['bodyLocator'],
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
    CONSISTENCY_TOLERANCE *
      scale
  );
}
