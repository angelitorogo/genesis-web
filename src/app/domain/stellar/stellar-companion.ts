import {
  type StellarLifetimeProfile,
} from './stellar-lifetime-profile';

import {
  type StellarPhysicalProperties,
} from './stellar-physical-properties';

import {
  type StellarSpectralAppearance,
} from './stellar-spectral-appearance';

import {
  type StellarComponentDesignation,
} from './stellar-component-designation';

import {
  StellarSystemComponentLabel,
} from './stellar-system-component-label';

const COMPONENT_SEED_PATTERN =
  /^[0-9A-F]{32}$/u;

const MASS_RATIO_TOLERANCE =
  1e-12;

/**
 * Point-16.2 deterministic stellar companion inside one binary system.
 *
 * The companion is not represented as the phase-14/15 Star entity because that
 * entity is explicitly the canonical primary tied directly to SystemLocator.
 * Instead this component carries its own intra-system seed, A/B designation,
 * reference physical/spectral baseline and a coeval evolution/lifetime result.
 *
 * Orbit geometry belongs to point 16.4; planet/circumbinary effects belong to
 * 16.5/16.6. No BodyLocator or orbital state is introduced here.
 */
export class StellarCompanion {

  constructor(
    readonly componentLabel:
      StellarSystemComponentLabel,

    readonly componentSeedHex:
      string,

    readonly designation:
      StellarComponentDesignation,

    readonly primaryInitialMassSolar:
      number,

    readonly massRatioToPrimary:
      number,

    readonly physicalProperties:
      StellarPhysicalProperties,

    readonly spectralAppearance:
      StellarSpectralAppearance,

    readonly lifetimeProfile:
      StellarLifetimeProfile,
  ) {
    if (
      componentLabel !==
      StellarSystemComponentLabel.B
    ) {
      throw new RangeError(
        'Point 16.2 StellarCompanion supports component B only.',
      );
    }

    if (
      !COMPONENT_SEED_PATTERN.test(
        componentSeedHex,
      )
    ) {
      throw new RangeError(
        `componentSeedHex must be a normalized 128-bit hexadecimal seed: ${componentSeedHex}.`,
      );
    }

    if (
      designation
        .componentLabel !==
      componentLabel
    ) {
      throw new RangeError(
        'Companion designation must use the same component label.',
      );
    }

    if (
      !Number.isFinite(
        primaryInitialMassSolar,
      ) ||
      primaryInitialMassSolar <=
        0
    ) {
      throw new RangeError(
        'primaryInitialMassSolar must be finite and greater than 0.',
      );
    }

    if (
      !Number.isFinite(
        massRatioToPrimary,
      ) ||
      massRatioToPrimary <=
        0 ||
      massRatioToPrimary >
        1
    ) {
      throw new RangeError(
        'massRatioToPrimary must be finite and in range (0, 1].',
      );
    }

    const expectedSecondaryMass =
      primaryInitialMassSolar *
      massRatioToPrimary;

    const scale =
      Math.max(
        1,
        Math.abs(
          expectedSecondaryMass,
        ),
        Math.abs(
          physicalProperties
            .initialMassSolar,
        ),
      );

    if (
      Math.abs(
        physicalProperties
          .initialMassSolar -
        expectedSecondaryMass,
      ) >
      MASS_RATIO_TOLERANCE *
        scale
    ) {
      throw new RangeError(
        'Companion mass ratio must match its generated initial stellar mass.',
      );
    }
  }

  get currentEvolutionState() {
    return this
      .lifetimeProfile
      .evolutionAssessment
      .evolutionState;
  }
}
