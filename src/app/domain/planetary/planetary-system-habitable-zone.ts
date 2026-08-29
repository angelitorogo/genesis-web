import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  PlanetarySystemHabitableZoneDynamicalRegime,
} from './planetary-system-habitable-zone-dynamical-regime';

import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from './planetary-system-habitable-zone-evolution-regime';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-18.6 reference habitable-zone geometry for one planetary system.
 *
 * The radiative interval is derived only from frozen reference stellar
 * luminosity and conservative solar-equivalent flux limits. For P-type
 * multiple systems, dynamicallyHabitable* clips that radiative interval to the
 * already-frozen point-16.5/16.6 circumbinary stability envelope. For a SINGLE
 * host the dynamically available interval is the complete radiative interval.
 *
 * This object never claims that a planet is habitable. Atmosphere, surface
 * pressure, albedo, greenhouse feedback, water inventory, climate and life are
 * outside point 18.6. Point 18.7 alone will classify frozen orbits relative to
 * this geometry.
 */
export class PlanetarySystemHabitableZone {

  constructor(
    readonly systemLocator:
      SystemLocator,

    readonly orbitTopology:
      PlanetarySystemOrbitTopology,

    readonly referenceLuminositySolar:
      number,

    readonly innerEffectiveFluxSolar:
      number,

    readonly outerEffectiveFluxSolar:
      number,

    readonly radiativeInnerEdgeAu:
      number,

    readonly radiativeOuterEdgeAu:
      number,

    readonly dynamicallyHabitableInnerEdgeAu:
      number | null,

    readonly dynamicallyHabitableOuterEdgeAu:
      number | null,

    readonly dynamicalOverlapFraction01:
      number,

    readonly dynamicalRegime:
      PlanetarySystemHabitableZoneDynamicalRegime,

    readonly stellarEvolutionRegime:
      PlanetarySystemHabitableZoneEvolutionRegime,
  ) {
    if (
      !Object.values(
        PlanetarySystemOrbitTopology,
      ).includes(
        orbitTopology,
      )
    ) {
      throw new RangeError(
        'orbitTopology must be a known PlanetarySystemOrbitTopology.',
      );
    }

    assertPositiveFinite(
      referenceLuminositySolar,
      'referenceLuminositySolar',
    );

    assertPositiveFinite(
      innerEffectiveFluxSolar,
      'innerEffectiveFluxSolar',
    );

    assertPositiveFinite(
      outerEffectiveFluxSolar,
      'outerEffectiveFluxSolar',
    );

    if (
      innerEffectiveFluxSolar <=
      outerEffectiveFluxSolar
    ) {
      throw new RangeError(
        'innerEffectiveFluxSolar must exceed outerEffectiveFluxSolar.',
      );
    }

    assertPositiveFinite(
      radiativeInnerEdgeAu,
      'radiativeInnerEdgeAu',
    );

    assertPositiveFinite(
      radiativeOuterEdgeAu,
      'radiativeOuterEdgeAu',
    );

    if (
      radiativeOuterEdgeAu <=
      radiativeInnerEdgeAu
    ) {
      throw new RangeError(
        'radiativeOuterEdgeAu must be greater than radiativeInnerEdgeAu.',
      );
    }

    const expectedInnerEdgeAu =
      Math.sqrt(
        referenceLuminositySolar /
        innerEffectiveFluxSolar,
      );

    const expectedOuterEdgeAu =
      Math.sqrt(
        referenceLuminositySolar /
        outerEffectiveFluxSolar,
      );

    if (
      !approximatelyEqual(
        radiativeInnerEdgeAu,
        expectedInnerEdgeAu,
      ) ||
      !approximatelyEqual(
        radiativeOuterEdgeAu,
        expectedOuterEdgeAu,
      )
    ) {
      throw new RangeError(
        'Radiative habitable-zone edges must match sqrt(reference luminosity / effective flux).',
      );
    }

    assertNormalized(
      dynamicalOverlapFraction01,
      'dynamicalOverlapFraction01',
    );

    if (
      !Object.values(
        PlanetarySystemHabitableZoneDynamicalRegime,
      ).includes(
        dynamicalRegime,
      )
    ) {
      throw new RangeError(
        'dynamicalRegime must be a known PlanetarySystemHabitableZoneDynamicalRegime.',
      );
    }

    if (
      !Object.values(
        PlanetarySystemHabitableZoneEvolutionRegime,
      ).includes(
        stellarEvolutionRegime,
      )
    ) {
      throw new RangeError(
        'stellarEvolutionRegime must be a known PlanetarySystemHabitableZoneEvolutionRegime.',
      );
    }

    validateDynamicalInterval(
      radiativeInnerEdgeAu,
      radiativeOuterEdgeAu,
      dynamicallyHabitableInnerEdgeAu,
      dynamicallyHabitableOuterEdgeAu,
      dynamicalOverlapFraction01,
      dynamicalRegime,
    );

    validateTopologyEvolution(
      orbitTopology,
      dynamicalRegime,
      stellarEvolutionRegime,
    );
  }

  get radiativeWidthAu():
    number {

    return (
      this.radiativeOuterEdgeAu -
      this.radiativeInnerEdgeAu
    );
  }

  get dynamicallyHabitableWidthAu():
    number {

    if (
      this.dynamicallyHabitableInnerEdgeAu ===
        null ||
      this.dynamicallyHabitableOuterEdgeAu ===
        null
    ) {
      return 0;
    }

    return (
      this.dynamicallyHabitableOuterEdgeAu -
      this.dynamicallyHabitableInnerEdgeAu
    );
  }

