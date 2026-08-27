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
 * Deterministic non-primary stellar component inside one multiple system.
 *
 * Point 16.2 introduced B and point 16.3 extends the same intra-system model
 * with C. Neither companion is represented as the phase-14/15 Star entity
 * because that entity remains the canonical A primary tied to SystemLocator.
 *
 * The component carries an independent intra-system seed, component
 * designation, reference physical/spectral baseline and coeval evolution.
 * Orbit geometry remains point 16.4 and no BodyLocator is introduced here.
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
        StellarSystemComponentLabel.B &&
      componentLabel !==
        StellarSystemComponentLabel.C
    ) {
      throw new RangeError(
        'StellarCompanion supports non-primary component labels B or C only.',
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

    const expectedCompanionMass =
      primaryInitialMassSolar *
      massRatioToPrimary;

    const scale =
      Math.max(
        1,
        Math.abs(
          expectedCompanionMass,
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
        expectedCompanionMass,
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
