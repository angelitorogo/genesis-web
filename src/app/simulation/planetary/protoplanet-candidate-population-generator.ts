import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type PlanetFormationProfile,
} from '../../domain/planetary/planet-formation-profile';

import {
  ProtoplanetaryCondensationRegionKind,
} from '../../domain/planetary/protoplanetary-condensation-region-kind';

import {
  type ProtoplanetaryDiskGap,
} from '../../domain/planetary/protoplanetary-disk-gap';

import {
  type ProtoplanetaryDiskProfile,
} from '../../domain/planetary/protoplanetary-disk-profile';

import {
  type ProtoplanetaryDiskStructure,
} from '../../domain/planetary/protoplanetary-disk-structure';

import {
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  ProtoplanetCandidate,
} from '../../domain/planetary/protoplanet-candidate';

import {
  ProtoplanetCandidateComposition,
} from '../../domain/planetary/protoplanet-candidate-composition';

import {
  ProtoplanetCandidatePopulation,
} from '../../domain/planetary/protoplanet-candidate-population';

const V1_CANDIDATE_BRANCH =
  utf8ToBytes(
    'GENESIS-PROTOPLANET-CANDIDATES-V1',
  );

const V1_SOLAR_MASS_IN_EARTH_MASSES =
  332_946.0487;

const V1_RADIAL_SITE_COUNT =
  96;

const V1_MAX_CANDIDATES =
  12;

const V1_MIN_CANDIDATE_SOLID_MASS_EARTH =
  0.001;

const V1_MAX_CANDIDATE_SOLID_MASS_EARTH =
  12.5;

const V1_MIN_RADIAL_SPACING_RATIO =
  1.16;

interface V1FormationSite {
  readonly index:
    number;

  readonly radiusAu:
    number;

  readonly baseMassWeight:
    number;

  readonly availableSolidWeight:
    number;

  readonly selectionWeight:
    number;

  readonly localDustRetentionFraction01:
    number;

  readonly sourceCondensationRegionKind:
    ProtoplanetaryCondensationRegionKind;

  readonly composition:
    ProtoplanetCandidateComposition;

  readonly formationPropensity01:
    number;
}

/**
 * Point-17.4 deterministic materializer of initial protoplanet candidates.
 *
 * V1 converts only a bounded fraction of the frozen point-17.3 dust reservoir
 * into distinct solid candidates. Candidate sites are weighted by the point-
 * 17.2 surface-density envelope, point-17.3 condensable-solid availability,
 * dust depletion inside gaps and the already-frozen sector formation profile.
 *
 * The generator intentionally creates no migration, eccentricity, inclination,
 * resonances, mergers or collision history. Those transformations belong to
 * point 17.5. Gas is not added to candidate mass here: gasAccretionPotential01
 * only records whether a solid core has favorable conditions for future growth.
 */
export class ProtoplanetCandidatePopulationGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    systemSeed:
      SystemSeed,

    diskProfile:
      ProtoplanetaryDiskProfile,

    diskStructure:
      ProtoplanetaryDiskStructure,

    planetFormationProfile:
      PlanetFormationProfile,
  ): ProtoplanetCandidatePopulation {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        systemSeed,
        diskProfile,
        diskStructure,
        planetFormationProfile,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    systemSeed:
      SystemSeed,

    diskProfile:
      ProtoplanetaryDiskProfile,

    diskStructure:
      ProtoplanetaryDiskStructure,

    planetFormationProfile:
      PlanetFormationProfile,
  ): ProtoplanetCandidatePopulation {

    assertDiskConsistencyV1(
      diskProfile,
      diskStructure,
    );

    const sourceDustMassEarth =
      diskStructure
        .dustMassSolar *
      V1_SOLAR_MASS_IN_EARTH_MASSES;

    const sites =
      formationSitesV1(
        diskProfile,
        diskStructure,
        planetFormationProfile,
      );

    const totalBaseMassWeight =
      sum(
        sites.map(
          site =>
            site.baseMassWeight,
        ),
      );

    const totalAvailableSolidWeight =
      sum(
        sites.map(
          site =>
            site.availableSolidWeight,
        ),
      );

    const condensableDustMassEarth =
      totalBaseMassWeight <=
        0
        ? 0
        : sourceDustMassEarth *
          totalAvailableSolidWeight /
          totalBaseMassWeight;

    if (
      condensableDustMassEarth <
      V1_MIN_CANDIDATE_SOLID_MASS_EARTH
    ) {
      return emptyPopulationV1(
        diskStructure,
        sourceDustMassEarth,
      );
    }

    const maturity01 =
      candidateMaturityV1(
        diskProfile
          .evolutionProgress01,
      );

    const supply01 =
      clamp01(
        Math.log10(
          1 +
          condensableDustMassEarth,
        ) /
        1.6,
      );

    const presenceProbability01 =
      clamp01(
        planetFormationProfile
          .overallPlanetFormationProbability *
        (
          0.20 +
          0.80 *
            maturity01
        ) *
        (
          0.35 +
          0.65 *
            supply01
        ),
      );

    if (
      deterministicUnitV1(
        systemSeed,
        'population-presence',
      ) >=
      presenceProbability01
    ) {
      return emptyPopulationV1(
        diskStructure,
        sourceDustMassEarth,
      );
    }

    const conversionTargetFraction01 =
      clamp(
        0.008 +
          0.24 *
            maturity01 *
            planetFormationProfile
              .overallPlanetFormationProbability *
            (
              0.30 +
              0.70 *
                planetFormationProfile
                  .solidMaterialIndex
            ) *
            (
              0.72 +
              0.28 *
                diskStructure
                  .dustSettlingIndex01
            ),
        0,
        0.28,
      );

    const targetCandidateMassEarth =
      condensableDustMassEarth *
      conversionTargetFraction01;

    if (
      targetCandidateMassEarth <
      V1_MIN_CANDIDATE_SOLID_MASS_EARTH
    ) {
      return emptyPopulationV1(
        diskStructure,
        sourceDustMassEarth,
      );
    }

    const maximumByMass =
      Math.max(
        1,
        Math.floor(
          targetCandidateMassEarth /
          V1_MIN_CANDIDATE_SOLID_MASS_EARTH,
        ),
      );

    const logarithmicCapacity =
      1 +
      Math.floor(
        Math.log2(
          1 +
          condensableDustMassEarth,
        ) *
        (
          0.75 +
          1.35 *
            planetFormationProfile
              .overallPlanetFormationProbability
        ) *
        (
          0.45 +
          0.55 *
            maturity01
        ),
      );

    const countJitter =
      0.68 +
      0.32 *
        deterministicUnitV1(
          systemSeed,
          'candidate-count-jitter',
        );

    const desiredCandidateCount =
      clampInteger(
        Math.round(
          logarithmicCapacity *
          countJitter,
        ),
        1,
        Math.min(
          V1_MAX_CANDIDATES,
          maximumByMass,
        ),
      );

    const selectedSites =
      selectSeparatedSitesV1(
        systemSeed,
        sites,
        desiredCandidateCount,
      );

    if (
      selectedSites.length ===
      0
    ) {
      return emptyPopulationV1(
        diskStructure,
        sourceDustMassEarth,
      );
    }

    const candidateMassWeights =
      selectedSites.map(
        site =>
          Math.max(
            1e-12,
            site.availableSolidWeight *
              (
                0.60 +
                0.80 *
                  deterministicUnitV1(
                    systemSeed,
                    `candidate-mass-weight:${site.index}`,
                  )
              ),
          ),
      );

    const totalCandidateMassWeight =
      sum(
        candidateMassWeights,
      );

    const rawCandidates =
      selectedSites
        .map(
          (
            site,
            index,
          ) => {
            const solidMassEarth =
              Math.min(
                V1_MAX_CANDIDATE_SOLID_MASS_EARTH,
                targetCandidateMassEarth *
                  candidateMassWeights[index] /
                  totalCandidateMassWeight,
              );

            if (
              solidMassEarth <
              V1_MIN_CANDIDATE_SOLID_MASS_EARTH
            ) {
              return null;
            }

            const normalizedSelectionWeight01 =
              normalizedSiteWeightV1(
                site.selectionWeight,
                sites,
              );

            const remainingDiskLifetime01 =
              1 -
              diskProfile
                .evolutionProgress01;

            const growthPotential01 =
              clamp01(
                0.16 *
                  site.formationPropensity01 +
                0.28 *
                  normalizedSelectionWeight01 +
                0.22 *
                  diskStructure
                    .dustSettlingIndex01 +
                0.24 *
                  remainingDiskLifetime01 +
                0.10 *
                  deterministicUnitV1(
                    systemSeed,
                    `candidate-growth:${site.index}`,
                  ),
              );

            const snowLineRadiusAu =
              diskStructure
                .waterSnowLineRadiusAuOrNull;

            const beyondWaterSnowLine =
              snowLineRadiusAu !==
                null &&
              site.radiusAu >=
                snowLineRadiusAu;

            const massCoreFactor01 =
              clamp01(
                Math.log10(
                  1 +
                  solidMassEarth,
                ) /
                Math.log10(
                  1 +
                  8,
                ),
              );

            const gasSupply01 =
              clamp01(
                diskStructure
                  .gasMassFraction01 *
                (
                  1 -
                  diskStructure
                    .gasDepletionIndex01
                ) *
                localGasRetentionFractionV1(
                  site.radiusAu,
                  diskStructure.gaps,
                ),
              );

            const gasAccretionPotential01 =
              clamp01(
                planetFormationProfile
                  .giantPlanetFormationPropensity *
                gasSupply01 *
                (
                  beyondWaterSnowLine
                    ? 1
                    : 0.35
                ) *
                (
                  0.18 +
                  0.82 *
                    massCoreFactor01
                ) *
                (
                  0.88 +
                  0.12 *
                    deterministicUnitV1(
                      systemSeed,
                      `candidate-gas-potential:${site.index}`,
                    )
                ),
              );

            return new ProtoplanetCandidate(
              index +
                1,
              site.radiusAu,
              solidMassEarth,
              site.composition,
              site.sourceCondensationRegionKind,
              site.localDustRetentionFraction01,
              growthPotential01,
              gasAccretionPotential01,
            );
          },
        )
        .filter(
          (
            candidate,
          ): candidate is ProtoplanetCandidate =>
            candidate !==
            null,
        )
        .sort(
          (
            first,
            second,
          ) =>
            first.orbitalRadiusAu -
            second.orbitalRadiusAu,
        );

    const candidateSolidMassEarth =
      sum(
        rawCandidates.map(
          candidate =>
            candidate.solidMassEarth,
        ),
      );

    const residualDustMassEarth =
      sourceDustMassEarth -
      candidateSolidMassEarth;

    return new ProtoplanetCandidatePopulation(
      diskStructure
        .sourceInnerRadiusAu,
      diskStructure
        .sourceOuterRadiusAu,
      sourceDustMassEarth,
      candidateSolidMassEarth,
      residualDustMassEarth,
      sourceDustMassEarth ===
        0
        ? 0
        : candidateSolidMassEarth /
          sourceDustMassEarth,
      rawCandidates,
    );
  }
}

