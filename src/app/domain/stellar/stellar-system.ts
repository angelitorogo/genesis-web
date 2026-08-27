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
  type StellarCompanion,
} from './stellar-companion';

import {
  StellarComponentDesignation,
} from './stellar-component-designation';

import {
  type StellarDesignation,
} from './stellar-designation';

import {
  StellarSystemComponentLabel,
} from './stellar-system-component-label';

import {
  StellarSystemMultiplicity,
} from './stellar-system-multiplicity';

/**
 * Canonical stellar-system domain model.
 *
 * Point 16.1 established SINGLE around the already-frozen phase-15 primary.
 * Point 16.2 extends the same SystemLocator/SystemSeed identity with one
 * deterministic B companion for BINARY systems. The canonical primary remains
 * unchanged and keeps the original SystemLocator semantics.
 *
 * No orbit hierarchy, circumbinary planet contract, HZ/stability correction or
 * rendering state is owned here; those remain points 16.4..16.7.
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

    readonly secondaryCompanion:
      StellarCompanion | null = null,
  ) {
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

    if (
      multiplicity ===
      StellarSystemMultiplicity.SINGLE
    ) {
      if (
        secondaryCompanion !==
        null
      ) {
        throw new RangeError(
          'SINGLE stellar systems cannot carry a secondary companion.',
        );
      }

      return;
    }

    if (
      multiplicity ===
      StellarSystemMultiplicity.BINARY
    ) {
      if (
        secondaryCompanion ===
        null
      ) {
        throw new RangeError(
          'BINARY stellar systems require exactly one secondary companion.',
        );
      }

      if (
        secondaryCompanion
          .componentLabel !==
        StellarSystemComponentLabel.B
      ) {
        throw new RangeError(
          'The point-16.2 binary companion must use component label B.',
        );
      }

      if (
        secondaryCompanion
          .designation
          .systemDesignation
          .name !==
        designation.name ||
        secondaryCompanion
          .designation
          .systemDesignation
          .proceduralCode !==
        designation.proceduralCode
      ) {
        throw new RangeError(
          'Binary component designation must be layered over this stellar-system designation.',
        );
      }

      return;
    }

    throw new RangeError(
      `Unsupported StellarSystemMultiplicity for point 16.2: ${multiplicity.name}.`,
    );
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

  get primaryComponentDesignation():
    StellarComponentDesignation {

    return new StellarComponentDesignation(
      this.designation,
      StellarSystemComponentLabel.A,
    );
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
