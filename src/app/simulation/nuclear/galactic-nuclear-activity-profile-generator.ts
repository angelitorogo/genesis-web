import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalacticNuclearActivityEventKind,
  GalacticNuclearActivityProfile,
  GalacticNuclearActivityRarity,
} from '../../domain/nuclear/galactic-nuclear-activity-profile';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

/**
 * Maps the already-generated galactic nucleus Ground Truth to the event-like
 * rarity classification introduced by roadmap point 6.7.
 *
 * IMPORTANT:
 * AGN_EPISODE and QUASAR_EPISODE are interpretations of the active state in
 * the current procedural snapshot. This generator does not implement a clock,
 * durations, transitions, scheduling, jets or luminosity.
 *
 * The calculation:
 *
 * - consumes no PRNG draws;
 * - derives no seed;
 * - performs no reroll;
 * - does not modify Galaxy;
 * - does not persist anything.
 */
export class GalacticNuclearActivityProfileGenerator {

  private constructor() {}

  static generate(
    galaxy:
      Galaxy,
  ): GalacticNuclearActivityProfile {

    if (
      galaxy
        .generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        galaxy,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${galaxy.generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    galaxy:
      Galaxy,
  ): GalacticNuclearActivityProfile {

    const nucleus =
      galaxy.nucleus;

    if (
      nucleus ===
      null
    ) {
      return new GalacticNuclearActivityProfile(
        null,
        GalacticNuclearActivityEventKind.NONE,
        GalacticNuclearActivityRarity.BASELINE,
        null,
      );
    }

    const state =
      nucleus.state;

    const smbhMass =
      nucleus
        .supermassiveBlackHole
        ?.massSolarMasses ??
      null;

    if (
      state ===
      GalacticNucleusState.QUIESCENT
    ) {
      return new GalacticNuclearActivityProfile(
        GalacticNucleusState.QUIESCENT,
        GalacticNuclearActivityEventKind.NONE,
        GalacticNuclearActivityRarity.BASELINE,
        smbhMass,
      );
    }

    if (
      state ===
      GalacticNucleusState.AGN
    ) {
      if (
        smbhMass ===
        null
      ) {
        throw new RangeError(
          'AGN Ground Truth requires a supermassive black hole.',
        );
      }

      return new GalacticNuclearActivityProfile(
        GalacticNucleusState.AGN,
        GalacticNuclearActivityEventKind.AGN_EPISODE,
        GalacticNuclearActivityRarity.RARE,
        smbhMass,
      );
    }

    if (
      state ===
      GalacticNucleusState.QUASAR
    ) {
      if (
        smbhMass ===
        null
      ) {
        throw new RangeError(
          'QUASAR Ground Truth requires a supermassive black hole.',
        );
      }

      return new GalacticNuclearActivityProfile(
        GalacticNucleusState.QUASAR,
        GalacticNuclearActivityEventKind.QUASAR_EPISODE,
        GalacticNuclearActivityRarity.EXTREMELY_RARE,
        smbhMass,
      );
    }

    throw new RangeError(
      `Unsupported GalacticNucleusState: ${String(state)}.`,
    );
  }
}
