import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  PlanetaryOrbitalElements,
} from './planetary-orbital-elements';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

const CONSISTENCY_TOLERANCE =
  1e-12;

/**
 * Point-18.3 ordered geometric orbit set for the mature architecture.
 *
 * The generation envelope is the finite radial interval used to place the
 * current V1 planets. It is not itself a dynamical-stability verdict: point 18.5
 * consumes this frozen geometry for the basic mutual-Hill/boundary assessment.
 */
export class PlanetarySystemOrbitalLayout {

  readonly orbits:
    readonly PlanetaryOrbitalElements[];

  constructor(
    readonly systemLocator:
      SystemLocator,

    readonly orbitTopology:
      PlanetarySystemOrbitTopology,

    readonly generationInnerLimitAu:
      number | null,

    readonly generationOuterLimitAu:
      number | null,

    orbits:
      readonly PlanetaryOrbitalElements[],
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

    validateEnvelope(
      generationInnerLimitAu,
      generationOuterLimitAu,
      orbits.length,
    );

    validateOrbits(
      systemLocator,
      generationInnerLimitAu,
      generationOuterLimitAu,
      orbits,
    );

    this.orbits =
      Object.freeze([
        ...orbits,
      ]);
  }

  get planetCount():
    number {

    return this
      .orbits
      .length;
  }

  get hasPlanets():
    boolean {

    return (
      this.planetCount >
      0
    );
  }

  get innerSemiMajorAxisAu():
    number | null {

    return this.orbits[0]
      ?.semiMajorAxisAu ??
      null;
  }

  get outerSemiMajorAxisAu():
    number | null {

    return this
      .orbits[
        this.orbits.length -
          1
      ]
      ?.semiMajorAxisAu ??
      null;
  }

  get radialSpanRatio():
    number | null {

    const inner =
      this.innerSemiMajorAxisAu;

    const outer =
      this.outerSemiMajorAxisAu;

    if (
      inner ===
        null ||
      outer ===
        null
    ) {
      return null;
    }

    return (
      outer /
      inner
    );
  }
}

function validateEnvelope(
  inner:
    number | null,

  outer:
    number | null,

  orbitCount:
    number,
): void {

  const hasInner =
    inner !==
    null;

  const hasOuter =
    outer !==
    null;

  if (
    hasInner !==
    hasOuter
  ) {
    throw new RangeError(
      'Point-18.3 generation radial limits must either both be present or both be null.',
    );
  }

  if (
    !hasInner ||
    !hasOuter
  ) {
    if (
      orbitCount >
      0
    ) {
      throw new RangeError(
        'Non-empty planetary orbital layouts require a finite generation envelope.',
      );
    }

    return;
  }

  assertPositiveFinite(
    inner,
    'generationInnerLimitAu',
  );

  assertPositiveFinite(
    outer,
    'generationOuterLimitAu',
  );

  if (
    outer <=
    inner
  ) {
    throw new RangeError(
      'generationOuterLimitAu must be greater than generationInnerLimitAu.',
    );
  }
}

function validateOrbits(
  systemLocator:
    SystemLocator,

  inner:
    number | null,

  outer:
    number | null,

  orbits:
    readonly PlanetaryOrbitalElements[],
): void {

  let previous:
    PlanetaryOrbitalElements | null =
      null;

  for (
    let index = 0;
    index <
      orbits.length;
    index += 1
  ) {
    const orbit =
      orbits[index];

    if (
      orbit.planetOrdinal !==
      index +
        1
    ) {
      throw new RangeError(
        'Planetary orbital elements must be contiguous and ordered by planetOrdinal.',
      );
    }

    if (
      !sameSystemLocator(
        systemLocator,
        orbit.bodyLocator,
      )
    ) {
      throw new RangeError(
        'Every planetary orbit must belong to the orbital-layout SystemLocator.',
      );
    }

    if (
      inner !==
        null &&
      outer !==
        null &&
      (
        orbit.semiMajorAxisAu <
          inner -
            CONSISTENCY_TOLERANCE ||
        orbit.semiMajorAxisAu >
          outer +
            CONSISTENCY_TOLERANCE
      )
    ) {
      throw new RangeError(
        'Every point-18.3 semi-major axis must lie inside the generated radial envelope.',
      );
    }

    if (
      previous !==
      null
    ) {
      if (
        orbit.semiMajorAxisAu <=
        previous.semiMajorAxisAu
      ) {
        throw new RangeError(
          'Point-18.3 semi-major axes must be strictly increasing.',
        );
      }

      if (
        previous.apoastronAu +
          CONSISTENCY_TOLERANCE >=
        orbit.periastronAu
      ) {
        throw new RangeError(
          'Point-18.3 baseline planetary ellipses must not geometrically cross.',
        );
      }
    }

    previous =
      orbit;
  }
}

function sameSystemLocator(
  systemLocator:
    SystemLocator,

  bodyLocator:
    PlanetaryOrbitalElements['bodyLocator'],
): boolean {

  return (
    systemLocator.galaxyIndex ===
      bodyLocator.galaxyIndex &&
    systemLocator.sectorKey ===
      bodyLocator.sectorKey &&
    systemLocator.galacticObjectIndex ===
      bodyLocator.galacticObjectIndex
  );
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
