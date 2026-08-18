import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  GlobularClusterPhysicalProperties,
} from '../../domain/galactic-object/globular-cluster-physical-properties';

import {
  GlobularCluster,
} from '../../domain/galactic-object/globular-cluster';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ExplorationSectorResultEngine,
} from '../exploration/exploration-sector-result-engine';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  GalaxySectorGridGenerator,
} from '../sector/galaxy-sector-grid-generator';

import {
  GalaxySectorStellarDensityGenerator,
} from '../sector/galaxy-sector-stellar-density-generator';

import {
  GalaxySectorStellarPopulationPropertiesGenerator,
} from '../sector/galaxy-sector-stellar-population-properties-generator';

import {
  StellarPopulationProfileGenerator,
} from '../stellar/stellar-population-profile-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  GalacticObjectGenerator,
} from './galactic-object-generator';

import {
  OpenClusterGenerator,
} from './open-cluster-generator';

const V1_GLOBULAR_CLUSTER_DOMAIN =
  utf8ToBytes(
    'GENESIS-GLOBULAR-CLUSTER-V1',
  );

const V1_STELLAR_COUNT_LABEL =
  utf8ToBytes(
    'stellar-count',
  );

const V1_MEAN_STELLAR_MASS_LABEL =
  utf8ToBytes(
    'mean-stellar-mass',
  );

const V1_AGE_LABEL =
  utf8ToBytes(
    'age-billion-years',
  );

const V1_METALLICITY_LABEL =
  utf8ToBytes(
    'metallicity-factor',
  );

const V1_CORE_RADIUS_LABEL =
  utf8ToBytes(
    'core-radius-parsecs',
  );

const V1_HALF_LIGHT_RADIUS_LABEL =
  utf8ToBytes(
    'half-light-radius-offset',
  );

const V1_TIDAL_RADIUS_LABEL =
  utf8ToBytes(
    'tidal-radius-factor',
  );

const V1_CONCENTRATION_LABEL =
  utf8ToBytes(
    'central-concentration',
  );

const V1_REMNANT_FRACTION_LABEL =
  utf8ToBytes(
    'stellar-remnant-fraction',
  );

const V1_MIN_STELLAR_COUNT =
  20_000;

const V1_MAX_STELLAR_COUNT =
  2_000_000;

const UINT32_SCALE =
  4294967296;

/**
 * Deterministic point-12.5 Ground Truth generator for globular clusters.
 *
 * Point 12.4 froze an isolated membership branch that assigns 82% of the
 * canonical point-9.4 STAR_CLUSTER family to OpenCluster. Point 12.5 consumes
 * the exact complement of that already-frozen branch. Therefore every V1
 * STAR_CLUSTER locator is now classified physically as exactly one of:
 *
 * - OpenCluster;
 * - GlobularCluster.
 *
 * No second membership draw is introduced, so point-12.4 identities cannot
 * move and no STAR_CLUSTER locator is left orphaned or assigned twice.
 *
 * Globular-cluster age is constrained by the host-galaxy age. Metallicity is
 * conditioned on the already-existing sector stellar environment, while the
 * remnant fraction also uses the statistical stellar-population profile.
 * Individual stars are never materialized.
 *
 * Every stochastic-looking intrinsic property uses an independent SHA-256
 * label. No repository, observation state, Discovery Points, scientific
 * action or renderer is touched.
 */
export class GlobularClusterGenerator {

  private constructor() {}

  static isGlobularClusterLocator(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): boolean {

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
      ExplorationSectorResultEngine
        .resolveGalacticObjectKind(
          generationKey,
          locator,
        ) !==
      ExplorationResultKind
        .STAR_CLUSTER
    ) {
      return false;
    }

