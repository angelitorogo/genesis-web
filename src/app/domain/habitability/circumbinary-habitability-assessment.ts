import {
  StellarSystemMultiplicity,
} from '../stellar/stellar-system-multiplicity';

const BOUNDARY_TOLERANCE =
  1e-12;

/**
 * Point-16.6 overlap between the reference radiative habitable zone of A+B and
 * the point-16.5 dynamically stable circumbinary interval.
 */
export enum CircumbinaryPlanetaryStabilityRegime {
  NO_STABLE_HABITABLE_ZONE =
    'NO_STABLE_HABITABLE_ZONE',

  PARTIAL_STABLE_HABITABLE_ZONE =
    'PARTIAL_STABLE_HABITABLE_ZONE',

  FULL_STABLE_HABITABLE_ZONE =
    'FULL_STABLE_HABITABLE_ZONE',
}

/**
 * Whether the reference A+B radiative zone can also be treated as a persistent
 * V1 habitability candidate at the currently generated stellar age.
 *
 * Phase 15 stores zero-age/reference luminosities rather than evolved current
 * luminosities. V1 therefore makes the stronger persistent claim only when A
 * and B are both still on the main sequence. Other states retain the useful
 * reference-zone geometry but are explicitly marked REFERENCE_ONLY.
 */
export enum CircumbinaryStellarEvolutionRegime {
  MAIN_SEQUENCE_PAIR =
    'MAIN_SEQUENCE_PAIR',

  REFERENCE_ONLY =
    'REFERENCE_ONLY',
}

/**
 * Point-16.6 habitability/stability assessment for a P-type planet orbiting the
 * inner A-B pair of a BINARY or hierarchical TRIPLE system.
 *
 * This is Ground Truth about allowed orbital geometry, not a claim that a
 * planet exists, has an atmosphere, contains surface water or supports life.
 */
export class CircumbinaryHabitabilityAssessment {

