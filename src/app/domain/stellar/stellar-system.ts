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

const MASS_ORDER_TOLERANCE =
  1e-12;

/**
 * Canonical stellar-system domain model.
 *
 * Point 16.1 established SINGLE around the frozen phase-15 primary, point 16.2
 * added deterministic B for BINARY, and point 16.3 adds deterministic C for
 * TRIPLE. SystemLocator/SystemSeed continue to identify the whole system and
 * the canonical A primary remains unchanged in every architecture.
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

    readonly tertiaryCompanion:
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
          null ||
        tertiaryCompanion !==
          null
      ) {
        throw new RangeError(
          'SINGLE stellar systems cannot carry stellar companions.',
        );
      }

      return;
    }

    if (
      secondaryCompanion ===
        null
    ) {
      throw new RangeError(
        `${multiplicity.name} stellar systems require component B.`,
      );
    }

    assertCompanion(
      secondaryCompanion,
      StellarSystemComponentLabel.B,
      designation,
    );

    if (
      multiplicity ===
      StellarSystemMultiplicity.BINARY
    ) {
      if (
        tertiaryCompanion !==
          null
      ) {
        throw new RangeError(
          'BINARY stellar systems cannot carry component C.',
        );
      }

      return;
    }

    if (
      multiplicity ===
      StellarSystemMultiplicity.TRIPLE
    ) {
      if (
        tertiaryCompanion ===
          null
      ) {
        throw new RangeError(
          'TRIPLE stellar systems require component C.',
        );
      }

      assertCompanion(
        tertiaryCompanion,
        StellarSystemComponentLabel.C,
        designation,
      );

      if (
        tertiaryCompanion
          .componentSeedHex ===
        secondaryCompanion
          .componentSeedHex
      ) {
        throw new RangeError(
          'TRIPLE component seeds B and C must be distinct.',
        );
      }

      const secondaryMass =
        secondaryCompanion
          .physicalProperties
          .initialMassSolar;

      const tertiaryMass =
        tertiaryCompanion
          .physicalProperties
          .initialMassSolar;

      const scale =
        Math.max(
          1,
          Math.abs(
            secondaryMass,
          ),
          Math.abs(
            tertiaryMass,
          ),
        );

      if (
        tertiaryMass -
          secondaryMass >
        MASS_ORDER_TOLERANCE *
          scale
      ) {
        throw new RangeError(
          'TRIPLE component C cannot be more massive than component B in the V1 ordering.',
        );
      }

      return;
    }

    throw new RangeError(
      `Unsupported StellarSystemMultiplicity for point 16.3: ${multiplicity.name}.`,
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

function assertCompanion(
  companion:
    StellarCompanion,

  expectedLabel:
    StellarSystemComponentLabel,

  systemDesignation:
    StellarDesignation,
): void {

  if (
    companion
      .componentLabel !==
    expectedLabel
  ) {
    throw new RangeError(
      `Expected stellar-system component ${expectedLabel.name}.`,
    );
  }

  if (
    companion
      .designation
      .systemDesignation
      .name !==
      systemDesignation.name ||
    companion
      .designation
      .systemDesignation
      .proceduralCode !==
      systemDesignation.proceduralCode
  ) {
    throw new RangeError(
      'Companion designation must be layered over this stellar-system designation.',
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
