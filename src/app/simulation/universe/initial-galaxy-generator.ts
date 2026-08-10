import {
  GalaxyLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type GalaxySeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  GalacticNucleus,
} from '../../domain/universe/galactic-nucleus';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalaxyPhysicalProperties,
} from '../../domain/universe/galaxy-physical-properties';

import {
  GalaxyStructure,
} from '../../domain/universe/galaxy-structure';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  GenesisUniverse,
} from '../../domain/universe/genesis-universe';

import {
  SupermassiveBlackHole,
} from '../../domain/universe/supermassive-black-hole';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  GalaxyDesignationGenerator,
} from './galaxy-designation-generator';

interface V1Draws {
  readonly type:
    number;

  readonly age:
    number;

  readonly diameter:
    number;

  readonly mass:
    number;

  readonly stars:
    number;

  readonly metallicity:
    number;

  readonly starFormation:
    number;

  readonly centralConcentration:
    number;

  readonly flattening:
    number;

  readonly asymmetry:
    number;

  readonly barStrength:
    number;

  readonly spiralArms:
    number;

  readonly nucleusPresence:
    number;

  readonly blackHolePresence:
    number;

  readonly blackHoleMass:
    number;

  readonly nucleusState:
    number;
}

interface V1GalaxyProfile {
  readonly ageMin:
    number;

  readonly ageMax:
    number;

  readonly diameterMin:
    number;

  readonly diameterMax:
    number;

  readonly massMin:
    number;

  readonly massMax:
    number;

  readonly starsMin:
    bigint;

  readonly starsMax:
    bigint;

  readonly metallicityMin:
    number;

  readonly metallicityMax:
    number;

  readonly starFormationMin:
    number;

  readonly starFormationMax:
    number;

  readonly centralConcentrationMin:
    number;

  readonly centralConcentrationMax:
    number;

  readonly flatteningMin:
    number;

  readonly flatteningMax:
    number;

  readonly asymmetryMin:
    number;

  readonly asymmetryMax:
    number;

  readonly barStrengthMin:
    number;

  readonly barStrengthMax:
    number;

  readonly spiralArmMin:
    number;

  readonly spiralArmMax:
    number;

  readonly nucleusProbability:
    number;

  readonly smbhProbabilityGivenNucleus:
    number;

  readonly smbhMassMin:
    number;

  readonly smbhMassMax:
    number;

  readonly agnProbabilityGivenSmbh:
    number;

  readonly quasarProbabilityGivenSmbh:
    number;
}

const BARRED_SPIRAL_PROFILE:
  V1GalaxyProfile =
  Object.freeze({
    ageMin:
      8.0,

    ageMax:
      13.5,

    diameterMin:
      60000.0,

    diameterMax:
      180000.0,

    massMin:
      2.5e11,

    massMax:
      2.0e12,

    starsMin:
      40000000000n,

    starsMax:
      300000000000n,

    metallicityMin:
      0.50,

    metallicityMax:
      1.50,

    starFormationMin:
      0.30,

    starFormationMax:
      8.00,

    centralConcentrationMin:
      0.45,

    centralConcentrationMax:
      0.78,

    flatteningMin:
      0.72,

    flatteningMax:
      0.95,

    asymmetryMin:
      0.02,

    asymmetryMax:
      0.18,

    barStrengthMin:
      0.45,

    barStrengthMax:
      0.95,

    spiralArmMin:
      2,

    spiralArmMax:
      5,

    nucleusProbability:
      0.95,

    smbhProbabilityGivenNucleus:
      0.93,

    smbhMassMin:
      1.0e6,

    smbhMassMax:
      5.0e8,

    agnProbabilityGivenSmbh:
      0.12,

    quasarProbabilityGivenSmbh:
      0.005,
  });

const SPIRAL_PROFILE:
  V1GalaxyProfile =
  Object.freeze({
    ageMin:
      7.5,

    ageMax:
      13.4,

    diameterMin:
      50000.0,

    diameterMax:
      170000.0,

    massMin:
      2.0e11,

    massMax:
      1.5e12,

    starsMin:
      30000000000n,

    starsMax:
      250000000000n,

    metallicityMin:
      0.45,

    metallicityMax:
      1.40,

    starFormationMin:
      0.50,

    starFormationMax:
      10.0,

    centralConcentrationMin:
      0.35,

    centralConcentrationMax:
      0.70,

    flatteningMin:
      0.72,

    flatteningMax:
      0.95,

    asymmetryMin:
      0.02,

    asymmetryMax:
      0.20,

    barStrengthMin:
      0.00,

    barStrengthMax:
      0.20,

    spiralArmMin:
      2,

    spiralArmMax:
      6,

    nucleusProbability:
      0.92,

    smbhProbabilityGivenNucleus:
      0.90,

    smbhMassMin:
      1.0e6,

    smbhMassMax:
      3.0e8,

    agnProbabilityGivenSmbh:
      0.10,

    quasarProbabilityGivenSmbh:
      0.004,
  });