  get hasDynamicallyAvailableHabitableZone():
    boolean {

    return this.dynamicalRegime !==
      PlanetarySystemHabitableZoneDynamicalRegime.NO_DYNAMICAL_OVERLAP;
  }

  get isPersistentReferenceCandidate():
    boolean {

    return (
      this.hasDynamicallyAvailableHabitableZone &&
      this.stellarEvolutionRegime !==
        PlanetarySystemHabitableZoneEvolutionRegime.REFERENCE_ONLY
    );
  }
}

function validateDynamicalInterval(
  radiativeInnerEdgeAu:
    number,

  radiativeOuterEdgeAu:
    number,

  dynamicallyHabitableInnerEdgeAu:
    number | null,

  dynamicallyHabitableOuterEdgeAu:
    number | null,

  dynamicalOverlapFraction01:
    number,

  dynamicalRegime:
    PlanetarySystemHabitableZoneDynamicalRegime,
): void {

  if (
    dynamicalRegime ===
    PlanetarySystemHabitableZoneDynamicalRegime.NO_DYNAMICAL_OVERLAP
  ) {
    if (
      dynamicallyHabitableInnerEdgeAu !==
        null ||
      dynamicallyHabitableOuterEdgeAu !==
        null ||
      dynamicalOverlapFraction01 !==
        0
    ) {
      throw new RangeError(
        'NO_DYNAMICAL_OVERLAP requires null dynamic edges and zero overlap fraction.',
      );
    }

    return;
  }

  if (
    dynamicallyHabitableInnerEdgeAu ===
      null ||
    dynamicallyHabitableOuterEdgeAu ===
      null
  ) {
    throw new RangeError(
      'A dynamically available habitable zone requires finite inner and outer edges.',
    );
  }

  assertPositiveFinite(
    dynamicallyHabitableInnerEdgeAu,
    'dynamicallyHabitableInnerEdgeAu',
  );

  assertPositiveFinite(
    dynamicallyHabitableOuterEdgeAu,
    'dynamicallyHabitableOuterEdgeAu',
  );

  if (
    dynamicallyHabitableOuterEdgeAu <=
    dynamicallyHabitableInnerEdgeAu
  ) {
    throw new RangeError(
      'dynamicallyHabitableOuterEdgeAu must exceed dynamicallyHabitableInnerEdgeAu.',
    );
  }

  if (
    dynamicallyHabitableInnerEdgeAu <
      radiativeInnerEdgeAu -
        CONSISTENCY_TOLERANCE ||
    dynamicallyHabitableOuterEdgeAu >
      radiativeOuterEdgeAu +
        CONSISTENCY_TOLERANCE
  ) {
    throw new RangeError(
      'The dynamically available habitable interval must remain inside the radiative interval.',
    );
  }

  const expectedFraction =
    (
      dynamicallyHabitableOuterEdgeAu -
      dynamicallyHabitableInnerEdgeAu
    ) /
    (
      radiativeOuterEdgeAu -
      radiativeInnerEdgeAu
    );

  if (
    !approximatelyEqual(
      dynamicalOverlapFraction01,
      expectedFraction,
    )
  ) {
    throw new RangeError(
      'dynamicalOverlapFraction01 must match the dynamic/radiative width ratio.',
    );
  }

  if (
    dynamicalRegime ===
      PlanetarySystemHabitableZoneDynamicalRegime.FULL_DYNAMICAL_OVERLAP &&
    (
      !approximatelyEqual(
        dynamicallyHabitableInnerEdgeAu,
        radiativeInnerEdgeAu,
      ) ||
      !approximatelyEqual(
        dynamicallyHabitableOuterEdgeAu,
        radiativeOuterEdgeAu,
      ) ||
      !approximatelyEqual(
        dynamicalOverlapFraction01,
        1,
      )
    )
  ) {
    throw new RangeError(
      'FULL_DYNAMICAL_OVERLAP requires the complete radiative habitable zone.',
    );
  }

  if (
    dynamicalRegime ===
      PlanetarySystemHabitableZoneDynamicalRegime.PARTIAL_DYNAMICAL_OVERLAP &&
    !(
      dynamicalOverlapFraction01 >
        0 &&
      dynamicalOverlapFraction01 <
        1
    )
  ) {
    throw new RangeError(
      'PARTIAL_DYNAMICAL_OVERLAP requires an overlap fraction strictly between 0 and 1.',
    );
  }
}

function validateTopologyEvolution(
  orbitTopology:
    PlanetarySystemOrbitTopology,

  dynamicalRegime:
    PlanetarySystemHabitableZoneDynamicalRegime,

  stellarEvolutionRegime:
    PlanetarySystemHabitableZoneEvolutionRegime,
): void {

  if (
    orbitTopology ===
    PlanetarySystemOrbitTopology.CIRCUMSTELLAR
  ) {
    if (
      dynamicalRegime !==
      PlanetarySystemHabitableZoneDynamicalRegime.FULL_DYNAMICAL_OVERLAP
    ) {
      throw new RangeError(
        'A V1 CIRCUMSTELLAR reference habitable zone must expose the full radiative interval.',
      );
    }

    if (
      stellarEvolutionRegime ===
      PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_INNER_PAIR
    ) {
      throw new RangeError(
        'CIRCUMSTELLAR habitable zones cannot use MAIN_SEQUENCE_INNER_PAIR.',
      );
    }

    return;
  }

  if (
    stellarEvolutionRegime ===
    PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST
  ) {
    throw new RangeError(
      'CIRCUMBINARY habitable zones cannot use MAIN_SEQUENCE_HOST.',
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
    CONSISTENCY_TOLERANCE *
      scale
  );
}