function formationSitesV1(
  diskProfile:
    ProtoplanetaryDiskProfile,

  diskStructure:
    ProtoplanetaryDiskStructure,

  planetFormationProfile:
    PlanetFormationProfile,
): readonly V1FormationSite[] {

  const logInnerRadius =
    Math.log(
      diskProfile
        .innerRadiusAu,
    );

  const logOuterRadius =
    Math.log(
      diskProfile
        .outerRadiusAu,
    );

  const sites:
    V1FormationSite[] =
      [];

  for (
    let index = 0;
    index <
      V1_RADIAL_SITE_COUNT;
    index += 1
  ) {
    const normalizedPosition =
      (
        index +
        0.5
      ) /
      V1_RADIAL_SITE_COUNT;

    const radiusAu =
      Math.exp(
        logInnerRadius +
          normalizedPosition *
            (
              logOuterRadius -
              logInnerRadius
            ),
      );

    const region =
      diskStructure
        .condensationRegions
        .find(
          (
            candidateRegion,
            regionIndex,
          ) =>
            radiusAu >=
              candidateRegion
                .innerRadiusAu &&
            (
              radiusAu <
                candidateRegion
                  .outerRadiusAu ||
              regionIndex ===
                diskStructure
                  .condensationRegions
                  .length -
                  1
            ),
        );

    if (
      region ===
      undefined
    ) {
      continue;
    }

    const baseMassWeight =
      radiusAu **
        (
          2 -
          diskProfile
            .surfaceDensityPowerLawExponent
        ) *
      Math.exp(
        -radiusAu /
          diskProfile
            .characteristicRadiusAu,
      );

    const localDustRetentionFraction01 =
      localDustRetentionFractionV1(
        radiusAu,
        diskStructure.gaps,
      );

    const formationPropensity01 =
      formationPropensityV1(
        region.kind,
        planetFormationProfile,
      );

    const availableSolidWeight =
      baseMassWeight *
      region.kind
        .condensableSolidFraction01 *
      localDustRetentionFraction01;

    const selectionWeight =
      availableSolidWeight *
      (
        0.35 +
        0.65 *
          formationPropensity01
      ) *
      (
        0.55 +
        0.45 *
          diskStructure
            .dustSettlingIndex01
      );

    sites.push({
      index,
      radiusAu,
      baseMassWeight,
      availableSolidWeight,
      selectionWeight,
      localDustRetentionFraction01,
      sourceCondensationRegionKind:
        region.kind,
      composition:
        compositionForRegionV1(
          region.kind,
        ),
      formationPropensity01,
    });
  }

  return sites;
}