const ELLIPTICAL_PROFILE:
  V1GalaxyProfile =
  Object.freeze({
    ageMin:
      9.5,

    ageMax:
      13.6,

    diameterMin:
      40000.0,

    diameterMax:
      250000.0,

    massMin:
      3.0e11,

    massMax:
      5.0e12,

    starsMin:
      80000000000n,

    starsMax:
      1000000000000n,

    metallicityMin:
      0.70,

    metallicityMax:
      1.80,

    starFormationMin:
      0.00,

    starFormationMax:
      0.60,

    centralConcentrationMin:
      0.65,

    centralConcentrationMax:
      0.95,

    flatteningMin:
      0.05,

    flatteningMax:
      0.55,

    asymmetryMin:
      0.00,

    asymmetryMax:
      0.12,

    barStrengthMin:
      0.00,

    barStrengthMax:
      0.05,

    spiralArmMin:
      0,

    spiralArmMax:
      0,

    nucleusProbability:
      0.98,

    smbhProbabilityGivenNucleus:
      0.97,

    smbhMassMin:
      1.0e7,

    smbhMassMax:
      2.0e10,

    agnProbabilityGivenSmbh:
      0.08,

    quasarProbabilityGivenSmbh:
      0.006,
  });

const IRREGULAR_PROFILE:
  V1GalaxyProfile =
  Object.freeze({
    ageMin:
      2.5,

    ageMax:
      13.2,

    diameterMin:
      5000.0,

    diameterMax:
      50000.0,

    massMin:
      5.0e8,

    massMax:
      1.0e11,

    starsMin:
      10000000n,

    starsMax:
      20000000000n,

    metallicityMin:
      0.05,

    metallicityMax:
      0.70,

    starFormationMin:
      0.10,

    starFormationMax:
      5.0,

    centralConcentrationMin:
      0.05,

    centralConcentrationMax:
      0.45,

    flatteningMin:
      0.15,

    flatteningMax:
      0.85,

    asymmetryMin:
      0.45,

    asymmetryMax:
      0.95,

    barStrengthMin:
      0.00,

    barStrengthMax:
      0.25,

    spiralArmMin:
      0,

    spiralArmMax:
      3,

    nucleusProbability:
      0.45,

    smbhProbabilityGivenNucleus:
      0.40,

    smbhMassMin:
      1.0e5,

    smbhMassMax:
      3.0e7,

    agnProbabilityGivenSmbh:
      0.06,

    quasarProbabilityGivenSmbh:
      0.003,
  });

const DWARF_PROFILE:
  V1GalaxyProfile =
  Object.freeze({
    ageMin:
      3.0,

    ageMax:
      13.5,

    diameterMin:
      2000.0,

    diameterMax:
      30000.0,

    massMin:
      1.0e7,

    massMax:
      5.0e10,

    starsMin:
      1000000n,

    starsMax:
      5000000000n,

    metallicityMin:
      0.03,

    metallicityMax:
      0.50,

    starFormationMin:
      0.00,

    starFormationMax:
      1.50,

    centralConcentrationMin:
      0.10,

    centralConcentrationMax:
      0.55,

    flatteningMin:
      0.10,

    flatteningMax:
      0.80,

    asymmetryMin:
      0.05,

    asymmetryMax:
      0.55,

    barStrengthMin:
      0.00,

    barStrengthMax:
      0.20,

    spiralArmMin:
      0,

    spiralArmMax:
      2,

    nucleusProbability:
      0.35,

    smbhProbabilityGivenNucleus:
      0.25,

    smbhMassMin:
      1.0e5,

    smbhMassMax:
      1.0e7,

    agnProbabilityGivenSmbh:
      0.04,

    quasarProbabilityGivenSmbh:
      0.001,
  });

/**
 * Procedural generator for the initial galaxy of a universe.
 *
 * The initial galaxy always uses GenesisUniverse.INITIAL_GALAXY_INDEX.
 *
 * V1 preserves the exact Android physical-generation contract:
 *
 * - exact GalaxySeed derivation;
 * - exact SFC64 stream;
 * - exactly sixteen ordered random draws;
 * - exact morphology profiles;
 * - exact nucleus generation;
 * - independent procedural designation.
 */
