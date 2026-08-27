import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  type Star,
} from './star';

import {
  type StellarDesignation,
} from './stellar-designation';

import {
  StellarSystemMultiplicity,
} from './stellar-system-multiplicity';

/**
 * Point-16.1 domain model for one canonical single-star stellar system.
 *
 * The existing SystemLocator/SystemSeed remain the procedural identity of the
 * system. Its point-15 canonical Star is the sole stellar component and shares
 * that locator by design. No StarLocator, StarSeed or additional entropy level
 * is introduced here.
 *
 * Binary/triple companions, orbital hierarchy, circumbinary compatibility and
 * planetary-stability effects remain later point-16 contracts.
 */
export class StellarSystem {

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly locator:
      SystemLocator,

    readonly seed:
      SystemSeed,

    readonly designation:
      StellarDesignation,

    readonly multiplicity:
      StellarSystemMultiplicity,

    readonly primaryStar:
      Star,
  ) {
    if (
      multiplicity !==
      StellarSystemMultiplicity.SINGLE
    ) {
      throw new RangeError(
        'Point 16.1 StellarSystem supports SINGLE systems only.',
      );
    }

    if (
      !generationKey.equals(
        primaryStar.generationKey,
      )
    ) {
      throw new RangeError(
        'The primary Star must share the stellar-system UniverseGenerationKey.',
      );
    }

    if (
      !sameSystemLocator(
        locator,
        primaryStar.locator,
      )
    ) {
      throw new RangeError(
        'The primary Star must share the stellar-system SystemLocator.',
      );
    }
  }

  get stellarComponentCount():
    number {

    return this
      .multiplicity
      .stellarComponentCount;
  }

  get isMultiple():
    boolean {

    return this
      .stellarComponentCount >
      1;
  }
}

function sameSystemLocator(
  left:
    SystemLocator,

  right:
    SystemLocator,
): boolean {

  return (
    left.galaxyIndex ===
      right.galaxyIndex &&
    left.sectorKey ===
      right.sectorKey &&
    left.galacticObjectIndex ===
      right.galacticObjectIndex
  );
}
