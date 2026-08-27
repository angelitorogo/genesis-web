import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  CircumbinaryHabitabilityAssessment,
  CircumbinaryPlanetaryStabilityRegime,
  CircumbinaryStellarEvolutionRegime,
} from '../../domain/habitability/circumbinary-habitability-assessment';

import {
  type CircumbinaryPlanetCompatibility,
} from '../../domain/planetary/circumbinary-planet-compatibility';

import {
  type Star,
} from '../../domain/stellar/star';

import {
  type StellarCompanion,
} from '../../domain/stellar/stellar-companion';

import {
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';

import {
  type StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  StellarSystemComponentLabel,
} from '../../domain/stellar/stellar-system-component-label';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

/**
 * Solar-equivalent conservative reference fluxes used by point 16.6.
 *
 * These correspond approximately to the runaway-greenhouse and
 * maximum-greenhouse limits for a solar spectrum. V1 deliberately does not
 * pretend to perform the later spectral/climate correction for two different
 * stellar SEDs; it exposes a deterministic reference zone that can be evolved
 * in a future climate model without changing the frozen stellar architecture.
 */
export const CIRCUMBINARY_V1_INNER_HABITABLE_EFFECTIVE_FLUX_SOLAR =
  1.107;

export const CIRCUMBINARY_V1_OUTER_HABITABLE_EFFECTIVE_FLUX_SOLAR =
  0.356;

const OVERLAP_TOLERANCE =
  1e-12;

/**
 * Point-16.6 pure coupling between the radiative A+B reference HZ and the
 * point-16.5 dynamically permitted P-type interval.
 *
 * No seed, PRNG draw, planet formation roll, planet materialization, climate,
 * atmosphere or life inference occurs here. Component C affects a triple only
 * through the already-frozen point-16.5 outer dynamical cutoff; its direct
 * irradiation is intentionally outside this simplified inner-pair HZ model.
 */
export class CircumbinaryHabitabilityAssessmentGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    compatibility:
      CircumbinaryPlanetCompatibility,

    primaryPhysicalProperties:
      StellarPhysicalProperties,

    primaryStar:
      Star,

    secondaryCompanion:
      StellarCompanion,
  ): CircumbinaryHabitabilityAssessment {
    assertSupportedVersion(
      generationKey,
    );

    if (
      compatibility.hostMultiplicity !==
        StellarSystemMultiplicity.BINARY &&
      compatibility.hostMultiplicity !==
        StellarSystemMultiplicity.TRIPLE
    ) {
      throw new RangeError(
        'Point-16.6 circumbinary habitability requires BINARY or TRIPLE compatibility.',
      );
    }

    if (
      secondaryCompanion.componentLabel !==
      StellarSystemComponentLabel.B
    ) {
      throw new RangeError(
        'Point-16.6 circumbinary habitability requires component B as the inner-pair companion.',
      );
    }

    const combinedReferenceLuminositySolar =
      primaryPhysicalProperties
        .luminositySolar +
      secondaryCompanion
        .physicalProperties
        .luminositySolar;

    if (
      !Number.isFinite(
        combinedReferenceLuminositySolar,
      ) ||
      combinedReferenceLuminositySolar <=
        0
    ) {
      throw new RangeError(
        'Combined A+B reference luminosity must be finite and greater than 0.',
      );
    }

    const radiativeHabitableInnerEdgeAu =
      Math.sqrt(
        combinedReferenceLuminositySolar /
        CIRCUMBINARY_V1_INNER_HABITABLE_EFFECTIVE_FLUX_SOLAR,
      );

    const radiativeHabitableOuterEdgeAu =
      Math.sqrt(
        combinedReferenceLuminositySolar /
        CIRCUMBINARY_V1_OUTER_HABITABLE_EFFECTIVE_FLUX_SOLAR,
      );

    const stellarEvolutionRegime =
      isMainSequencePair(
        primaryStar,
        secondaryCompanion,
      )
        ? CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR
        : CircumbinaryStellarEvolutionRegime.REFERENCE_ONLY;

    if (
      !compatibility.isCompatible
    ) {
      return noStableZone(
        compatibility.hostMultiplicity,
        combinedReferenceLuminositySolar,
        radiativeHabitableInnerEdgeAu,
        radiativeHabitableOuterEdgeAu,
        stellarEvolutionRegime,
      );
    }

    const stableInner =
      Math.max(
        radiativeHabitableInnerEdgeAu,
        compatibility.minimumStableSemiMajorAxisAu,
      );

    const stableOuter =
      Math.min(
        radiativeHabitableOuterEdgeAu,
        compatibility.maximumStableSemiMajorAxisAu ??
          Number.POSITIVE_INFINITY,
      );

    const scale =
      Math.max(
        1,
        stableInner,
        Number.isFinite(
          stableOuter,
        )
          ? stableOuter
          : 1,
      );

    if (
      stableOuter -
        stableInner <=
      OVERLAP_TOLERANCE *
        scale
    ) {
      return noStableZone(
        compatibility.hostMultiplicity,
        combinedReferenceLuminositySolar,
        radiativeHabitableInnerEdgeAu,
        radiativeHabitableOuterEdgeAu,
        stellarEvolutionRegime,
      );
    }

    const radiativeWidth =
      radiativeHabitableOuterEdgeAu -
      radiativeHabitableInnerEdgeAu;

    const stableWidth =
      stableOuter -
      stableInner;

    const stableHabitableZoneFraction =
      clamp01(
        stableWidth /
        radiativeWidth,
      );

    const fullOverlap =
      approximatelyEqual(
        stableInner,
        radiativeHabitableInnerEdgeAu,
      ) &&
      approximatelyEqual(
        stableOuter,
        radiativeHabitableOuterEdgeAu,
      );

    return new CircumbinaryHabitabilityAssessment(
      compatibility.hostMultiplicity,
      combinedReferenceLuminositySolar,
      radiativeHabitableInnerEdgeAu,
      radiativeHabitableOuterEdgeAu,
      stableInner,
      stableOuter,
      fullOverlap
        ? 1
        : stableHabitableZoneFraction,
      fullOverlap
        ? CircumbinaryPlanetaryStabilityRegime.FULL_STABLE_HABITABLE_ZONE
        : CircumbinaryPlanetaryStabilityRegime.PARTIAL_STABLE_HABITABLE_ZONE,
      stellarEvolutionRegime,
    );
  }
}

