import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetaryOrbitalPairStability,
} from '../../domain/planetary/planetary-orbital-pair-stability';

import {
  PlanetaryOrbitalPairStabilityRegime,
} from '../../domain/planetary/planetary-orbital-pair-stability-regime';

import {
  type PlanetarySystemArchitecture,
} from '../../domain/planetary/planetary-system-architecture';

import {
  PlanetarySystemArchitectureRegime,
} from '../../domain/planetary/planetary-system-architecture-regime';

import {
  type PlanetarySystemOrbitalLayout,
} from '../../domain/planetary/planetary-system-orbital-layout';

import {
  type PlanetarySystemOrbitalPeriodLayout,
} from '../../domain/planetary/planetary-system-orbital-period-layout';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  PlanetarySystemStabilityAssessment,
} from '../../domain/planetary/planetary-system-stability-assessment';

import {
  PlanetarySystemStabilityRegime,
} from '../../domain/planetary/planetary-system-stability-regime';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

const V1_SOLAR_MASS_IN_EARTH_MASSES =
  332_946.0487;

export const PLANETARY_STABILITY_V1_HILL_UNSTABLE_THRESHOLD =
  2 *
  Math.sqrt(
    3,
  );

export const PLANETARY_STABILITY_V1_CONSERVATIVE_STABLE_THRESHOLD =
  8;

/**
 * Point-18.5 basic orbital-stability assessor.
 *
 * V1 never rewrites point-18.2 planet identities, point-18.3 orbital geometry
 * or point-18.4 periods. Adjacent pairs are classified from geometric clearance
 * and mutual-Hill separation using inherited solid-core masses as the currently
 * frozen planetary mass proxy. CIRCUMBINARY systems additionally receive a
 * conservative apsidal check against the point-16.5 P-type critical interval.
 *
 * This is deliberately not an N-body integration and does not model mean-motion
 * resonances, secular chaos, tides, migration or later stellar evolution.
 */
export class PlanetarySystemOrbitalStabilityGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    stellarSystem:
      StellarSystem,

    architecture:
      PlanetarySystemArchitecture,

    orbitalLayout:
      PlanetarySystemOrbitalLayout,

    orbitalPeriodLayout:
      PlanetarySystemOrbitalPeriodLayout,
  ): PlanetarySystemStabilityAssessment {

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
        'PlanetarySystemOrbitalStabilityGenerator requires the host StellarSystem to share the supplied UniverseGenerationKey.',
      );
    }

    validateInputCardinality(
      architecture,
      orbitalLayout,
      orbitalPeriodLayout,
    );

    if (
      architecture.regime ===
      PlanetarySystemArchitectureRegime.DYNAMICALLY_EXCLUDED
    ) {
      return new PlanetarySystemStabilityAssessment(
        stellarSystem.locator,
        architecture.orbitTopology,
        PlanetarySystemStabilityRegime.DYNAMICALLY_EXCLUDED,
        0,
        null,
        null,
        null,
        null,
        null,
        [],
      );
    }

    if (
      architecture.planetCount ===
      0
    ) {
      const boundaries =
        emptySystemBoundariesV1(
          stellarSystem,
          architecture.orbitTopology,
        );

      return new PlanetarySystemStabilityAssessment(
        stellarSystem.locator,
        architecture.orbitTopology,
        PlanetarySystemStabilityRegime.EMPTY,
        0,
        null,
        boundaries.innerAu,
        boundaries.outerAu,
        null,
        null,
        [],
      );
    }

    const gravitatingMassSolar =
      orbitalPeriodLayout
        .gravitatingMassSolar;

    if (
      gravitatingMassSolar ===
      null
    ) {
      throw new RangeError(
        'A non-empty point-18.5 assessment requires the point-18.4 gravitating host mass.',
      );
    }

    const pairAssessments =
      generatePairAssessmentsV1(
        architecture,
        orbitalLayout,
        orbitalPeriodLayout,
        gravitatingMassSolar,
      );

    const boundaries =
      activeSystemBoundariesV1(
        stellarSystem,
        architecture.orbitTopology,
        orbitalLayout,
      );

    const boundaryFailure =
      (
        boundaries.innerClearanceAu !==
          null &&
        boundaries.innerClearanceAu <
          0
      ) ||
      (
        boundaries.outerClearanceAu !==
          null &&
        boundaries.outerClearanceAu <
          0
      );

    const hasUnstablePair =
      pairAssessments.some(
        pair =>
          pair.regime ===
          PlanetaryOrbitalPairStabilityRegime.UNSTABLE,
      );

    const hasMarginalPair =
      pairAssessments.some(
        pair =>
          pair.regime ===
          PlanetaryOrbitalPairStabilityRegime.MARGINAL,
      );

    const regime =
      boundaryFailure ||
        hasUnstablePair
        ? PlanetarySystemStabilityRegime.UNSTABLE
        : hasMarginalPair
          ? PlanetarySystemStabilityRegime.MARGINAL
          : PlanetarySystemStabilityRegime.STABLE;

    return new PlanetarySystemStabilityAssessment(
      stellarSystem.locator,
      architecture.orbitTopology,
      regime,
      architecture.planetCount,
      gravitatingMassSolar,
      boundaries.innerAu,
      boundaries.outerAu,
      boundaries.innerClearanceAu,
      boundaries.outerClearanceAu,
      pairAssessments,
    );
  }
}