function selectSeparatedSitesV1(
  systemSeed:
    SystemSeed,

  sites:
    readonly V1FormationSite[],

  desiredCandidateCount:
    number,
): readonly V1FormationSite[] {

  const ranked =
    sites
      .filter(
        site =>
          site.selectionWeight >
          0,
      )
      .map(
        site => {
          const unit =
            Math.max(
              1e-15,
              deterministicUnitV1(
                systemSeed,
                `site-priority:${site.index}`,
              ),
            );

          return {
            site,
            priority:
              -Math.log(
                unit,
              ) /
              site.selectionWeight,
          };
        },
      )
      .sort(
        (
          first,
          second,
        ) =>
          first.priority -
          second.priority,
      );

  const selected:
    V1FormationSite[] =
      [];

  for (
    const entry
    of ranked
  ) {
    const separated =
      selected.every(
        existing =>
          radialSpacingRatioV1(
            entry.site.radiusAu,
            existing.radiusAu,
          ) >=
          V1_MIN_RADIAL_SPACING_RATIO,
      );

    if (
      !separated
    ) {
      continue;
    }

    selected.push(
      entry.site,
    );

    if (
      selected.length >=
      desiredCandidateCount
    ) {
      break;
    }
  }

  return selected;
}

function compositionForRegionV1(
  regionKind:
    ProtoplanetaryCondensationRegionKind,
): ProtoplanetCandidateComposition {

  if (
    regionKind ===
    ProtoplanetaryCondensationRegionKind.REFRACTORY_SOLIDS
  ) {
    return ProtoplanetCandidateComposition
      .REFRACTORY_RICH;
  }

  if (
    regionKind ===
    ProtoplanetaryCondensationRegionKind.ROCKY_SILICATE_SOLIDS
  ) {
    return ProtoplanetCandidateComposition
      .ROCKY;
  }

  if (
    regionKind ===
    ProtoplanetaryCondensationRegionKind.WATER_ICE_RICH_SOLIDS
  ) {
    return ProtoplanetCandidateComposition
      .ICE_RICH;
  }

  if (
    regionKind ===
      ProtoplanetaryCondensationRegionKind.CO2_ICE_RICH_SOLIDS ||
    regionKind ===
      ProtoplanetaryCondensationRegionKind.VOLATILE_ICE_RICH_SOLIDS
  ) {
    return ProtoplanetCandidateComposition
      .VOLATILE_RICH;
  }

  return ProtoplanetCandidateComposition
    .REFRACTORY_RICH;
}

function formationPropensityV1(
  regionKind:
    ProtoplanetaryCondensationRegionKind,

  profile:
    PlanetFormationProfile,
): number {

  if (
    regionKind ===
    ProtoplanetaryCondensationRegionKind.DUST_SUBLIMATION_ZONE
  ) {
    return 0;
  }

  if (
    regionKind ===
      ProtoplanetaryCondensationRegionKind.REFRACTORY_SOLIDS ||
    regionKind ===
      ProtoplanetaryCondensationRegionKind.ROCKY_SILICATE_SOLIDS
  ) {
    return profile
      .rockyPlanetFormationPropensity;
  }

  return profile
    .iceRichPlanetFormationPropensity;
}