    return !OpenClusterGenerator
      .isOpenClusterLocator(
        generationKey,
        locator,
      );
  }

  static generate(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): GlobularCluster {

    if (
      !this.isGlobularClusterLocator(
        generationKey,
        locator,
      )
    ) {
      throw new RangeError(
        'GlobularClusterGenerator requires a GalacticObjectLocator assigned to the point-12.5 globular-cluster complement of the canonical point-9.4 STAR_CLUSTER family.',
      );
    }

    const commonObject =
      GalacticObjectGenerator
        .generate(
          generationKey,
          locator,
        );

    const galaxy =
      GalaxyGenerator
        .generate(
          generationKey,
          locator.galaxyIndex,
        );

    const grid =
      GalaxySectorGridGenerator
        .generate(
          galaxy,
        );

    const coordinates =
      grid
        .coordinatesFor(
          locator.sectorKey,
        );

    const stellarDensity =
      GalaxySectorStellarDensityGenerator
        .generate(
          galaxy,
          grid,
          coordinates,
        );

    const sectorStellarPopulation =
      GalaxySectorStellarPopulationPropertiesGenerator
        .generate(
          galaxy,
          stellarDensity,
        );

    const stellarPopulationProfile =
      StellarPopulationProfileGenerator
        .generate(
          generationKey,
          galaxy.physicalProperties,
          sectorStellarPopulation,
        );

    const targetSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        );

    const stellarCount =
      Math.round(
        logRangeV1(
          V1_MIN_STELLAR_COUNT,
          V1_MAX_STELLAR_COUNT,
          unitV1(
            targetSeed.normalizedValue,
            V1_STELLAR_COUNT_LABEL,
          ),
        ),
      );

    const meanStellarMassSolarMasses =
      linearRangeV1(
        0.28,
        0.58,
        clamp01(
          0.70 *
            unitV1(
              targetSeed.normalizedValue,
              V1_MEAN_STELLAR_MASS_LABEL,
            ) +
          0.30 *
            (
              1 -
              stellarPopulationProfile
                .lowMassStarPropensity
            ),
        ),
      );

    const hostAgeBillionYears =
      galaxy
        .physicalProperties
        .ageBillionYears;

    const minimumAgeBillionYears =
      Math.max(
        0.5,
        hostAgeBillionYears *
          0.65,
      );

    const maximumAgeBillionYears =
      Math.max(
        minimumAgeBillionYears +
          0.01,
        hostAgeBillionYears *
          0.995,
      );

    const ageDraw =
      1 -
      (
        1 -
        unitV1(
          targetSeed.normalizedValue,
          V1_AGE_LABEL,
        )
      ) **
        2.2;

    const ageBillionYears =
      linearRangeV1(
        minimumAgeBillionYears,
        maximumAgeBillionYears,
        ageDraw,
      );

    const metallicitySolarRatio =
      sectorStellarPopulation
        .characteristicMetallicitySolarRatio *
      logRangeV1(
        0.04,
        0.45,
        unitV1(
          targetSeed.normalizedValue,
          V1_METALLICITY_LABEL,
        ),
      );

    const coreRadiusParsecs =
      logRangeV1(
        0.08,
        3.0,
        unitV1(
          targetSeed.normalizedValue,
          V1_CORE_RADIUS_LABEL,
        ),
      );

    const halfLightRadiusParsecs =
      coreRadiusParsecs +
      logRangeV1(
        0.7,
        8.0,
        unitV1(
          targetSeed.normalizedValue,
          V1_HALF_LIGHT_RADIUS_LABEL,
        ),
      );

    const tidalRadiusParsecs =
      halfLightRadiusParsecs *
      linearRangeV1(
        6.0,
        30.0,
        unitV1(
          targetSeed.normalizedValue,
          V1_TIDAL_RADIUS_LABEL,
        ),
      );

    const centralConcentration =
      linearRangeV1(
        0.45,
        0.98,
        unitV1(
          targetSeed.normalizedValue,
          V1_CONCENTRATION_LABEL,
        ),
      );

    const stellarRemnantFraction =
      clamp(
        0.05,
        0.40,
        0.08 +
        0.24 *
          stellarPopulationProfile
            .stellarRemnantPropensity +
        0.08 *
          unitV1(
            targetSeed.normalizedValue,
            V1_REMNANT_FRACTION_LABEL,
          ),
      );

    return new GlobularCluster(
      commonObject.generationKey,
      commonObject.locator,
      commonObject.location,
      new GlobularClusterPhysicalProperties(
        stellarCount,
        stellarCount *
          meanStellarMassSolarMasses,
        ageBillionYears,
        metallicitySolarRatio,
        coreRadiusParsecs,
        halfLightRadiusParsecs,
        tidalRadiusParsecs,
        centralConcentration,
        stellarRemnantFraction,
      ),
    );
  }
}

function unitV1(
  targetSeedHex:
    string,

  label:
    Uint8Array,
): number {

  const digest =
    sha256
      .create()
      .update(
        V1_GLOBULAR_CLUSTER_DOMAIN,
      )
      .update(
        hexToBytes(
          targetSeedHex,
        ),
      )
      .update(
        label,
      )
      .digest();

  return (
    digest[0] *
      0x01000000 +
    digest[1] *
      0x00010000 +
    digest[2] *
      0x00000100 +
    digest[3]
  ) /
    UINT32_SCALE;
}

function logRangeV1(
  min:
    number,

  max:
    number,

  t:
    number,
): number {

  return Math.exp(
    Math.log(
      min,
    ) +
    (
      Math.log(
        max,
      ) -
      Math.log(
        min,
      )
    ) *
      t,
  );
}

function linearRangeV1(
  min:
    number,

  max:
    number,

  t:
    number,
): number {

  return (
    min +
    (
      max -
      min
    ) *
      t
  );
}

function clamp01(
  value:
    number,
): number {

  return clamp(
    0,
    1,
    value,
  );
}

function clamp(
  min:
    number,

  max:
    number,

  value:
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