export class InitialGalaxyGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,
  ): Galaxy {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        generationKey,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    generationKey:
      UniverseGenerationKey,
  ): Galaxy {

    const galaxyIndex =
      GenesisUniverse
        .INITIAL_GALAXY_INDEX;

    const galaxySeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          new GalaxyLocator(
            galaxyIndex,
          ),
        ) as GalaxySeed;

    const random =
      new Sfc64Random(
        universeSeedFromNormalized128(
          galaxySeed.normalizedValue,
        ),
      );

    /*
     * IMPORTANT:
     *
     * The order of these sixteen draws is part of the frozen
     * GeneratorVersion.V1 deterministic contract.
     */
    const draws:
      V1Draws = {
        type:
          random.nextDouble(),

        age:
          random.nextDouble(),

        diameter:
          random.nextDouble(),

        mass:
          random.nextDouble(),

        stars:
          random.nextDouble(),

        metallicity:
          random.nextDouble(),

        starFormation:
          random.nextDouble(),

        centralConcentration:
          random.nextDouble(),

        flattening:
          random.nextDouble(),

        asymmetry:
          random.nextDouble(),

        barStrength:
          random.nextDouble(),

        spiralArms:
          random.nextDouble(),

        nucleusPresence:
          random.nextDouble(),

        blackHolePresence:
          random.nextDouble(),

        blackHoleMass:
          random.nextDouble(),

        nucleusState:
          random.nextDouble(),
      };

    const galaxyType =
      typeFromV1Draw(
        draws.type,
      );

    const profile =
      getV1Profile(
        galaxyType,
      );

    const massT =
      draws.mass;

    const diameterT =
      clamp01(
        0.65 *
          draws.diameter +
        0.35 *
          massT,
      );

    const starsT =
      clamp01(
        0.55 *
          draws.stars +
        0.45 *
          massT,
      );

    const metallicityT =
      clamp01(
        0.60 *
          draws.metallicity +
        0.40 *
          massT,
      );

    const starFormationT =
      clamp01(
        0.75 *
          draws.starFormation +
        0.25 *
          (
            1.0 -
            draws.age
          ),
      );

    const centralConcentrationT =
      clamp01(
        0.70 *
          draws.centralConcentration +
        0.30 *
          massT,
      );

    const ageT =
      draws.age;

    const flatteningT =
      draws.flattening;

    const asymmetryT =
      draws.asymmetry;

    const barStrengthT =
      draws.barStrength;

    const spiralArmsT =
      draws.spiralArms;

    const ageBillionYears =
      lerp(
        profile.ageMin,
        profile.ageMax,
        ageT,
      );

    const diameterLightYears =
      lerp(
        profile.diameterMin,
        profile.diameterMax,
        diameterT,
      );

    const totalMassSolarMasses =
      lerp(
        profile.massMin,
        profile.massMax,
        massT,
      );

    const stellarPopulation =
      lerpLong(
        profile.starsMin,
        profile.starsMax,
        starsT,
      );

    const metallicitySolarRatio =
      lerp(
        profile.metallicityMin,
        profile.metallicityMax,
        metallicityT,
      );

    const starFormationRateSolarMassesPerYear =
      lerp(
        profile.starFormationMin,
        profile.starFormationMax,
        starFormationT,
      );

    const structure =
      new GalaxyStructure(
        lerp(
          profile.centralConcentrationMin,
          profile.centralConcentrationMax,
          centralConcentrationT,
        ),

        lerp(
          profile.flatteningMin,
          profile.flatteningMax,
          flatteningT,
        ),

        lerp(
          profile.asymmetryMin,
          profile.asymmetryMax,
          asymmetryT,
        ),

        lerp(
          profile.barStrengthMin,
          profile.barStrengthMax,
          barStrengthT,
        ),

        lerpIntInclusive(
          profile.spiralArmMin,
          profile.spiralArmMax,
          spiralArmsT,
        ),
      );

    const physicalProperties =
      new GalaxyPhysicalProperties(
        ageBillionYears,
        diameterLightYears,
        totalMassSolarMasses,
        stellarPopulation,
        metallicitySolarRatio,
        starFormationRateSolarMassesPerYear,
        structure,
      );

    const hasNucleus =
      draws.nucleusPresence <
      profile.nucleusProbability;

    let nucleus:
      GalacticNucleus | null =
      null;

    if (
      hasNucleus
    ) {
      const hasSmbh =
        draws.blackHolePresence <
        profile
          .smbhProbabilityGivenNucleus;

      if (
        !hasSmbh
      ) {
        nucleus =
          new GalacticNucleus(
            GalacticNucleusState.QUIESCENT,
            null,
          );
      } else {
        const blackHoleMassT =
          clamp01(
            0.60 *
              draws.blackHoleMass +
            0.40 *
              massT,
          );

        const logMin =
          Math.log10(
            profile.smbhMassMin,
          );

        const logMax =
          Math.log10(
            profile.smbhMassMax,
          );

        const rawMass =
          10.0 **
          lerp(
            logMin,
            logMax,
            blackHoleMassT,
          );

        const maxAllowed =
          totalMassSolarMasses *
          0.01;

        const smbhMass =
          Math.min(
            rawMass,
            maxAllowed,
          );

        const smbh =
          new SupermassiveBlackHole(
            smbhMass,
          );

        let state:
          GalacticNucleusState;

        if (
          draws.nucleusState <
          profile
            .quasarProbabilityGivenSmbh
        ) {
          state =
            GalacticNucleusState.QUASAR;
        } else if (
          draws.nucleusState <
          profile
            .quasarProbabilityGivenSmbh +
          profile
            .agnProbabilityGivenSmbh
        ) {
          state =
            GalacticNucleusState.AGN;
        } else {
          state =
            GalacticNucleusState.QUIESCENT;
        }

        nucleus =
          new GalacticNucleus(
            state,
            smbh,
          );
      }
    }

    const designation =
      GalaxyDesignationGenerator
        .generate(
          generationKey,
          galaxyIndex,
        );

    return new Galaxy(
      generationKey,
      galaxyIndex,
      galaxySeed,
      designation,
      galaxyType,
      physicalProperties,
      nucleus,
    );
  }
}