  constructor(
    readonly hostMultiplicity:
      StellarSystemMultiplicity,

    readonly combinedReferenceLuminositySolar:
      number,

    readonly radiativeHabitableInnerEdgeAu:
      number,

    readonly radiativeHabitableOuterEdgeAu:
      number,

    readonly stableHabitableInnerEdgeAu:
      number | null,

    readonly stableHabitableOuterEdgeAu:
      number | null,

    readonly stableHabitableZoneFraction:
      number,

    readonly planetaryStabilityRegime:
      CircumbinaryPlanetaryStabilityRegime,

    readonly stellarEvolutionRegime:
      CircumbinaryStellarEvolutionRegime,
  ) {
    if (
      hostMultiplicity !==
        StellarSystemMultiplicity.BINARY &&
      hostMultiplicity !==
        StellarSystemMultiplicity.TRIPLE
    ) {
      throw new RangeError(
        'Circumbinary habitability is defined only for BINARY or TRIPLE stellar systems.',
      );
    }

    assertPositiveFinite(
      combinedReferenceLuminositySolar,
      'combinedReferenceLuminositySolar',
    );

    assertPositiveFinite(
      radiativeHabitableInnerEdgeAu,
      'radiativeHabitableInnerEdgeAu',
    );

    assertPositiveFinite(
      radiativeHabitableOuterEdgeAu,
      'radiativeHabitableOuterEdgeAu',
    );

    if (
      radiativeHabitableOuterEdgeAu <=
      radiativeHabitableInnerEdgeAu
    ) {
      throw new RangeError(
        'radiativeHabitableOuterEdgeAu must be greater than radiativeHabitableInnerEdgeAu.',
      );
    }

    assertNormalized(
      stableHabitableZoneFraction,
      'stableHabitableZoneFraction',
    );

    if (
      !Object.values(
        CircumbinaryPlanetaryStabilityRegime,
      ).includes(
        planetaryStabilityRegime,
      )
    ) {
      throw new RangeError(
        `Unknown CircumbinaryPlanetaryStabilityRegime: ${String(planetaryStabilityRegime)}.`,
      );
    }

    const hasStableZone =
      stableHabitableInnerEdgeAu !==
        null ||
      stableHabitableOuterEdgeAu !==
        null;

    if (
      planetaryStabilityRegime ===
      CircumbinaryPlanetaryStabilityRegime.NO_STABLE_HABITABLE_ZONE
    ) {
      if (
        hasStableZone ||
        stableHabitableZoneFraction !==
          0
      ) {
        throw new RangeError(
          'NO_STABLE_HABITABLE_ZONE must expose no stable habitable interval and zero overlap fraction.',
        );
      }
    } else {
      if (
        stableHabitableInnerEdgeAu ===
          null ||
        stableHabitableOuterEdgeAu ===
          null
      ) {
        throw new RangeError(
          `${planetaryStabilityRegime} requires a finite stable habitable interval.`,
        );
      }

      assertPositiveFinite(
        stableHabitableInnerEdgeAu,
        'stableHabitableInnerEdgeAu',
      );

      assertPositiveFinite(
        stableHabitableOuterEdgeAu,
        'stableHabitableOuterEdgeAu',
      );

      if (
        stableHabitableOuterEdgeAu <=
        stableHabitableInnerEdgeAu
      ) {
        throw new RangeError(
          'Stable habitable outer edge must be greater than its inner edge.',
        );
      }

      assertContainedBoundary(
        stableHabitableInnerEdgeAu,
        radiativeHabitableInnerEdgeAu,
        radiativeHabitableOuterEdgeAu,
        'stableHabitableInnerEdgeAu',
      );

      assertContainedBoundary(
        stableHabitableOuterEdgeAu,
        radiativeHabitableInnerEdgeAu,
        radiativeHabitableOuterEdgeAu,
        'stableHabitableOuterEdgeAu',
      );

      if (
        stableHabitableZoneFraction <=
        0
      ) {
        throw new RangeError(
          'A stable habitable interval requires a positive overlap fraction.',
        );
      }

      const expectedOverlapFraction =
        (
          stableHabitableOuterEdgeAu -
          stableHabitableInnerEdgeAu
        ) /
        (
          radiativeHabitableOuterEdgeAu -
          radiativeHabitableInnerEdgeAu
        );

      if (
        !approximatelyEqual(
          stableHabitableZoneFraction,
          expectedOverlapFraction,
        )
      ) {
        throw new RangeError(
          'stableHabitableZoneFraction must match the stable/radiative HZ width ratio.',
        );
      }
    }

    if (
      planetaryStabilityRegime ===
        CircumbinaryPlanetaryStabilityRegime.FULL_STABLE_HABITABLE_ZONE &&
      (
        !approximatelyEqual(
          stableHabitableZoneFraction,
          1,
        ) ||
        !approximatelyEqual(
          stableHabitableInnerEdgeAu!,
          radiativeHabitableInnerEdgeAu,
        ) ||
        !approximatelyEqual(
          stableHabitableOuterEdgeAu!,
          radiativeHabitableOuterEdgeAu,
        )
      )
    ) {
      throw new RangeError(
        'FULL_STABLE_HABITABLE_ZONE requires an overlap fraction of 1.',
      );
    }

    if (
      planetaryStabilityRegime ===
        CircumbinaryPlanetaryStabilityRegime.PARTIAL_STABLE_HABITABLE_ZONE &&
      !(
        stableHabitableZoneFraction >
          0 &&
        stableHabitableZoneFraction <
          1
      )
    ) {
      throw new RangeError(
        'PARTIAL_STABLE_HABITABLE_ZONE requires an overlap fraction strictly between 0 and 1.',
      );
    }

    if (
      !Object.values(
        CircumbinaryStellarEvolutionRegime,
      ).includes(
        stellarEvolutionRegime,
      )
    ) {
      throw new RangeError(
        `Unknown CircumbinaryStellarEvolutionRegime: ${String(stellarEvolutionRegime)}.`,
      );
    }
  }

  get hasStableHabitableZone():
    boolean {

    return this
      .planetaryStabilityRegime !==
      CircumbinaryPlanetaryStabilityRegime.NO_STABLE_HABITABLE_ZONE;
  }

  get isPersistentHabitabilityCandidate():
    boolean {

    return (
      this.hasStableHabitableZone &&
      this.stellarEvolutionRegime ===
        CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR
    );
  }

  get stableHabitableZoneWidthAu():
    number {

    if (
      this.stableHabitableInnerEdgeAu ===
        null ||
      this.stableHabitableOuterEdgeAu ===
        null
    ) {
      return 0;
    }

    return (
      this.stableHabitableOuterEdgeAu -
      this.stableHabitableInnerEdgeAu
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  propertyName:
    string,
): void {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and greater than 0: ${value}.`,
    );
  }
}

function assertNormalized(
  value:
    number,

  propertyName:
    string,
): void {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in [0, 1]: ${value}.`,
    );
  }
}

function assertContainedBoundary(
  value:
    number,

  minimum:
    number,

  maximum:
    number,

  propertyName:
    string,
): void {
  const scale =
    Math.max(
      1,
      Math.abs(
        value,
      ),
      Math.abs(
        minimum,
      ),
      Math.abs(
        maximum,
      ),
    );

  if (
    value <
      minimum -
        BOUNDARY_TOLERANCE *
          scale ||
    value >
      maximum +
        BOUNDARY_TOLERANCE *
          scale
  ) {
    throw new RangeError(
      `${propertyName} must lie inside the reference radiative habitable zone.`,
    );
  }
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
    BOUNDARY_TOLERANCE *
      scale
  );
}
