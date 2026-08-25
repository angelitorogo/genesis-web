import {
  GalacticNucleus,
} from '../../domain/universe/galactic-nucleus';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

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
  SupermassiveBlackHole,
} from '../../domain/universe/supermassive-black-hole';

/**
 * Immutable set of the sixteen ordered V1 random draws used by galaxy generation.
 *
 * Each draw must be finite and belong to the semi-open interval [0.0, 1.0).
 */
export class V1GalaxyDraws {

  constructor(
    readonly type: number,
    readonly age: number,
    readonly diameter: number,
    readonly mass: number,
    readonly stars: number,
    readonly metallicity: number,
    readonly starFormation: number,
    readonly centralConcentration: number,
    readonly flattening: number,
    readonly asymmetry: number,
    readonly barStrength: number,
    readonly spiralArms: number,
    readonly nucleusPresence: number,
    readonly blackHolePresence: number,
    readonly blackHoleMass: number,
    readonly nucleusState: number,
  ) {
    const values = [
      type,
      age,
      diameter,
      mass,
      stars,
      metallicity,
      starFormation,
      centralConcentration,
      flattening,
      asymmetry,
      barStrength,
      spiralArms,
      nucleusPresence,
      blackHolePresence,
      blackHoleMass,
      nucleusState,
    ];

    for (
      const draw of values
    ) {
      if (
        !Number.isFinite(
          draw,
        ) ||
        draw < 0.0 ||
        draw >= 1.0
      ) {
        throw new RangeError(
          `Draw values must be finite and in range [0.0, 1.0), but got: ${draw}.`,
        );
      }
    }
  }
}

export interface GalaxyMorphologyResult {
  readonly type: GalaxyType;
  readonly physicalProperties: GalaxyPhysicalProperties;
  readonly nucleus: GalacticNucleus;
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

    /*
     * IRREGULAR V1 never hosts a QUASAR. Preserve the previous total active
     * incidence (AGN + QUASAR = 0.063) by folding the old QUASAR slice into
     * AGN instead of silently turning those galaxies quiescent.
     */
    agnProbabilityGivenSmbh:
      0.063,

    quasarProbabilityGivenSmbh:
      0.0,
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

    /*
     * DWARF V1 never hosts a QUASAR. Preserve the previous total active
     * incidence (AGN + QUASAR = 0.041) by folding the old QUASAR slice into
     * AGN.
     */
    agnProbabilityGivenSmbh:
      0.041,

    quasarProbabilityGivenSmbh:
      0.0,
  });

/**
 * Pure V1 morphology and physical-parameter interpreter.
 *
 * This generator consumes no random numbers. GalaxyGenerator owns the frozen
 * sixteen-draw SFC64 stream and passes those immutable values here.
 */
export class GalaxyMorphologyGenerator {

  private constructor() {}

  static generateV1(
    draws:
      V1GalaxyDraws,
  ): GalaxyMorphologyResult {

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

    /*
     * Frozen galactic-centre contract:
     * every galaxy owns a physical nucleus at coordinates (0, 0).
     *
     * The historical `nucleusProbability` draw is retained without consuming
     * any extra entropy. A failed draw no longer means "no nucleus"; it means
     * a baseline QUIESCENT centre without an SMBH-capable differentiated
     * component. This preserves the previous active-episode incidence while
     * removing the invalid empty-centre state.
     */
    let nucleus:
      GalacticNucleus =
      new GalacticNucleus(
        GalacticNucleusState.QUIESCENT,
        null,
      );

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

    return {
      type:
        galaxyType,

      physicalProperties,

      nucleus,
    };
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
