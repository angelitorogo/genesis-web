import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  OpenClusterPhysicalProperties,
} from '../../domain/galactic-object/open-cluster-physical-properties';

import {
  OpenCluster,
} from '../../domain/galactic-object/open-cluster';

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
  isGalacticNucleusLocator,
} from '../../domain/universe/galactic-center';

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

const V1_OPEN_CLUSTER_DOMAIN =
  utf8ToBytes(
    'GENESIS-OPEN-CLUSTER-V1',
  );

const V1_MEMBERSHIP_LABEL =
  utf8ToBytes(
    'open-cluster-membership',
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
    'age-million-years',
  );

const V1_METALLICITY_LABEL =
  utf8ToBytes(
    'metallicity-factor',
  );

const V1_HALF_MASS_RADIUS_LABEL =
  utf8ToBytes(
    'half-mass-radius-parsecs',
  );

const V1_TIDAL_RADIUS_LABEL =
  utf8ToBytes(
    'tidal-radius-factor',
  );

const V1_BINARY_FRACTION_LABEL =
  utf8ToBytes(
    'binary-fraction',
  );

const V1_BOUND_FRACTION_LABEL =
  utf8ToBytes(
    'bound-fraction',
  );

const V1_OPEN_CLUSTER_FRACTION =
  0.82;

const V1_MIN_STELLAR_COUNT =
  30;

const V1_MAX_STELLAR_COUNT =
  10_000;

const V1_MIN_AGE_MILLION_YEARS =
  3;

const V1_MAX_AGE_MILLION_YEARS =
  6_000;

const UINT32_SCALE =
  4294967296;

/**
 * Deterministic point-12.4 Ground Truth generator for open stellar clusters.
 *
 * The frozen point-9.4 STAR_CLUSTER value remains only a coarse exploration
 * family. V1 allocates 82% of those locators to open clusters through an
 * isolated membership branch; the remainder is deliberately not materialized
 * here so a later star-cluster specialization can define it without changing
 * point-12.4 identities.
 *
 * Intrinsic age and metallicity are conditioned on the already-existing sector
 * stellar environment from point 5.5. Aggregate stellar tendencies come from
 * StellarPopulationProfile; no individual stars are materialized.
 *
 * Every stochastic-looking property uses its own SHA-256 label. No repository,
 * observation state, Discovery Points, scientific action or renderer is
 * touched.
 */
export class OpenClusterGenerator {

  private constructor() {}

  static isOpenClusterLocator(
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
      isGalacticNucleusLocator(
        locator,
      )
    ) {
      return false;
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

    const targetSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        );

    return (
      unitV1(
        targetSeed.normalizedValue,
        V1_MEMBERSHIP_LABEL,
      ) <
      V1_OPEN_CLUSTER_FRACTION
    );
  }

  static generate(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): OpenCluster {

    if (
      !this.isOpenClusterLocator(
        generationKey,
        locator,
      )
    ) {
      throw new RangeError(
        'OpenClusterGenerator requires a GalacticObjectLocator assigned to the point-12.4 open-cluster subset of the canonical point-9.4 STAR_CLUSTER family.',
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
        0.35,
        0.85,
        clamp01(
          0.70 *
            unitV1(
              targetSeed.normalizedValue,
              V1_MEAN_STELLAR_MASS_LABEL,
            ) +
          0.30 *
            stellarPopulationProfile
              .highMassStarPropensity,
        ),
      );

    const maximumAgeMillionYears =
      Math.max(
        V1_MIN_AGE_MILLION_YEARS +
          1,
        Math.min(
          V1_MAX_AGE_MILLION_YEARS,
          sectorStellarPopulation
            .characteristicStellarAgeBillionYears *
            1_000,
        ),
      );

    const ageDraw =
      unitV1(
        targetSeed.normalizedValue,
        V1_AGE_LABEL,
      ) **
      (
        1 +
        2.5 *
          stellarPopulationProfile
            .formationActivityIndex
      );

    const ageMillionYears =
      logRangeV1(
        V1_MIN_AGE_MILLION_YEARS,
        maximumAgeMillionYears,
        ageDraw,
      );

    const metallicitySolarRatio =
      sectorStellarPopulation
        .characteristicMetallicitySolarRatio *
      linearRangeV1(
        0.85,
        1.15,
        unitV1(
          targetSeed.normalizedValue,
          V1_METALLICITY_LABEL,
        ),
      );

    const halfMassRadiusParsecs =
      logRangeV1(
        0.4,
        8.0,
        unitV1(
          targetSeed.normalizedValue,
          V1_HALF_MASS_RADIUS_LABEL,
        ),
      );

    const tidalRadiusParsecs =
      halfMassRadiusParsecs *
      linearRangeV1(
        2.5,
        8.0,
        unitV1(
          targetSeed.normalizedValue,
          V1_TIDAL_RADIUS_LABEL,
        ),
      );

    const binaryFraction =
      linearRangeV1(
        0.20,
        0.65,
        unitV1(
          targetSeed.normalizedValue,
          V1_BINARY_FRACTION_LABEL,
        ),
      );

    const normalizedAge =
      clamp01(
        Math.log(
          ageMillionYears /
          V1_MIN_AGE_MILLION_YEARS,
        ) /
        Math.log(
          maximumAgeMillionYears /
          V1_MIN_AGE_MILLION_YEARS,
        ),
      );

    const boundFraction =
      clamp(
        0.20,
        0.98,
        linearRangeV1(
          0.55,
          0.95,
          unitV1(
            targetSeed.normalizedValue,
            V1_BOUND_FRACTION_LABEL,
          ),
        ) *
        (
          1 -
          0.40 *
            normalizedAge
        ),
      );

    return new OpenCluster(
      commonObject.generationKey,
      commonObject.locator,
      commonObject.location,
      new OpenClusterPhysicalProperties(
        stellarCount,
        stellarCount *
          meanStellarMassSolarMasses,
        ageMillionYears,
        metallicitySolarRatio,
        halfMassRadiusParsecs,
        tidalRadiusParsecs,
        binaryFraction,
        boundFraction,
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
        V1_OPEN_CLUSTER_DOMAIN,
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
