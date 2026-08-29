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
  type CircumbinaryHabitabilityAssessment,
  CircumbinaryPlanetaryStabilityRegime,
} from '../habitability/circumbinary-habitability-assessment';

import {
  type CircumbinaryPlanetCompatibility,
} from '../planetary/circumbinary-planet-compatibility';

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
  type StellarOrbitHierarchy,
} from './stellar-orbit-hierarchy';

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
 * Point 16.4 attaches a simplified orbit hierarchy without changing any
 * component identity or stellar properties. Point 16.5 adds a purely
 * dynamical circumbinary-planet compatibility envelope for multiple systems;
 * HZ coupling and rendering remain points 16.6..16.7.
 */
export class StellarSystem {

  /**
   * Non-enumerable cached copy of the frozen point-15.1 luminosity of primary A.
   * It is deliberately excluded from the serialized point-16 object shape.
   */
  declare readonly primaryReferenceLuminositySolar:
    number | null;

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

    readonly orbitHierarchy:
      StellarOrbitHierarchy,

    readonly secondaryCompanion:
      StellarCompanion | null = null,

    readonly tertiaryCompanion:
      StellarCompanion | null = null,

    readonly circumbinaryPlanetCompatibility:
      CircumbinaryPlanetCompatibility | null = null,

    readonly circumbinaryHabitabilityAssessment:
      CircumbinaryHabitabilityAssessment | null = null,

    /**
     * Frozen point-15.1 luminosity of the canonical primary A, carried with the
     * stellar host so later phases do not need to reconstruct sector context
     * from SystemLocator alone. This is a cached physical baseline, not a new
     * procedural identity or entropy source.
     */
    primaryReferenceLuminositySolar:
      number | null = null,
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
      orbitHierarchy
        .multiplicity !==
      multiplicity
    ) {
      throw new RangeError(
        'Stellar-system multiplicity must match its point-16.4 orbit hierarchy.',
      );
    }

    if (
      primaryReferenceLuminositySolar !==
        null &&
      (
        !Number.isFinite(
          primaryReferenceLuminositySolar,
        ) ||
        primaryReferenceLuminositySolar <=
          0
      )
    ) {
      throw new RangeError(
        'primaryReferenceLuminositySolar must be null or finite and greater than 0.',
      );
    }

    Object.defineProperty(
      this,
      'primaryReferenceLuminositySolar',
      {
        value:
          primaryReferenceLuminositySolar,
        enumerable:
          false,
        configurable:
          false,
        writable:
          false,
      },
    );

    if (
      multiplicity ===
        StellarSystemMultiplicity.SINGLE &&
      (
        circumbinaryPlanetCompatibility !==
          null ||
        circumbinaryHabitabilityAssessment !==
          null
      )
    ) {
      throw new RangeError(
        'SINGLE stellar systems cannot carry point-16.5/16.6 circumbinary planetary assessments.',
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

      assertCircumbinaryCompatibility(
        circumbinaryPlanetCompatibility,
        multiplicity,
        orbitHierarchy,
      );

      assertCircumbinaryHabitability(
        circumbinaryHabitabilityAssessment,
        multiplicity,
        circumbinaryPlanetCompatibility,
      );

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

      assertCircumbinaryCompatibility(
        circumbinaryPlanetCompatibility,
        multiplicity,
        orbitHierarchy,
      );

      assertCircumbinaryHabitability(
        circumbinaryHabitabilityAssessment,
        multiplicity,
        circumbinaryPlanetCompatibility,
      );

      return;
    }

    throw new RangeError(
      `Unsupported StellarSystemMultiplicity for point 16.5: ${multiplicity.name}.`,
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

  get supportsCircumbinaryPlanets():
    boolean {

    return this
      .circumbinaryPlanetCompatibility
      ?.isCompatible ??
      false;
  }

  get hasStableCircumbinaryHabitableZone():
    boolean {

    return this
      .circumbinaryHabitabilityAssessment
      ?.hasStableHabitableZone ??
      false;
  }

  get supportsPersistentCircumbinaryHabitability():
    boolean {

    return this
      .circumbinaryHabitabilityAssessment
      ?.isPersistentHabitabilityCandidate ??
      false;
  }

  get primaryComponentDesignation():
    StellarComponentDesignation {

    return new StellarComponentDesignation(
      this.designation,
      StellarSystemComponentLabel.A,
    );
  }
}

function assertCircumbinaryHabitability(
  assessment:
    CircumbinaryHabitabilityAssessment | null,

  multiplicity:
    StellarSystemMultiplicity,

  compatibility:
    CircumbinaryPlanetCompatibility,
): void {

  if (
    assessment ===
    null
  ) {
    throw new RangeError(
      `${multiplicity.name} stellar systems require point-16.6 circumbinary habitability assessment.`,
    );
  }

  if (
    assessment.hostMultiplicity !==
    multiplicity
  ) {
    throw new RangeError(
      'Stellar-system multiplicity must match its circumbinary habitability assessment.',
    );
  }

  if (
    !compatibility.isCompatible &&
    assessment.planetaryStabilityRegime !==
      CircumbinaryPlanetaryStabilityRegime.NO_STABLE_HABITABLE_ZONE
  ) {
    throw new RangeError(
      'A dynamically excluded circumbinary architecture cannot expose a stable habitable zone.',
    );
  }

  if (
    assessment.stableHabitableInnerEdgeAu !==
      null &&
    assessment.stableHabitableInnerEdgeAu <
      compatibility.minimumStableSemiMajorAxisAu
  ) {
    throw new RangeError(
      'Stable habitable inner edge cannot lie inside the point-16.5 dynamical minimum.',
    );
  }

  if (
    assessment.stableHabitableOuterEdgeAu !==
      null &&
    compatibility.maximumStableSemiMajorAxisAu !==
      null &&
    assessment.stableHabitableOuterEdgeAu >
      compatibility.maximumStableSemiMajorAxisAu
  ) {
    throw new RangeError(
      'Stable habitable outer edge cannot exceed the point-16.5 dynamical maximum.',
    );
  }
}

function assertCircumbinaryCompatibility(
  compatibility:
    CircumbinaryPlanetCompatibility | null,

  multiplicity:
    StellarSystemMultiplicity,

  orbitHierarchy:
    StellarOrbitHierarchy,
): asserts compatibility is CircumbinaryPlanetCompatibility {

  if (
    compatibility ===
    null
  ) {
    throw new RangeError(
      `${multiplicity.name} stellar systems require point-16.5 circumbinary planet compatibility.`,
    );
  }

  if (
    compatibility
      .hostMultiplicity !==
    multiplicity
  ) {
    throw new RangeError(
      'Stellar-system multiplicity must match its circumbinary planet compatibility.',
    );
  }

  const innerOrbit =
    orbitHierarchy
      .innerOrbit!;

  if (
    compatibility
      .minimumStableSemiMajorAxisAu <=
    innerOrbit
      .apoastronAu
  ) {
    throw new RangeError(
      'Circumbinary minimum stable radius must lie outside the A-B stellar apoastron.',
    );
  }

  if (
    multiplicity ===
      StellarSystemMultiplicity.TRIPLE &&
    compatibility
      .maximumStableSemiMajorAxisAu! >=
    orbitHierarchy
      .outerOrbit!
      .periastronAu
  ) {
    throw new RangeError(
      'TRIPLE circumbinary maximum stable radius must lie inside the C-orbit periastron.',
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