interface StabilityBoundariesV1 {
  readonly innerAu:
    number | null;

  readonly outerAu:
    number | null;

  readonly innerClearanceAu:
    number | null;

  readonly outerClearanceAu:
    number | null;
}

function validateInputCardinality(
  architecture:
    PlanetarySystemArchitecture,

  orbitalLayout:
    PlanetarySystemOrbitalLayout,

  orbitalPeriodLayout:
    PlanetarySystemOrbitalPeriodLayout,
): void {

  if (
    architecture.orbitTopology !==
      orbitalLayout.orbitTopology ||
    orbitalLayout.orbitTopology !==
      orbitalPeriodLayout.orbitTopology
  ) {
    throw new RangeError(
      'Point-18.5 requires one common orbit topology across architecture, orbital layout and period layout.',
    );
  }

  if (
    architecture.planetCount !==
      orbitalLayout.planetCount ||
    orbitalLayout.planetCount !==
      orbitalPeriodLayout.planetCount
  ) {
    throw new RangeError(
      'Point-18.5 requires the point-18.2, 18.3 and 18.4 planet populations to match exactly.',
    );
  }
}

function generatePairAssessmentsV1(
  architecture:
    PlanetarySystemArchitecture,

  orbitalLayout:
    PlanetarySystemOrbitalLayout,

  orbitalPeriodLayout:
    PlanetarySystemOrbitalPeriodLayout,

  gravitatingMassSolar:
    number,
): readonly PlanetaryOrbitalPairStability[] {

  const pairs:
    PlanetaryOrbitalPairStability[] =
    [];

  const hostMassEarth =
    gravitatingMassSolar *
    V1_SOLAR_MASS_IN_EARTH_MASSES;

  for (
    let index = 0;
    index <
      architecture.planetCount -
        1;
    index += 1
  ) {
    const innerSlot =
      architecture
        .planetSlots[index];

    const outerSlot =
      architecture
        .planetSlots[index +
          1];

    const innerOrbit =
      orbitalLayout
        .orbits[index];

    const outerOrbit =
      orbitalLayout
        .orbits[index +
          1];

    const innerPeriod =
      orbitalPeriodLayout
        .periods[index];

    const outerPeriod =
      orbitalPeriodLayout
        .periods[index +
          1];

    const combinedReferenceMassEarth =
      innerSlot
        .inheritedSolidCoreMassEarth +
      outerSlot
        .inheritedSolidCoreMassEarth;

    const meanAxisAu =
      (
        innerOrbit.semiMajorAxisAu +
        outerOrbit.semiMajorAxisAu
      ) /
      2;

    const mutualHillRadiusAu =
      meanAxisAu *
      (
        combinedReferenceMassEarth /
        (
          3 *
          hostMassEarth
        )
      ) **
        (
          1 /
          3
        );

    const separationMutualHillRadii =
      (
        outerOrbit.semiMajorAxisAu -
        innerOrbit.semiMajorAxisAu
      ) /
      mutualHillRadiusAu;

    const radialClearanceAu =
      outerOrbit.periastronAu -
      innerOrbit.apoastronAu;

    const periodRatio =
      outerPeriod.periodDays /
      innerPeriod.periodDays;

    const mutualInclinationDegrees =
      mutualInclinationDegreesV1(
        innerOrbit.inclinationDegrees,
        innerOrbit.longitudeOfAscendingNodeDegrees,
        outerOrbit.inclinationDegrees,
        outerOrbit.longitudeOfAscendingNodeDegrees,
      );

    const regime =
      pairRegimeV1(
        radialClearanceAu,
        separationMutualHillRadii,
      );

    pairs.push(
      new PlanetaryOrbitalPairStability(
        innerSlot.planetOrdinal,
        outerSlot.planetOrdinal,
        innerOrbit.semiMajorAxisAu,
        outerOrbit.semiMajorAxisAu,
        innerOrbit.apoastronAu,
        outerOrbit.periastronAu,
        radialClearanceAu,
        innerSlot.inheritedSolidCoreMassEarth,
        outerSlot.inheritedSolidCoreMassEarth,
        mutualHillRadiusAu,
        separationMutualHillRadii,
        periodRatio,
        mutualInclinationDegrees,
        regime,
      ),
    );
  }

  return Object.freeze(
    pairs,
  );
}

