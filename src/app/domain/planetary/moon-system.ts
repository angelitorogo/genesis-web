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
  GiantMoonCompositionRegime,
} from './giant-moon-composition-regime';

import {
  type GiantMoonSystemProfile,
} from './giant-moon-system-profile';

import {
  type MoonIdentity,
} from './moon-identity';

import {
  type MoonPopulationProfile,
} from './moon-population-profile';

import {
  type Planet,
} from './planet';

import {
  type PlanetarySystem,
} from './planetary-system';

import {
  type RelevantMoon,
} from './relevant-moon';

const SOURCE_TOLERANCE =
  1e-9;

/**
 * Phase-21 root aggregate for the natural-satellite system of one mature Planet.
 *
 * Point 21.1 established the exact host-Planet boundary and point 21.2 added the
 * deterministic total modeled moon count. Point 21.3 now materializes only the
 * physically/orbitally relevant moon subset. Point 21.4 now enriches each
 * relevant moon with a frozen tidal/spin state, point 21.5 adds a frozen
 * first-order atmosphere/water/geology environment state, point 21.6 adds a
 * potential-habitability projection and point 21.7 specializes gas/ice-giant
 * systems without regenerating any prior moon property. Point 21.8 now assigns
 * one lightweight MoonIdentity to every modeled moon while only the relevant
 * subset retains full physical/orbital materialization. No life or biosignature
 * verdict is introduced.
 */
export class MoonSystem {

  readonly moonIdentities:
    readonly MoonIdentity[];

  readonly relevantMoons:
    readonly RelevantMoon[];