function noStableZone(
  hostMultiplicity:
    StellarSystemMultiplicity,

  combinedReferenceLuminositySolar:
    number,

  radiativeHabitableInnerEdgeAu:
    number,

  radiativeHabitableOuterEdgeAu:
    number,

  stellarEvolutionRegime:
    CircumbinaryStellarEvolutionRegime,
): CircumbinaryHabitabilityAssessment {
  return new CircumbinaryHabitabilityAssessment(
    hostMultiplicity,
    combinedReferenceLuminositySolar,
    radiativeHabitableInnerEdgeAu,
    radiativeHabitableOuterEdgeAu,
    null,
    null,
    0,
    CircumbinaryPlanetaryStabilityRegime.NO_STABLE_HABITABLE_ZONE,
    stellarEvolutionRegime,
  );
}

function isMainSequencePair(
  primaryStar:
    Star,

  secondaryCompanion:
    StellarCompanion,
): boolean {
  return (
    primaryStar.evolutionState.name ===
      StellarEvolutionState.MAIN_SEQUENCE.name &&
    secondaryCompanion.currentEvolutionState.name ===
      StellarEvolutionState.MAIN_SEQUENCE.name
  );
}

function assertSupportedVersion(
  generationKey:
    UniverseGenerationKey,
): void {
  if (
    generationKey.generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }
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

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {
  const scale =
    Math.max(
      1,
      Math.abs(
        left,
      ),
      Math.abs(
        right,
      ),
    );

  return (
    Math.abs(
      left -
      right,
    ) <=
    OVERLAP_TOLERANCE *
      scale
  );
}