function localDustRetentionFractionV1(
  radiusAu:
    number,

  gaps:
    readonly ProtoplanetaryDiskGap[],
): number {

  const gap =
    gaps.find(
      candidate =>
        radiusAu >=
          candidate.innerRadiusAu &&
        radiusAu <=
          candidate.outerRadiusAu,
    );

  return (
    gap ===
      undefined
      ? 1
      : 1 -
        gap.dustDepletionFraction01
  );
}

function localGasRetentionFractionV1(
  radiusAu:
    number,

  gaps:
    readonly ProtoplanetaryDiskGap[],
): number {

  const gap =
    gaps.find(
      candidate =>
        radiusAu >=
          candidate.innerRadiusAu &&
        radiusAu <=
          candidate.outerRadiusAu,
    );

  return (
    gap ===
      undefined
      ? 1
      : 1 -
        gap.gasDepletionFraction01
  );
}

function candidateMaturityV1(
  evolutionProgress01:
    number,
): number {

  return clamp01(
    0.04 +
      0.96 *
        evolutionProgress01 **
          0.65,
  );
}

function normalizedSiteWeightV1(
  selectionWeight:
    number,

  sites:
    readonly V1FormationSite[],
): number {

  const maximum =
    Math.max(
      ...sites.map(
        site =>
          site.selectionWeight,
      ),
      0,
    );

  return (
    maximum <=
      0
      ? 0
      : clamp01(
        selectionWeight /
        maximum,
      )
  );
}

function radialSpacingRatioV1(
  firstRadiusAu:
    number,

  secondRadiusAu:
    number,
): number {

  const larger =
    Math.max(
      firstRadiusAu,
      secondRadiusAu,
    );

  const smaller =
    Math.min(
      firstRadiusAu,
      secondRadiusAu,
    );

  return larger /
    smaller;
}

function emptyPopulationV1(
  diskStructure:
    ProtoplanetaryDiskStructure,

  sourceDustMassEarth:
    number,
): ProtoplanetCandidatePopulation {

  return new ProtoplanetCandidatePopulation(
    diskStructure
      .sourceInnerRadiusAu,
    diskStructure
      .sourceOuterRadiusAu,
    sourceDustMassEarth,
    0,
    sourceDustMassEarth,
    0,
    [],
  );
}

function assertDiskConsistencyV1(
  diskProfile:
    ProtoplanetaryDiskProfile,

  diskStructure:
    ProtoplanetaryDiskStructure,
): void {

  if (
    !approximatelyEqual(
      diskProfile
        .diskMassSolar,
      diskStructure
        .sourceDiskMassSolar,
    ) ||
    !approximatelyEqual(
      diskProfile
        .innerRadiusAu,
      diskStructure
        .sourceInnerRadiusAu,
    ) ||
    !approximatelyEqual(
      diskProfile
        .outerRadiusAu,
      diskStructure
        .sourceOuterRadiusAu,
    )
  ) {
    throw new RangeError(
      'Point-17.4 disk profile/structure inputs must describe the same frozen point-17.2 envelope.',
    );
  }
}

function deterministicUnitV1(
  systemSeed:
    SystemSeed,

  label:
    string,
): number {

  const digest =
    sha256
      .create()
      .update(
        V1_CANDIDATE_BRANCH,
      )
      .update(
        hexToBytes(
          systemSeed
            .normalizedValue,
        ),
      )
      .update(
        utf8ToBytes(
          label,
        ),
      )
      .digest();

  let value =
    0;

  for (
    let index = 0;
    index < 6;
    index += 1
  ) {
    value =
      value *
        256 +
      digest[
        index
      ];
  }

  return value /
    2 **
      48;
}

function sum(
  values:
    readonly number[],
): number {

  return values.reduce(
    (
      total,
      value,
    ) =>
      total +
      value,
    0,
  );
}

function clampInteger(
  value:
    number,

  min:
    number,

  max:
    number,
): number {

  return Math.trunc(
    clamp(
      value,
      min,
      max,
    ),
  );
}

function clamp01(
  value:
    number,
): number {

  return clamp(
    value,
    0,
    1,
  );
}

function clamp(
  value:
    number,

  min:
    number,

  max:
    number,
): number {

  if (
    max <
    min
  ) {
    return min;
  }

  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}

function approximatelyEqual(
  first:
    number,

  second:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        first,
      ),
      Math.abs(
        second,
      ),
    );

  return Math.abs(
    first -
    second,
  ) <=
    1e-9 *
      scale;
}
