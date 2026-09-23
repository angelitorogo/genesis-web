import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  GalacticNucleus,
} from '../../domain/universe/galactic-nucleus';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  SupermassiveBlackHole,
} from '../../domain/universe/supermassive-black-hole';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

const V2_GALACTIC_NUCLEUS_BRANCH =
  utf8ToBytes(
    'GENESIS-GALACTIC-NUCLEUS-V2',
  );

/**
 * An irregular galaxy becomes LARGE once it is physically wider than the
 * maximum diameter admitted by the canonical DWARF profile.
 *
 * Keeping the boundary at 30,000 ly gives the size rule an explicit physical
 * meaning and avoids adding another random classification.
 */
export const V2_LARGE_IRREGULAR_MIN_DIAMETER_LIGHT_YEARS =
  30_000;

export interface V2GalacticNucleusDistribution {
  /** Existing AGN state; this is the gameplay "black-hole centre" family. */
  readonly blackHoleProbability:
    number;

  readonly quasarProbability:
    number;

  readonly quiescentProbability:
    number;
}

interface V2SupermassiveBlackHoleMassProfile {
  readonly hostMassMinSolar:
    number;

  readonly hostMassMaxSolar:
    number;

  readonly blackHoleMassMinSolar:
    number;

  readonly blackHoleMassMaxSolar:
    number;
}

const MASSIVE_GALAXY_DISTRIBUTION:
  V2GalacticNucleusDistribution =
  freezeDistribution(
    0.70,
    0.25,
    0.05,
  );

const LARGE_IRREGULAR_DISTRIBUTION:
  V2GalacticNucleusDistribution =
  freezeDistribution(
    0.80,
    0.20,
    0.00,
  );

const SMALL_IRREGULAR_DISTRIBUTION:
  V2GalacticNucleusDistribution =
  freezeDistribution(
    0.00,
    0.00,
    1.00,
  );

const DWARF_DISTRIBUTION:
  V2GalacticNucleusDistribution =
  freezeDistribution(
    0.04,
    0.01,
    0.95,
  );

/**
 * V2 nuclear Ground Truth.
 *
 * V1 remains frozen. V2 derives an isolated SHA-256/SFC64 branch from the
 * already-canonical GalaxySeed, so changing the nuclear policy neither
 * consumes nor reorders any of V1's sixteen galaxy draws.
 *
 * The existing domain state AGN is the established GENESIS representation of
 * the requested "agujero negro" centre. AGN and QUASAR always receive one
 * physically bounded SMBH; the exclusive QUIESCENT family receives none.
 */
export class V2GalacticNucleusGenerator {

  private constructor() {}

  static generate(
    physicalGalaxy:
      Galaxy,
  ): GalacticNucleus {

    const random =
      new Sfc64Random(
        deriveNuclearSeed(
          physicalGalaxy,
        ),
      );

    const state =
      this.stateForRoll(
        physicalGalaxy.type,
        physicalGalaxy.physicalProperties.diameterLightYears,
        random.nextDouble(),
      );

    if (
      state ===
      GalacticNucleusState.QUIESCENT
    ) {
      return new GalacticNucleus(
        state,
        null,
      );
    }

    return new GalacticNucleus(
      state,
      new SupermassiveBlackHole(
        supermassiveBlackHoleMassSolar(
          physicalGalaxy,
          random.nextDouble(),
        ),
      ),
    );
  }

  static distributionFor(
    galaxyType:
      GalaxyType,

    diameterLightYears:
      number,
  ): V2GalacticNucleusDistribution {

    assertDiameter(
      diameterLightYears,
    );

    if (
      galaxyType ===
        GalaxyType.SPIRAL ||
      galaxyType ===
        GalaxyType.BARRED_SPIRAL ||
      galaxyType ===
        GalaxyType.ELLIPTICAL
    ) {
      return MASSIVE_GALAXY_DISTRIBUTION;
    }

    if (
      galaxyType ===
      GalaxyType.IRREGULAR
    ) {
      return diameterLightYears >=
        V2_LARGE_IRREGULAR_MIN_DIAMETER_LIGHT_YEARS
        ? LARGE_IRREGULAR_DISTRIBUTION
        : SMALL_IRREGULAR_DISTRIBUTION;
    }

    if (
      galaxyType ===
      GalaxyType.DWARF
    ) {
      return DWARF_DISTRIBUTION;
    }

    throw new RangeError(
      `Unsupported GalaxyType: ${String(galaxyType?.name)}.`,
    );
  }

  static stateForRoll(
    galaxyType:
      GalaxyType,

    diameterLightYears:
      number,

    roll:
      number,
  ): GalacticNucleusState {

    if (
      !Number.isFinite(
        roll,
      ) ||
      roll <
        0 ||
      roll >=
        1
    ) {
      throw new RangeError(
        `Nuclear state roll must be finite and in [0, 1): ${roll}.`,
      );
    }

    const distribution =
      this.distributionFor(
        galaxyType,
        diameterLightYears,
      );

    if (
      roll <
      distribution.blackHoleProbability
    ) {
      return GalacticNucleusState.AGN;
    }

    if (
      roll <
      distribution.blackHoleProbability +
        distribution.quasarProbability
    ) {
      return GalacticNucleusState.QUASAR;
    }

    return GalacticNucleusState.QUIESCENT;
  }
}