  constructor(
    readonly hostPlanet:
      Planet,

    readonly populationProfile:
      MoonPopulationProfile,

    moonIdentities:
      readonly MoonIdentity[],

    relevantMoons:
      readonly RelevantMoon[],

    readonly giantMoonProfile:
      GiantMoonSystemProfile,
  ) {
    if (
      !hostPlanet
        .isTypePhysicallyCoherent
    ) {
      throw new RangeError(
        'MoonSystem requires a point-19.7 physically coherent host Planet.',
      );
    }

    if (
      !Number.isInteger(
        hostPlanet
          .planetOrdinal,
      ) ||
      hostPlanet
        .planetOrdinal <=
        0
    ) {
      throw new RangeError(
        'MoonSystem requires a positive integer host planetOrdinal.',
      );
    }

    if (
      hostPlanet
        .locator
        .bodyIndex !==
      BigInt(
        hostPlanet
          .planetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'MoonSystem must preserve the canonical host BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      hostPlanet
        .seed
        .kind !==
      'body'
    ) {
      throw new RangeError(
        'MoonSystem requires the canonical BodySeed of its host Planet.',
      );
    }

    if (
      populationProfile
        .hostPlanetOrdinal !==
        hostPlanet
          .planetOrdinal ||
      !sameBodyLocator(
        populationProfile
          .hostPlanetLocator,
        hostPlanet
          .locator,
      ) ||
      populationProfile
        .hostPlanetSeed
        .normalizedValue !==
        hostPlanet
          .seed
          .normalizedValue
    ) {
      throw new RangeError(
        'MoonSystem point-21.2 population profile must preserve the exact host Planet identity.',
      );
    }

    if (
      populationProfile
        .sourcePlanetType !==
        hostPlanet
          .planetType ||
      !approximatelyEqual(
        populationProfile
          .sourceMassEarth,
        hostPlanet
          .massEarth,
      ) ||
      !approximatelyEqual(
        populationProfile
          .sourceRadiusEarth,
        hostPlanet
          .radiusEarth,
      ) ||
      !approximatelyEqual(
        populationProfile
          .sourceSemiMajorAxisAu,
        hostPlanet
          .orbit
          .semiMajorAxisAu,
      ) ||
      !approximatelyEqual(
        populationProfile
          .sourceEccentricity,
        hostPlanet
          .orbit
          .eccentricity,
      ) ||
      !approximatelyEqual(
        populationProfile
          .sourceGravitatingMassSolar,
        hostPlanet
          .orbitalPeriod
          .gravitatingMassSolar,
      )
    ) {
      throw new RangeError(
        'MoonSystem point-21.2 population sources must preserve the exact frozen host Planet type/bulk/orbital values.',
      );
    }

    if (
      moonIdentities.length !==
      populationProfile.moonCount
    ) {
      throw new RangeError(
        'MoonSystem point-21.8 requires exactly one MoonIdentity per modeled point-21.2 moon.',
      );
    }

    const identitySeeds =
      new Set<string>();

    const identityNames =
      new Set<string>();

    for (
      let index = 0;
      index <
        moonIdentities.length;
      index += 1
    ) {
      const identity =
        moonIdentities[index];

      if (
        identity.hostPlanetOrdinal !==
          hostPlanet.planetOrdinal ||
        identity.hostPlanetLocator !==
          hostPlanet.locator ||
        identity.hostPlanetSeed !==
          hostPlanet.seed ||
        identity.moonOrdinal !==
          index + 1 ||
        identity.locator.moonIndex !==
          BigInt(index)
      ) {
        throw new RangeError(
          'MoonSystem point-21.8 identities must preserve exact host identity and contiguous moonOrdinal order.',
        );
      }

      if (
        identitySeeds.has(
          identity.seed.normalizedValue,
        ) ||
        identityNames.has(
          identity.designation.name,
        )
      ) {
        throw new RangeError(
          'MoonSystem point-21.8 moon seeds/designations must be unique within the host planet.',
        );
      }

      identitySeeds.add(
        identity.seed.normalizedValue,
      );
      identityNames.add(
        identity.designation.name,
      );
    }

    if (
      giantMoonProfile
        .hostPlanetOrdinal !==
        hostPlanet
          .planetOrdinal ||
      giantMoonProfile
        .sourcePlanetType !==
        hostPlanet
          .planetType ||
      giantMoonProfile
        .sourceMoonCount !==
        populationProfile
          .moonCount ||
      giantMoonProfile
        .sourceRelevantMoonCount !==
        relevantMoons
          .length ||
      giantMoonProfile
        .sourceUnmaterializedMinorMoonCount !==
        populationProfile
          .moonCount -
        relevantMoons
          .length ||
      !approximatelyEqual(
        giantMoonProfile
          .sourceSatelliteCapacityIndex01,
        populationProfile
          .satelliteCapacityIndex01,
      )
    ) {
      throw new RangeError(
        'MoonSystem point-21.7 giant profile must preserve the exact host/population/relevant-moon sources.',
      );
    }

    if (
      relevantMoons.length >
      populationProfile
        .moonCount
    ) {
      throw new RangeError(
        'MoonSystem cannot materialize more relevant moons than the frozen point-21.2 moonCount.',
      );
    }

    let previousSemiMajorAxis =
      0;

    for (
      let index = 0;
      index <
      relevantMoons.length;
      index +=
        1
    ) {
      const moon =
        relevantMoons[index];

      if (
        moon
          .hostPlanetOrdinal !==
          hostPlanet
            .planetOrdinal ||
        !sameBodyLocator(
          moon
            .hostPlanetLocator,
          hostPlanet
            .locator,
        ) ||
        moon
          .hostPlanetSeed
          .normalizedValue !==
          hostPlanet
            .seed
            .normalizedValue ||
        moon
          .moonOrdinal !==
          index +
            1 ||
        moon.identity !==
          moonIdentities[index]
      ) {
        throw new RangeError(
          'MoonSystem relevant moons must preserve exact host identity and contiguous moonOrdinal order.',
        );
      }

      if (
        !approximatelyEqual(
          moon
            .tidalState
            .sourceHostPlanetMassEarth,
          hostPlanet
            .massEarth,
        ) ||
        !approximatelyEqual(
          moon
            .tidalState
            .sourceHostPlanetRadiusEarth,
          hostPlanet
            .radiusEarth,
        ) ||
        !approximatelyEqual(
          moon
            .tidalState
            .sourceHostPlanetRotationPeriodHours,
          hostPlanet
            .rotationPeriodHours,
        ) ||
        moon
          .tidalState
          .sourceHostPlanetIsRetrogradeRotation !==
        hostPlanet
          .isRetrogradeRotation
      ) {
        throw new RangeError(
          'MoonSystem relevant-moon tidal states must preserve the exact frozen host Planet bulk/rotation sources.',
        );
      }

      if (
        !approximatelyEqual(
          moon
            .environmentState
            .sourceReferenceMeanInsolationEarth,
          hostPlanet
            .typeClassification
            .referenceMeanInsolationEarth,
        ) ||
        !approximatelyEqual(
          moon
            .environmentState
            .sourceTidalHeatingIndex01,
          moon
            .tidalState
            .tidalHeatingIndex01,
        )
      ) {
        throw new RangeError(
          'MoonSystem relevant-moon environment states must preserve the exact frozen host insolation and point-21.4 tidal-heating sources.',
        );
      }

      if (
        moon
          .giantMoonState
          .sourceHostPlanetType !==
        hostPlanet
          .planetType
      ) {
        throw new RangeError(
          'MoonSystem relevant-moon giant specialization must preserve the exact host Planet type.',
        );
      }

      if (
        moon
          .semiMajorAxisPlanetRadii <=
        previousSemiMajorAxis
      ) {
        throw new RangeError(
          'MoonSystem relevant moons must be ordered from inner to outer orbit.',
        );
      }

      previousSemiMajorAxis =
        moon
          .semiMajorAxisPlanetRadii;
    }

    const applicableRelevantMoons =
      relevantMoons.filter(
        moon =>
          moon
            .giantMoonState
            .isApplicable,
      );

    if (
      giantMoonProfile
        .regularRelevantMoonCount !==
        applicableRelevantMoons
          .length ||
      giantMoonProfile
        .largeRelevantMoonCount !==
        applicableRelevantMoons.filter(
          moon =>
            moon
              .giantMoonState
              .isLargeMoon,
        ).length ||
      giantMoonProfile
        .iceRichRelevantMoonCount !==
        applicableRelevantMoons.filter(
          moon =>
            moon
              .giantMoonCompositionRegime ===
              GiantMoonCompositionRegime.ICE_RICH,
        ).length ||
      giantMoonProfile
        .oceanBearingRelevantMoonCount !==
        applicableRelevantMoons.filter(
          moon =>
            moon
              .giantMoonState
              .isOceanBearingCandidate,
        ).length ||
      giantMoonProfile
        .tidallyActiveRelevantMoonCount !==
        applicableRelevantMoons.filter(
          moon =>
            moon
              .giantMoonState
              .isTidallyActive,
        ).length ||
      giantMoonProfile
        .potentiallyHabitableRelevantMoonCount !==
        applicableRelevantMoons.filter(
          moon =>
            moon
              .giantMoonState
              .isHabitabilityCandidate,
        ).length
    ) {
      throw new RangeError(
        'MoonSystem point-21.7 giant profile counts must match the attached relevant-moon specializations.',
      );
    }

    this.moonIdentities =
      Object.freeze([
        ...moonIdentities,
      ]);

    this.relevantMoons =
      Object.freeze([
        ...relevantMoons,
      ]);
  }

  get generationKey():
    UniverseGenerationKey {

    return this
      .hostPlanet
      .generationKey;
  }

  get hostPlanetarySystem():
    PlanetarySystem {

    return this
      .hostPlanet
      .hostPlanetarySystem;
  }

  get systemLocator():
    SystemLocator {

    return this
      .hostPlanet
      .systemLocator;
  }

  get hostPlanetOrdinal():
    number {

    return this
      .hostPlanet
      .planetOrdinal;
  }

  get hostPlanetLocator():
    BodyLocator {

    return this
      .hostPlanet
      .locator;
  }

  get hostPlanetSeed():
    BodySeed {

    return this
      .hostPlanet
      .seed;
  }

  get moonCount():
    number {

    return this
      .populationProfile
      .moonCount;
  }

  get hasMoons():
    boolean {

    return this
      .populationProfile
      .hasMoons;
  }

  get satelliteCapacityIndex01():
    number {

    return this
      .populationProfile
      .satelliteCapacityIndex01;
  }

  get hillSphereRadiusPlanetRadii():
    number {

    return this
      .populationProfile
      .hillSphereRadiusPlanetRadii;
  }

  get moonDesignations() {
    return Object.freeze(
      this.moonIdentities.map(
        identity =>
          identity.designation,
      ),
    );
  }

  get relevantMoonIdentities():
    readonly MoonIdentity[] {

    return Object.freeze(
      this
        .moonIdentities
        .slice(
          0,
          this.relevantMoonCount,
        ),
    );
  }

  get relevantMoonCount():
    number {

    return this
      .relevantMoons
      .length;
  }

  get hasRelevantMoons():
    boolean {

    return this
      .relevantMoonCount >
      0;
  }

  get unmaterializedMinorMoonCount():
    number {

    return this
      .moonCount -
      this
        .relevantMoonCount;
  }

  get potentiallyHabitableMoonCount():
    number {

    return this
      .relevantMoons
      .filter(
        moon =>
          moon
            .isPotentiallyHabitable,
      )
      .length;
  }

  get surfaceHabitabilityCandidateCount():
    number {

    return this
      .relevantMoons
      .filter(
        moon =>
          moon
            .supportsPotentialSurfaceHabitability,
      )
      .length;
  }

  get subsurfaceHabitabilityCandidateCount():
    number {

    return this
      .relevantMoons
      .filter(
        moon =>
          moon
            .supportsPotentialSubsurfaceHabitability,
      )
      .length;
  }

  get hasPotentiallyHabitableMoons():
    boolean {

    return this
      .potentiallyHabitableMoonCount >
      0;
  }

  get hasGiantMoonArchitecture():
    boolean {

    return this
      .giantMoonProfile
      .isApplicable;
  }

  get giantMoonArchitectureRegime() {
    return this
      .giantMoonProfile
      .architectureRegime;
  }

  get estimatedIrregularMinorMoonCount():
    number {

    return this
      .giantMoonProfile
      .estimatedIrregularMinorMoonCount;
  }

  get largeGiantMoonCount():
    number {

    return this
      .giantMoonProfile
      .largeRelevantMoonCount;
  }

  get iceRichGiantMoonCount():
    number {

    return this
      .giantMoonProfile
      .iceRichRelevantMoonCount;
  }

  get oceanBearingGiantMoonCount():
    number {

    return this
      .giantMoonProfile
      .oceanBearingRelevantMoonCount;
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
    SOURCE_TOLERANCE *
      scale
  );
}
