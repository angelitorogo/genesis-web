import {
  GiantMoonArchitectureRegime,
  giantMoonArchitectureRegimeV1,
} from '../../domain/planetary/giant-moon-architecture-regime';

import {
  GiantMoonCompositionRegime,
  giantMoonCompositionRegimeV1,
} from '../../domain/planetary/giant-moon-composition-regime';

import {
  giantMoonOrbitalFamilyV1,
} from '../../domain/planetary/giant-moon-orbital-family';

import {
  GiantMoonState,
  isGiantPlanetTypeV1,
  largeMoonRadiusThresholdEarthV1,
} from '../../domain/planetary/giant-moon-state';

import {
  GiantMoonSystemProfile,
} from '../../domain/planetary/giant-moon-system-profile';

import {
  type MoonEnvironmentState,
} from '../../domain/planetary/moon-environment-state';

import {
  type MoonHabitabilityState,
} from '../../domain/planetary/moon-habitability-state';

import {
  type MoonOrbitalElements,
} from '../../domain/planetary/moon-orbital-elements';

import {
  type MoonPhysicalProperties,
} from '../../domain/planetary/moon-physical-properties';

import {
  type MoonPopulationProfile,
} from '../../domain/planetary/moon-population-profile';

import {
  type MoonTidalState,
} from '../../domain/planetary/moon-tidal-state';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type RelevantMoon,
} from '../../domain/planetary/relevant-moon';

/**
 * Point-21.7 deterministic specialization for gas/ice-giant satellite systems.
 *
 * No frozen 21.2-21.6 property is regenerated. Relevant moons are classified as
 * the regular population already materialized by 21.3, while only the remaining
 * minor count is split into regular vs irregular/captured estimates. No new seed,
 * hash or PRNG draw is consumed.
 */
export class GiantMoonArchitectureEngine {

  private constructor() {}

  static generateMoonState(
    hostPlanet:
      Planet,

    physical:
      MoonPhysicalProperties,

    orbit:
      MoonOrbitalElements,

    tidalState:
      MoonTidalState,

    environmentState:
      MoonEnvironmentState,

    habitabilityState:
      MoonHabitabilityState,
  ): GiantMoonState {
    assertMoonSourceAlignment(
      hostPlanet,
      physical,
      orbit,
      tidalState,
      environmentState,
      habitabilityState,
    );

    const giantHost =
      isGiantPlanetTypeV1(
        hostPlanet
          .planetType,
      );

    return new GiantMoonState(
      hostPlanet
        .planetOrdinal,
      physical
        .moonOrdinal,
      hostPlanet
        .planetType,
      physical
        .massEarth,
      physical
        .radiusEarth,
      orbit
        .semiMajorAxisPlanetRadii,
      orbit
        .eccentricity,
      orbit
        .inclinationDegrees,
      environmentState
        .inferredIceRichnessIndex01,
      tidalState
        .tidalHeatingIndex01,
      environmentState
        .subsurfaceOceanPotentialIndex01,
      environmentState
        .surfaceLiquidWaterPotentialIndex01,
      habitabilityState
        .overallHabitabilityIndex01,
      habitabilityState
        .isPotentiallyHabitable,
      giantMoonOrbitalFamilyV1(
        giantHost,
        orbit
          .semiMajorAxisPlanetRadii,
      ),
      giantMoonCompositionRegimeV1(
        giantHost,
        environmentState
          .inferredIceRichnessIndex01,
      ),
      giantHost &&
        physical
          .radiusEarth >=
        largeMoonRadiusThresholdEarthV1(
          hostPlanet
            .planetType,
        ),
      giantHost &&
        tidalState
          .tidalHeatingIndex01 >=
        0.45,
      giantHost &&
        (
          environmentState
            .subsurfaceOceanPotentialIndex01 >=
            0.35 ||
          environmentState
            .surfaceLiquidWaterPotentialIndex01 >=
            0.35
        ),
      giantHost &&
        habitabilityState
          .isPotentiallyHabitable,
    );
  }

