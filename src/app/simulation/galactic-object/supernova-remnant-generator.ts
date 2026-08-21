import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  SupernovaRemnantMorphology,
  type SupernovaRemnantMorphology as SupernovaRemnantMorphologyValue,
} from '../../domain/galactic-object/supernova-remnant-morphology';

import {
  SupernovaRemnantPhysicalProperties,
} from '../../domain/galactic-object/supernova-remnant-physical-properties';

import {
  SupernovaRemnant,
} from '../../domain/galactic-object/supernova-remnant';

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
  GalacticObjectGenerator,
} from './galactic-object-generator';

const V1_SUPERNOVA_REMNANT_DOMAIN =
  utf8ToBytes(
    'GENESIS-SUPERNOVA-REMNANT-V1',
  );

const V1_MEMBERSHIP_LABEL =
  utf8ToBytes(
    'supernova-remnant-membership',
  );

const V1_MORPHOLOGY_LABEL =
  utf8ToBytes(
    'morphology',
  );

const V1_AGE_LABEL =
  utf8ToBytes(
    'age-years',
  );

const V1_EXPLOSION_ENERGY_LABEL =
  utf8ToBytes(
    'explosion-energy-ergs',
  );

const V1_AMBIENT_DENSITY_LABEL =
  utf8ToBytes(
    'ambient-hydrogen-number-density-cm3',
  );

const V1_EJECTA_MASS_LABEL =
  utf8ToBytes(
    'ejecta-mass-solar-masses',
  );

const V1_SUPERNOVA_REMNANT_FRACTION =
  0.45;

const V1_MIN_AGE_YEARS =
  300;

const V1_MAX_AGE_YEARS =
  120_000;

const PARSEC_KM =
  3.0856775814913673e13;

const YEAR_SECONDS =
  31_557_600;

const PC_PER_YEAR_TO_KM_PER_SECOND =
  PARSEC_KM /
  YEAR_SECONDS;

const SWEPT_MASS_COEFFICIENT =
  0.144926239165513;

const UINT32_SCALE =
  4294967296;

/**
 * Deterministic point-12.6 Ground Truth generator for persistent supernova
 * remnants.
 *
 * The frozen point-9.4 EXTREME_OBJECT value remains only a coarse exploration
 * family. V1 assigns 45% of that family to SupernovaRemnant through an isolated
 * membership branch. The complement remains reserved for later physical
 * extreme-object specializations and is not reclassified here.
 *
 * A generated remnant is a static GalacticObject with a stable
 * GalacticObjectLocator. The supernova flash itself remains a separate
 * TRANSIENT_EVENT path and is never converted into a persistent locator.
 *
 * Intrinsic quantities are regenerated from the target seed. Radius,
 * expansion velocity, shock temperature and swept-up mass are derived from the
 * independently seeded age, explosion energy, ambient density and ejecta mass
 * so the physical profile remains internally coherent without introducing an
 * unimplemented gas-environment model.
 *
 * No repository, DiscoveryState, Discovery Points, observation action or
 * renderer is mutated here. Existing DiscoveryRepository persistence stores the
 * locator identity only and can regenerate this Ground Truth after reload.
 */
export class SupernovaRemnantGenerator {

  private constructor() {}

  static isSupernovaRemnantLocator(
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
        .EXTREME_OBJECT
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
      V1_SUPERNOVA_REMNANT_FRACTION
    );
  }

  static resolveMorphology(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): SupernovaRemnantMorphologyValue {

    if (
      !this.isSupernovaRemnantLocator(
        generationKey,
        locator,
      )
    ) {
      throw new RangeError(
        'SupernovaRemnantGenerator requires a GalacticObjectLocator assigned to the point-12.6 supernova-remnant subset of the canonical point-9.4 EXTREME_OBJECT family.',
      );
    }

    const targetSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        );

    return morphologyV1(
      targetSeed.normalizedValue,
    );
  }

  static generate(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): SupernovaRemnant {

    if (
      !this.isSupernovaRemnantLocator(
        generationKey,
        locator,
      )
    ) {
      throw new RangeError(
        'SupernovaRemnantGenerator requires a GalacticObjectLocator assigned to the point-12.6 supernova-remnant subset of the canonical point-9.4 EXTREME_OBJECT family.',
      );
    }

    const commonObject =
      GalacticObjectGenerator
        .generate(
          generationKey,
          locator,
        );

    const targetSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        );

    const ageYears =
      logRangeV1(
        V1_MIN_AGE_YEARS,
        V1_MAX_AGE_YEARS,
        unitV1(
          targetSeed.normalizedValue,
          V1_AGE_LABEL,
        ),
      );

    const explosionEnergyErgs =
      logRangeV1(
        5.0e50,
        2.0e51,
        unitV1(
          targetSeed.normalizedValue,
          V1_EXPLOSION_ENERGY_LABEL,
        ),
      );

    const ambientHydrogenNumberDensityPerCm3 =
      logRangeV1(
        0.005,
        10,
        unitV1(
          targetSeed.normalizedValue,
          V1_AMBIENT_DENSITY_LABEL,
        ),
      );

    const ejectaMassSolarMasses =
      logRangeV1(
        0.8,
        20,
        unitV1(
          targetSeed.normalizedValue,
          V1_EJECTA_MASS_LABEL,
        ),
      );

    const energy51 =
      explosionEnergyErgs /
      1.0e51;

    const effectiveDensity =
      Math.max(
        0.01,
        ambientHydrogenNumberDensityPerCm3,
      );

    const radiusParsecs =
      clamp(
        0.6,
        85,
        4.9 *
          (
            energy51 /
            effectiveDensity
          ) **
            0.2 *
          (
            ageYears /
            1_000
          ) **
            0.4,
      );

    const expansionVelocityKmPerSecond =
      clamp(
        40,
        12_000,
        0.4 *
          radiusParsecs /
          ageYears *
          PC_PER_YEAR_TO_KM_PER_SECOND,
      );

    const shockTemperatureKelvin =
      Math.max(
        10_000,
        1.36e7 *
          (
            expansionVelocityKmPerSecond /
            1_000
          ) **
            2,
      );

    const sweptUpMassSolarMasses =
      SWEPT_MASS_COEFFICIENT *
      ambientHydrogenNumberDensityPerCm3 *
      radiusParsecs **
        3;

    return new SupernovaRemnant(
      commonObject.generationKey,
      commonObject.locator,
      commonObject.location,
      morphologyV1(
        targetSeed.normalizedValue,
      ),
      new SupernovaRemnantPhysicalProperties(
        ageYears,
        radiusParsecs,
        expansionVelocityKmPerSecond,
        shockTemperatureKelvin,
        explosionEnergyErgs,
        ambientHydrogenNumberDensityPerCm3,
        ejectaMassSolarMasses,
        sweptUpMassSolarMasses,
      ),
    );
  }
}

function morphologyV1(
  targetSeedHex:
    string,
): SupernovaRemnantMorphologyValue {

  const value =
    unitV1(
      targetSeedHex,
      V1_MORPHOLOGY_LABEL,
    );

  if (
    value <
    0.60
  ) {
    return SupernovaRemnantMorphology
      .SHELL;
  }

  if (
    value <
    0.75
  ) {
    return SupernovaRemnantMorphology
      .PLERION;
  }

  return SupernovaRemnantMorphology
    .COMPOSITE;
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
        V1_SUPERNOVA_REMNANT_DOMAIN,
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

  unit:
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
      unit,
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
