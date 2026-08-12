import {
  GalacticNucleusState,
} from '../universe/galactic-nucleus-state';

/**
 * Event-like interpretation of the current procedural nuclear Ground Truth.
 *
 * IMPORTANT:
 * AGN_EPISODE and QUASAR_EPISODE describe the active state represented by the
 * current procedural snapshot. Point 6.7 does not implement time evolution,
 * durations, transitions or event scheduling.
 */
export enum GalacticNuclearActivityEventKind {
  NONE =
    'NONE',

  AGN_EPISODE =
    'AGN_EPISODE',

  QUASAR_EPISODE =
    'QUASAR_EPISODE',
}

/**
 * Broad rarity classification for the current nuclear activity snapshot.
 */
export enum GalacticNuclearActivityRarity {
  BASELINE =
    'BASELINE',

  RARE =
    'RARE',

  EXTREMELY_RARE =
    'EXTREMELY_RARE',
}

/**
 * Deterministic classification of a galaxy's already-generated nuclear state.
 *
 * This profile does not reroll nuclear activity and does not introduce a
 * temporal engine. It is a read-only interpretation of Galaxy.nucleus Ground
 * Truth.
 */
export class GalacticNuclearActivityProfile {

  constructor(
    readonly nucleusState:
      GalacticNucleusState | null,

    readonly eventKind:
      GalacticNuclearActivityEventKind,

    readonly rarity:
      GalacticNuclearActivityRarity,

    readonly supermassiveBlackHoleMassSolarMasses:
      number | null,
  ) {
    if (
      supermassiveBlackHoleMassSolarMasses !==
        null &&
      (
        !Number.isFinite(
          supermassiveBlackHoleMassSolarMasses,
        ) ||
        supermassiveBlackHoleMassSolarMasses <=
          0.0
      )
    ) {
      throw new RangeError(
        'supermassiveBlackHoleMassSolarMasses must be null or finite and greater than 0.0.',
      );
    }

    if (
      nucleusState ===
      null
    ) {
      if (
        eventKind !==
          GalacticNuclearActivityEventKind.NONE ||
        rarity !==
          GalacticNuclearActivityRarity.BASELINE ||
        supermassiveBlackHoleMassSolarMasses !==
          null
      ) {
        throw new RangeError(
          'A galaxy without a nucleus must map to NONE, BASELINE and null SMBH mass.',
        );
      }

      return;
    }

    if (
      nucleusState ===
      GalacticNucleusState.QUIESCENT
    ) {
      if (
        eventKind !==
          GalacticNuclearActivityEventKind.NONE ||
        rarity !==
          GalacticNuclearActivityRarity.BASELINE
      ) {
        throw new RangeError(
          'A QUIESCENT nucleus must map to NONE and BASELINE.',
        );
      }

      return;
    }

    if (
      nucleusState ===
      GalacticNucleusState.AGN
    ) {
      if (
        eventKind !==
          GalacticNuclearActivityEventKind.AGN_EPISODE ||
        rarity !==
          GalacticNuclearActivityRarity.RARE ||
        supermassiveBlackHoleMassSolarMasses ===
          null
      ) {
        throw new RangeError(
          'An AGN nucleus must map to AGN_EPISODE, RARE and a non-null SMBH mass.',
        );
      }

      return;
    }

    if (
      nucleusState ===
      GalacticNucleusState.QUASAR
    ) {
      if (
        eventKind !==
          GalacticNuclearActivityEventKind.QUASAR_EPISODE ||
        rarity !==
          GalacticNuclearActivityRarity.EXTREMELY_RARE ||
        supermassiveBlackHoleMassSolarMasses ===
          null
      ) {
        throw new RangeError(
          'A QUASAR nucleus must map to QUASAR_EPISODE, EXTREMELY_RARE and a non-null SMBH mass.',
        );
      }

      return;
    }

    throw new RangeError(
      `Unsupported GalacticNucleusState: ${String(nucleusState)}.`,
    );
  }

  get hasNucleus():
    boolean {

    return this.nucleusState !==
      null;
  }

  get hasSupermassiveBlackHole():
    boolean {

    return this
      .supermassiveBlackHoleMassSolarMasses !==
      null;
  }

  get isActiveEpisode():
    boolean {

    return this.eventKind !==
      GalacticNuclearActivityEventKind.NONE;
  }
}