function freezeDistribution(
  blackHoleProbability:
    number,

  quasarProbability:
    number,

  quiescentProbability:
    number,
): V2GalacticNucleusDistribution {

  const total =
    blackHoleProbability +
    quasarProbability +
    quiescentProbability;

  if (
    ![
      blackHoleProbability,
      quasarProbability,
      quiescentProbability,
    ].every(
      (probability) =>
        Number.isFinite(
          probability,
        ) &&
        probability >=
          0 &&
        probability <=
          1,
    ) ||
    Math.abs(
      total -
        1,
    ) >
      Number.EPSILON
  ) {
    throw new RangeError(
      'A V2 galactic-nucleus distribution must contain finite probabilities that sum to one.',
    );
  }

  return Object.freeze({
    blackHoleProbability,
    quasarProbability,
    quiescentProbability,
  });
}

function deriveNuclearSeed(
  galaxy:
    Galaxy,
): UniverseSeed {

  const digest =
    sha256
      .create()
      .update(
        V2_GALACTIC_NUCLEUS_BRANCH,
      )
      .update(
        hexToBytes(
          galaxy.seed.normalizedValue,
        ),
      )
      .digest();

  const normalized =
    bytesToHex(
      digest.slice(
        0,
        16,
      ),
    )
      .toUpperCase();

  return UniverseSeed.parse(
    normalized
      .match(
        /.{4}/g,
      )
      ?.join(
        '-',
      ) ??
      '',
  );
}

function supermassiveBlackHoleMassSolar(
  galaxy:
    Galaxy,

  massRoll:
    number,
): number {

  if (
    !Number.isFinite(
      massRoll,
    ) ||
    massRoll <
      0 ||
    massRoll >=
      1
  ) {
    throw new RangeError(
      `SMBH mass roll must be finite and in [0, 1): ${massRoll}.`,
    );
  }

  const profile =
    massProfileFor(
      galaxy.type,
    );

  const hostMassT =
    clamp01(
      (
        galaxy.physicalProperties.totalMassSolarMasses -
        profile.hostMassMinSolar
      ) /
      (
        profile.hostMassMaxSolar -
        profile.hostMassMinSolar
      ),
    );

  const blackHoleMassT =
    clamp01(
      0.60 *
        massRoll +
      0.40 *
        hostMassT,
    );

  const rawMass =
    10 **
    lerp(
      Math.log10(
        profile.blackHoleMassMinSolar,
      ),
      Math.log10(
        profile.blackHoleMassMaxSolar,
      ),
      blackHoleMassT,
    );

  return Math.min(
    rawMass,
    galaxy.physicalProperties.totalMassSolarMasses *
      0.01,
  );
}

function massProfileFor(
  galaxyType:
    GalaxyType,
): V2SupermassiveBlackHoleMassProfile {

  if (
    galaxyType ===
    GalaxyType.BARRED_SPIRAL
  ) {
    return {
      hostMassMinSolar:
        2.5e11,
      hostMassMaxSolar:
        2.0e12,
      blackHoleMassMinSolar:
        1.0e6,
      blackHoleMassMaxSolar:
        5.0e8,
    };
  }

  if (
    galaxyType ===
    GalaxyType.SPIRAL
  ) {
    return {
      hostMassMinSolar:
        2.0e11,
      hostMassMaxSolar:
        1.5e12,
      blackHoleMassMinSolar:
        1.0e6,
      blackHoleMassMaxSolar:
        3.0e8,
    };
  }

  if (
    galaxyType ===
    GalaxyType.ELLIPTICAL
  ) {
    return {
      hostMassMinSolar:
        3.0e11,
      hostMassMaxSolar:
        5.0e12,
      blackHoleMassMinSolar:
        1.0e7,
      blackHoleMassMaxSolar:
        2.0e10,
    };
  }

  if (
    galaxyType ===
    GalaxyType.IRREGULAR
  ) {
    return {
      hostMassMinSolar:
        5.0e8,
      hostMassMaxSolar:
        1.0e11,
      blackHoleMassMinSolar:
        1.0e5,
      blackHoleMassMaxSolar:
        3.0e7,
    };
  }

  if (
    galaxyType ===
    GalaxyType.DWARF
  ) {
    return {
      hostMassMinSolar:
        1.0e7,
      hostMassMaxSolar:
        5.0e10,
      blackHoleMassMinSolar:
        1.0e5,
      blackHoleMassMaxSolar:
        1.0e7,
    };
  }

  throw new RangeError(
    `Unsupported GalaxyType: ${String(galaxyType?.name)}.`,
  );
}

function assertDiameter(
  diameterLightYears:
    number,
): void {

  if (
    !Number.isFinite(
      diameterLightYears,
    ) ||
    diameterLightYears <=
      0
  ) {
    throw new RangeError(
      `diameterLightYears must be finite and greater than 0: ${diameterLightYears}.`,
    );
  }
}

function lerp(
  min:
    number,

  max:
    number,

  t:
    number,
): number {
  return min +
    (
      max -
      min
    ) *
    t;
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