function typeFromV1Draw(
  draw:
    number,
): GalaxyType {

  if (
    draw <
    0.28
  ) {
    return GalaxyType
      .BARRED_SPIRAL;
  }

  if (
    draw <
    0.52
  ) {
    return GalaxyType
      .SPIRAL;
  }

  if (
    draw <
    0.72
  ) {
    return GalaxyType
      .ELLIPTICAL;
  }

  if (
    draw <
    0.88
  ) {
    return GalaxyType
      .DWARF;
  }

  return GalaxyType
    .IRREGULAR;
}

function getV1Profile(
  type:
    GalaxyType,
): V1GalaxyProfile {

  if (
    type ===
    GalaxyType.BARRED_SPIRAL
  ) {
    return BARRED_SPIRAL_PROFILE;
  }

  if (
    type ===
    GalaxyType.SPIRAL
  ) {
    return SPIRAL_PROFILE;
  }

  if (
    type ===
    GalaxyType.ELLIPTICAL
  ) {
    return ELLIPTICAL_PROFILE;
  }

  if (
    type ===
    GalaxyType.IRREGULAR
  ) {
    return IRREGULAR_PROFILE;
  }

  if (
    type ===
    GalaxyType.DWARF
  ) {
    return DWARF_PROFILE;
  }

  throw new RangeError(
    'Unsupported GalaxyType.',
  );
}

function lerp(
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

  return Math.min(
    1.0,
    Math.max(
      0.0,
      value,
    ),
  );
}

function lerpLong(
  min:
    bigint,

  max:
    bigint,

  t:
    number,
): bigint {

  const difference =
    max -
    min;

  const offset =
    BigInt(
      Math.trunc(
        Number(
          difference,
        ) *
        t,
      ),
    );

  const result =
    min +
    offset;

  if (
    result <
    min
  ) {
    return min;
  }

  if (
    result >
    max
  ) {
    return max;
  }

  return result;
}

function lerpIntInclusive(
  min:
    number,

  max:
    number,

  t:
    number,
): number {

  if (
    min ===
    max
  ) {
    return min;
  }

  const count =
    max -
    min +
    1;

  const scaled =
    Math.trunc(
      t *
      count,
    );

  const clampedScaled =
    Math.min(
      max -
        min,
      Math.max(
        0,
        scaled,
      ),
    );

  const result =
    min +
    clampedScaled;

  return Math.min(
    max,
    Math.max(
      min,
      result,
    ),
  );
}

function universeSeedFromNormalized128(
  normalized:
    string,
): UniverseSeed {

  if (
    !/^[0-9A-F]{32}$/.test(
      normalized,
    )
  ) {
    throw new RangeError(
      `Expected normalized 128-bit hexadecimal seed: ${normalized}.`,
    );
  }

  const canonical =
    normalized
      .match(
        /.{4}/g,
      )
      ?.join(
        '-',
      );

  if (
    canonical ===
    undefined
  ) {
    throw new RangeError(
      `Cannot format normalized 128-bit seed: ${normalized}.`,
    );
  }

  return UniverseSeed.parse(
    canonical,
  );
}