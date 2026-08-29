import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  CircumbinaryPlanetaryStabilityRegime,
  CircumbinaryStellarEvolutionRegime,
} from '../../domain/habitability/circumbinary-habitability-assessment';

import {
  PlanetarySystemHabitableZoneDynamicalRegime,
} from '../../domain/planetary/planetary-system-habitable-zone-dynamical-regime';

import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from '../../domain/planetary/planetary-system-habitable-zone-evolution-regime';

import {
  PlanetarySystemHabitableZone,
} from '../../domain/planetary/planetary-system-habitable-zone';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  CIRCUMBINARY_V1_INNER_HABITABLE_EFFECTIVE_FLUX_SOLAR,
  CIRCUMBINARY_V1_OUTER_HABITABLE_EFFECTIVE_FLUX_SOLAR,
} from '../habitability/circumbinary-habitability-assessment-generator';

export const PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR =
  CIRCUMBINARY_V1_INNER_HABITABLE_EFFECTIVE_FLUX_SOLAR;

export const PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR =
  CIRCUMBINARY_V1_OUTER_HABITABLE_EFFECTIVE_FLUX_SOLAR;

/**
 * Point-18.6 system-level reference habitable-zone generator.
 *
 * SINGLE systems read the already-frozen point-15.1 primary reference
 * luminosity carried by StellarSystem and derive the complete conservative
 * radiative interval. This deliberately avoids reconstructing sector context
 * from SystemLocator, which is insufficient to recover the exact stellar
 * environment used when a host was originally materialized. Multiple systems
 * reuse point 16.6 exactly,
 * preserving its A+B reference luminosity and point-16.5-clipped P-type stable
 * overlap instead of calculating a second, potentially divergent answer.
 *
 * No planet orbit is classified here. Point 18.7 owns the relation between each
 * frozen point-18.3 orbit and this point-18.6 zone. No new seed level or entropy
 * branch is introduced.
 */
export class PlanetarySystemHabitableZoneGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    stellarSystem:
      StellarSystem,
  ): PlanetarySystemHabitableZone {

    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V1
    ) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

    if (
      !generationKey.equals(
        stellarSystem.generationKey,
      )
    ) {
      throw new RangeError(
        'PlanetarySystemHabitableZoneGenerator requires the host StellarSystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      stellarSystem.multiplicity ===
      StellarSystemMultiplicity.SINGLE
    ) {
      return generateCircumstellarV1(
        stellarSystem,
      );
    }

    return generateCircumbinaryV1(
      stellarSystem,
    );
  }
}

function generateCircumstellarV1(
  stellarSystem:
    StellarSystem,
): PlanetarySystemHabitableZone {

  const referenceLuminositySolar =
    stellarSystem
      .primaryReferenceLuminositySolar;

  if (
    referenceLuminositySolar ===
      null ||
    referenceLuminositySolar ===
      undefined ||
    !Number.isFinite(
      referenceLuminositySolar,
    ) ||
    referenceLuminositySolar <=
      0
  ) {
    throw new RangeError(
      'Point-18.6 CIRCUMSTELLAR habitable zones require the frozen point-15.1 primary reference luminosity carried by StellarSystem.',
    );
  }

  const radiativeInnerEdgeAu =
    Math.sqrt(
      referenceLuminositySolar /
      PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR,
    );

  const radiativeOuterEdgeAu =
    Math.sqrt(
      referenceLuminositySolar /
      PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR,
    );

  const stellarEvolutionRegime =
    stellarSystem
      .primaryStar
      .evolutionState
      .name ===
    StellarEvolutionState.MAIN_SEQUENCE.name
      ? PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST
      : PlanetarySystemHabitableZoneEvolutionRegime.REFERENCE_ONLY;

  return new PlanetarySystemHabitableZone(
    stellarSystem.locator,
    PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
    referenceLuminositySolar,
    PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR,
    PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR,
    radiativeInnerEdgeAu,
    radiativeOuterEdgeAu,
    radiativeInnerEdgeAu,
    radiativeOuterEdgeAu,
    1,
    PlanetarySystemHabitableZoneDynamicalRegime.FULL_DYNAMICAL_OVERLAP,
    stellarEvolutionRegime,
  );
}

function generateCircumbinaryV1(
  stellarSystem:
    StellarSystem,
): PlanetarySystemHabitableZone {

  const assessment =
    stellarSystem
      .circumbinaryHabitabilityAssessment;

  if (
    assessment ===
    null ||
    assessment ===
    undefined
  ) {
    throw new RangeError(
      'Point-18.6 CIRCUMBINARY habitable zones require the frozen point-16.6 circumbinary habitability assessment.',
    );
  }

  if (
    assessment.hostMultiplicity !==
    stellarSystem.multiplicity
  ) {
    throw new RangeError(
      'Point-18.6 circumbinary habitability multiplicity must match the host StellarSystem.',
    );
  }

  const dynamicalRegime =
    mapDynamicalRegimeV1(
      assessment.planetaryStabilityRegime,
    );

  const stellarEvolutionRegime =
    assessment.stellarEvolutionRegime ===
      CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR
      ? PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_INNER_PAIR
      : PlanetarySystemHabitableZoneEvolutionRegime.REFERENCE_ONLY;

  return new PlanetarySystemHabitableZone(
    stellarSystem.locator,
    PlanetarySystemOrbitTopology.CIRCUMBINARY,
    assessment.combinedReferenceLuminositySolar,
    PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR,
    PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR,
    assessment.radiativeHabitableInnerEdgeAu,
    assessment.radiativeHabitableOuterEdgeAu,
    assessment.stableHabitableInnerEdgeAu,
    assessment.stableHabitableOuterEdgeAu,
    assessment.stableHabitableZoneFraction,
    dynamicalRegime,
    stellarEvolutionRegime,
  );
}

function mapDynamicalRegimeV1(
  regime:
    CircumbinaryPlanetaryStabilityRegime,
): PlanetarySystemHabitableZoneDynamicalRegime {

  if (
    regime ===
    CircumbinaryPlanetaryStabilityRegime.NO_STABLE_HABITABLE_ZONE
  ) {
    return PlanetarySystemHabitableZoneDynamicalRegime.NO_DYNAMICAL_OVERLAP;
  }

  if (
    regime ===
    CircumbinaryPlanetaryStabilityRegime.PARTIAL_STABLE_HABITABLE_ZONE
  ) {
    return PlanetarySystemHabitableZoneDynamicalRegime.PARTIAL_DYNAMICAL_OVERLAP;
  }

  if (
    regime ===
    CircumbinaryPlanetaryStabilityRegime.FULL_STABLE_HABITABLE_ZONE
  ) {
    return PlanetarySystemHabitableZoneDynamicalRegime.FULL_DYNAMICAL_OVERLAP;
  }

  throw new RangeError(
    `Unsupported CircumbinaryPlanetaryStabilityRegime: ${String(regime)}.`,
  );
}