function pairRegimeV1(
  radialClearanceAu:
    number,

  separationMutualHillRadii:
    number,
): PlanetaryOrbitalPairStabilityRegime {

  if (
    radialClearanceAu <=
      0 ||
    separationMutualHillRadii <
      PLANETARY_STABILITY_V1_HILL_UNSTABLE_THRESHOLD
  ) {
    return PlanetaryOrbitalPairStabilityRegime.UNSTABLE;
  }

  if (
    separationMutualHillRadii <
    PLANETARY_STABILITY_V1_CONSERVATIVE_STABLE_THRESHOLD
  ) {
    return PlanetaryOrbitalPairStabilityRegime.MARGINAL;
  }

  return PlanetaryOrbitalPairStabilityRegime.STABLE;
}

function emptySystemBoundariesV1(
  stellarSystem:
    StellarSystem,

  topology:
    PlanetarySystemOrbitTopology,
): StabilityBoundariesV1 {

  if (
    topology ===
    PlanetarySystemOrbitTopology.CIRCUMSTELLAR
  ) {
    return emptyBoundariesV1();
  }

  const compatibility =
    stellarSystem
      .circumbinaryPlanetCompatibility;

  if (
    compatibility ===
      null ||
    !compatibility.isCompatible
  ) {
    return emptyBoundariesV1();
  }

  return Object.freeze({
    innerAu:
      compatibility
        .minimumStableSemiMajorAxisAu,
    outerAu:
      compatibility
        .maximumStableSemiMajorAxisAu,
    innerClearanceAu:
      null,
    outerClearanceAu:
      null,
  });
}

function activeSystemBoundariesV1(
  stellarSystem:
    StellarSystem,

  topology:
    PlanetarySystemOrbitTopology,

  orbitalLayout:
    PlanetarySystemOrbitalLayout,
): StabilityBoundariesV1 {

  if (
    topology ===
    PlanetarySystemOrbitTopology.CIRCUMSTELLAR
  ) {
    return emptyBoundariesV1();
  }

  const compatibility =
    stellarSystem
      .circumbinaryPlanetCompatibility;

  if (
    compatibility ===
      null ||
    !compatibility.isCompatible
  ) {
    throw new RangeError(
      'A non-empty CIRCUMBINARY point-18.5 assessment requires the frozen point-16.5 compatible annulus.',
    );
  }

  const innermost =
    orbitalLayout
      .orbits[0];

  const outermost =
    orbitalLayout
      .orbits[
        orbitalLayout.orbits.length -
          1
      ];

  const innerAu =
    compatibility
      .minimumStableSemiMajorAxisAu;

  const outerAu =
    compatibility
      .maximumStableSemiMajorAxisAu;

  return Object.freeze({
    innerAu,
    outerAu,
    innerClearanceAu:
      innermost.periastronAu -
      innerAu,
    outerClearanceAu:
      outerAu ===
        null
        ? null
        : outerAu -
          outermost.apoastronAu,
  });
}

function emptyBoundariesV1():
  StabilityBoundariesV1 {

  return Object.freeze({
    innerAu:
      null,
    outerAu:
      null,
    innerClearanceAu:
      null,
    outerClearanceAu:
      null,
  });
}

function mutualInclinationDegreesV1(
  firstInclinationDegrees:
    number,

  firstNodeDegrees:
    number,

  secondInclinationDegrees:
    number,

  secondNodeDegrees:
    number,
): number {

  const firstInclination =
    degreesToRadians(
      firstInclinationDegrees,
    );

  const secondInclination =
    degreesToRadians(
      secondInclinationDegrees,
    );

  const nodeDifference =
    degreesToRadians(
      firstNodeDegrees -
      secondNodeDegrees,
    );

  const cosine =
    Math.cos(
      firstInclination,
    ) *
      Math.cos(
        secondInclination,
      ) +
    Math.sin(
      firstInclination,
    ) *
      Math.sin(
        secondInclination,
      ) *
      Math.cos(
        nodeDifference,
      );

  return radiansToDegrees(
    Math.acos(
      clamp(
        cosine,
        -1,
        1,
      ),
    ),
  );
}

function degreesToRadians(
  degrees:
    number,
): number {

  return degrees *
    Math.PI /
    180;
}

function radiansToDegrees(
  radians:
    number,
): number {

  return radians *
    180 /
    Math.PI;
}

function clamp(
  value:
    number,

  min:
    number,

  max:
    number,
): number {

  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}