  static generateSystemProfile(
    hostPlanet:
      Planet,

    populationProfile:
      MoonPopulationProfile,

    relevantMoons:
      readonly RelevantMoon[],
  ): GiantMoonSystemProfile {
    if (
      populationProfile
        .hostPlanetOrdinal !==
      hostPlanet
        .planetOrdinal ||
      populationProfile
        .sourcePlanetType !==
      hostPlanet
        .planetType
    ) {
      throw new RangeError(
        'GiantMoonArchitectureEngine requires the exact host/population identity.',
      );
    }

    const unmaterializedMinorMoonCount =
      populationProfile
        .moonCount -
      relevantMoons
        .length;

    if (
      unmaterializedMinorMoonCount <
      0
    ) {
      throw new RangeError(
        'Relevant moon count cannot exceed the point-21.2 total moon population.',
      );
    }

    const giantHost =
      isGiantPlanetTypeV1(
        hostPlanet
          .planetType,
      );

    if (
      !giantHost
    ) {
      return new GiantMoonSystemProfile(
        hostPlanet
          .planetOrdinal,
        hostPlanet
          .planetType,
        populationProfile
          .moonCount,
        relevantMoons
          .length,
        unmaterializedMinorMoonCount,
        populationProfile
          .satelliteCapacityIndex01,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        GiantMoonArchitectureRegime.NOT_APPLICABLE,
      );
    }

    for (
      const moon of
      relevantMoons
    ) {
      if (
        moon
          .hostPlanetOrdinal !==
          hostPlanet
            .planetOrdinal ||
        moon
          .giantMoonState
          .sourceHostPlanetType !==
          hostPlanet
            .planetType ||
        !moon
          .giantMoonState
          .isApplicable
      ) {
        throw new RangeError(
          'Giant-host relevant moons must carry an aligned applicable point-21.7 GiantMoonState.',
        );
      }
    }

    const irregularFraction01 =
      irregularMinorFractionV1(
        hostPlanet
          .planetType,
        populationProfile
          .satelliteCapacityIndex01,
      );

    const estimatedIrregularMinorMoonCount =
      Math.round(
        unmaterializedMinorMoonCount *
        irregularFraction01,
      );

    const estimatedRegularMinorMoonCount =
      unmaterializedMinorMoonCount -
      estimatedIrregularMinorMoonCount;

    const largeRelevantMoonCount =
      relevantMoons.filter(
        moon =>
          moon
            .giantMoonState
            .isLargeMoon,
      ).length;

    const iceRichRelevantMoonCount =
      relevantMoons.filter(
        moon =>
          moon
            .giantMoonState
            .compositionRegime ===
          GiantMoonCompositionRegime.ICE_RICH,
      ).length;

    const oceanBearingRelevantMoonCount =
      relevantMoons.filter(
        moon =>
          moon
            .giantMoonState
            .isOceanBearingCandidate,
      ).length;

    const tidallyActiveRelevantMoonCount =
      relevantMoons.filter(
        moon =>
          moon
            .giantMoonState
            .isTidallyActive,
      ).length;

    const potentiallyHabitableRelevantMoonCount =
      relevantMoons.filter(
        moon =>
          moon
            .giantMoonState
            .isHabitabilityCandidate,
      ).length;

    const richnessIndex01 =
      richnessIndexV1(
        hostPlanet
          .planetType,
        populationProfile
          .moonCount,
        relevantMoons
          .length,
        largeRelevantMoonCount,
        oceanBearingRelevantMoonCount,
        tidallyActiveRelevantMoonCount,
      );

    return new GiantMoonSystemProfile(
      hostPlanet
        .planetOrdinal,
      hostPlanet
        .planetType,
      populationProfile
        .moonCount,
      relevantMoons
        .length,
      unmaterializedMinorMoonCount,
      populationProfile
        .satelliteCapacityIndex01,
      relevantMoons
        .length,
      largeRelevantMoonCount,
      iceRichRelevantMoonCount,
      oceanBearingRelevantMoonCount,
      tidallyActiveRelevantMoonCount,
      potentiallyHabitableRelevantMoonCount,
      estimatedRegularMinorMoonCount,
      estimatedIrregularMinorMoonCount,
      richnessIndex01,
      giantMoonArchitectureRegimeV1(
        true,
        populationProfile
          .moonCount,
        richnessIndex01,
      ),
    );
  }
}

function irregularMinorFractionV1(
  planetType:
    PlanetType,

  satelliteCapacityIndex01:
    number,
): number {

  const baseline =
    planetType ===
      PlanetType.GAS_GIANT
      ? 0.62
      : 0.50;

  return clamp01(
    baseline +
    0.18 *
      satelliteCapacityIndex01,
  );
}

function richnessIndexV1(
  planetType:
    PlanetType,

  moonCount:
    number,

  relevantMoonCount:
    number,

  largeRelevantMoonCount:
    number,

  oceanBearingRelevantMoonCount:
    number,

  tidallyActiveRelevantMoonCount:
    number,
): number {

  const populationReference =
    planetType ===
      PlanetType.GAS_GIANT
      ? 120
      : 60;

  const largeMoonReference =
    planetType ===
      PlanetType.GAS_GIANT
      ? 4
      : 5;

  const populationSupport =
    clamp01(
      moonCount /
      populationReference,
    );

  const largeMoonSupport =
    clamp01(
      largeRelevantMoonCount /
      largeMoonReference,
    );

  const oceanSupport =
    relevantMoonCount ===
      0
      ? 0
      : oceanBearingRelevantMoonCount /
        relevantMoonCount;

  const tidalSupport =
    clamp01(
      tidallyActiveRelevantMoonCount /
      2,
    );

  return clamp01(
    0.40 *
      populationSupport +
    0.25 *
      largeMoonSupport +
    0.20 *
      oceanSupport +
    0.15 *
      tidalSupport,
  );
}

function assertMoonSourceAlignment(
  hostPlanet:
    Planet,

  physical:
    MoonPhysicalProperties,

  orbit:
    MoonOrbitalElements,

  tidalState:
    MoonTidalState,

  environmentState:
    MoonEnvironmentState,

  habitabilityState:
    MoonHabitabilityState,
): void {
  const hostOrdinal =
    hostPlanet
      .planetOrdinal;

  const moonOrdinal =
    physical
      .moonOrdinal;

  if (
    physical
      .hostPlanetOrdinal !==
      hostOrdinal ||
    orbit
      .hostPlanetOrdinal !==
      hostOrdinal ||
    tidalState
      .hostPlanetOrdinal !==
      hostOrdinal ||
    environmentState
      .hostPlanetOrdinal !==
      hostOrdinal ||
    habitabilityState
      .hostPlanetOrdinal !==
      hostOrdinal ||
    orbit
      .moonOrdinal !==
      moonOrdinal ||
    tidalState
      .moonOrdinal !==
      moonOrdinal ||
    environmentState
      .moonOrdinal !==
      moonOrdinal ||
    habitabilityState
      .moonOrdinal !==
      moonOrdinal
  ) {
    throw new RangeError(
      'GiantMoonArchitectureEngine requires aligned host/moon ordinals across frozen point-21.3-21.6 sources.',
    );
  }
}

function clamp01(
  value:
    number,
): number {
  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}
