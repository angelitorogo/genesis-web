import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetSurfaceBaseRegime,
} from './planet-surface-base-regime';

import {
  PlanetType,
} from './planet-type';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-19.6 baseline albedo and coarse surface expression for one Planet.
 *
 * referenceBondAlbedo01 is a pre-atmosphere/climate V1 prior suitable for later
 * thermal calculations; phase 20 is allowed to refine the effective value once
 * atmospheric/cloud/climate physics exists.
 *
 * The four base surface fractions are deliberately coarse expression fractions,
 * not observed map coverage. volatile-bearing does not choose water phase or
 * assert an ocean, molten does not constitute the later geology model, and deep
 * envelope means that phase 19 does not expose a solid surface for rendering or
 * surface physics at this level.
 */
export class PlanetSurfaceBaseProperties {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourcePlanetType:
      PlanetType,

    readonly sourceEnvelopeMassFraction01:
      number,

    readonly sourceIceBearingInteriorFraction01:
      number,

    readonly sourceReferenceMeanInsolationEarth:
      number,

    readonly surfaceRegime:
      PlanetSurfaceBaseRegime,

    readonly referenceBondAlbedo01:
      number,

    readonly baseMineralSurfaceFraction01:
      number,

    readonly baseVolatileBearingSurfaceFraction01:
      number,

    readonly baseMoltenSurfaceFraction01:
      number,

    readonly baseDeepEnvelopeSurfaceFraction01:
      number,

    readonly baseSolidSurfaceRoughness01:
      number | null,
  ) {
    if (
      !Number.isInteger(
        planetOrdinal,
      ) ||
      planetOrdinal <=
        0
    ) {
      throw new RangeError(
        'planetOrdinal must be a positive integer.',
      );
    }

    if (
      bodyLocator.bodyIndex !==
      BigInt(
        planetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'Point-19.6 surface base must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetSurfaceBaseProperties requires a BodySeed.',
      );
    }

    if (
      !Object.values(
        PlanetType,
      ).includes(
        sourcePlanetType,
      )
    ) {
      throw new RangeError(
        'sourcePlanetType must be a known PlanetType.',
      );
    }

    assertNormalized(
      sourceEnvelopeMassFraction01,
      'sourceEnvelopeMassFraction01',
    );

    assertNormalized(
      sourceIceBearingInteriorFraction01,
      'sourceIceBearingInteriorFraction01',
    );

    assertPositiveFinite(
      sourceReferenceMeanInsolationEarth,
      'sourceReferenceMeanInsolationEarth',
    );

    if (
      !Object.values(
        PlanetSurfaceBaseRegime,
      ).includes(
        surfaceRegime,
      )
    ) {
      throw new RangeError(
        'surfaceRegime must be a known PlanetSurfaceBaseRegime.',
      );
    }

    assertNormalized(
      referenceBondAlbedo01,
      'referenceBondAlbedo01',
    );

    const surfaceFractions = [
      baseMineralSurfaceFraction01,
      baseVolatileBearingSurfaceFraction01,
      baseMoltenSurfaceFraction01,
      baseDeepEnvelopeSurfaceFraction01,
    ];

    for (
      const fraction
      of surfaceFractions
    ) {
      assertNormalized(
        fraction,
        'base surface fraction',
      );
    }

    if (
      !approximatelyEqual(
        sum(
          surfaceFractions,
        ),
        1,
      )
    ) {
      throw new RangeError(
        'Point-19.6 base surface fractions must sum to 1.',
      );
    }

    assertTypeRegimeCompatibility(
      sourcePlanetType,
      surfaceRegime,
    );

    if (
      isDeepEnvelopeRegime(
        surfaceRegime,
      )
    ) {
      if (
        !approximatelyEqual(
          baseDeepEnvelopeSurfaceFraction01,
          1,
        ) ||
        baseSolidSurfaceRoughness01 !==
          null
      ) {
        throw new RangeError(
          'Deep-envelope point-19.6 worlds require a full deep-envelope surface fraction and no solid-surface roughness.',
        );
      }
    } else {
      if (
        !approximatelyEqual(
          baseDeepEnvelopeSurfaceFraction01,
          0,
        ) ||
        baseSolidSurfaceRoughness01 ===
          null
      ) {
        throw new RangeError(
          'Solid point-19.6 worlds cannot carry a deep-envelope surface fraction and require a solid-surface roughness.',
        );
      }

      assertNormalized(
        baseSolidSurfaceRoughness01,
        'baseSolidSurfaceRoughness01',
      );
    }
  }

  get hasDefinedSolidSurfaceBase():
    boolean {

    return !isDeepEnvelopeRegime(
      this.surfaceRegime,
    );
  }

  get isDeepEnvelopeSurface():
    boolean {

    return isDeepEnvelopeRegime(
      this.surfaceRegime,
    );
  }
}

function assertTypeRegimeCompatibility(
  planetType:
    PlanetType,

  surfaceRegime:
    PlanetSurfaceBaseRegime,
): void {

  const expectedRegime =
    expectedSurfaceRegime(
      planetType,
    );

  if (
    surfaceRegime !==
    expectedRegime
  ) {
    throw new RangeError(
      `Point-19.6 surface regime ${surfaceRegime} is incompatible with source planet type ${planetType}; expected ${expectedRegime}.`,
    );
  }
}

function expectedSurfaceRegime(
  planetType:
    PlanetType,
): PlanetSurfaceBaseRegime {

  switch (
    planetType
  ) {
    case PlanetType.ROCKY:
      return PlanetSurfaceBaseRegime.MINERAL_REGOLITH;

    case PlanetType.SUPER_EARTH:
      return PlanetSurfaceBaseRegime.MASSIVE_MINERAL_REGOLITH;

    case PlanetType.DESERT:
      return PlanetSurfaceBaseRegime.ARID_MINERAL;

    case PlanetType.OCEAN:
      return PlanetSurfaceBaseRegime.VOLATILE_RICH_SOLID;

    case PlanetType.ICE:
      return PlanetSurfaceBaseRegime.FROZEN_VOLATILE;

    case PlanetType.VOLCANIC:
      return PlanetSurfaceBaseRegime.THERMALLY_REWORKED_MINERAL;

    case PlanetType.MINI_NEPTUNE:
    case PlanetType.GAS_GIANT:
      return PlanetSurfaceBaseRegime.DEEP_ENVELOPE;

    case PlanetType.ICE_GIANT:
      return PlanetSurfaceBaseRegime.ICE_RICH_DEEP_ENVELOPE;
  }
}

function isDeepEnvelopeRegime(
  surfaceRegime:
    PlanetSurfaceBaseRegime,
): boolean {

  return (
    surfaceRegime ===
      PlanetSurfaceBaseRegime.DEEP_ENVELOPE ||
    surfaceRegime ===
      PlanetSurfaceBaseRegime.ICE_RICH_DEEP_ENVELOPE
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
      `${propertyName} must be finite and in range [0, 1]: ${value}.`,
    );
  }
}

function sum(
  values:
    readonly number[],
): number {

  return values.reduce(
    (
      total,
      value,
    ) =>
      total +
      value,
    0,
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
    CONSISTENCY_TOLERANCE *
      scale
  );
}
