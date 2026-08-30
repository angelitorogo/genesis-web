import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetGeologyRegime,
  planetGeologyRegimeForActivityIndex01,
} from './planet-geology-regime';

import {
  PlanetTectonicRegime,
  planetTectonicRegimeForMobilityIndex01,
} from './planet-tectonic-regime';

import {
  PlanetType,
} from './planet-type';

import {
  PlanetVolcanismRegime,
  planetVolcanismRegimeForIndex01,
} from './planet-volcanism-regime';

/**
 * Point-20.8 deterministic approximate geology state for one mature Planet.
 *
 * The normalized indices are comparative V1 proxies. They do not claim mantle
 * temperatures, crust thickness, plate counts, eruption rates or absolute heat
 * fluxes. The source values are retained so the result remains auditable.
 */
export class PlanetGeologyState {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourcePlanetType:
      PlanetType,

    readonly sourceMassEarth:
      number,

    readonly sourceRadiusEarth:
      number,

    readonly sourceSurfaceGravityEarth:
      number,

    readonly sourceMetallicCoreMassFraction01:
      number,

    readonly sourceSilicateInteriorMassFraction01:
      number,

    readonly sourceVolatileRichInteriorMassFraction01:
      number,

    readonly sourceCondensedIceMassFraction01:
      number,

    readonly sourceIceBearingInteriorFraction01:
      number,

    readonly sourceTidalHeatingProxy:
      number,

    readonly sourceWaterInventoryIndex01:
      number,

    readonly sourceSurfaceLiquidWaterCoverageFraction01:
      number | null,

    readonly internalHeatRetentionIndex01:
      number | null,

    readonly tidalHeatingIndex01:
      number | null,

    readonly mantleConvectionIndex01:
      number | null,

    readonly geologicalActivityIndex01:
      number | null,

    readonly volcanismIndex01:
      number | null,

    readonly tectonicMobilityIndex01:
      number | null,

    readonly volatileOutgassingPotential01:
      number | null,

    readonly surfaceRenewalPotential01:
      number | null,

    readonly geologyRegime:
      PlanetGeologyRegime,

    readonly volcanismRegime:
      PlanetVolcanismRegime,

    readonly tectonicRegime:
      PlanetTectonicRegime,
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
        'Point-20.8 geology must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetGeologyState requires a BodySeed.',
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

    assertPositiveFinite(
      sourceMassEarth,
      'sourceMassEarth',
    );

    assertPositiveFinite(
      sourceRadiusEarth,
      'sourceRadiusEarth',
    );

    assertPositiveFinite(
      sourceSurfaceGravityEarth,
      'sourceSurfaceGravityEarth',
    );

    assertNormalized(
      sourceMetallicCoreMassFraction01,
      'sourceMetallicCoreMassFraction01',
    );

    assertNormalized(
      sourceSilicateInteriorMassFraction01,
      'sourceSilicateInteriorMassFraction01',
    );

    assertNormalized(
      sourceVolatileRichInteriorMassFraction01,
      'sourceVolatileRichInteriorMassFraction01',
    );

    assertNormalized(
      sourceCondensedIceMassFraction01,
      'sourceCondensedIceMassFraction01',
    );

    assertNormalized(
      sourceIceBearingInteriorFraction01,
      'sourceIceBearingInteriorFraction01',
    );

    assertNonNegativeFinite(
      sourceTidalHeatingProxy,
      'sourceTidalHeatingProxy',
    );

    assertNormalized(
      sourceWaterInventoryIndex01,
      'sourceWaterInventoryIndex01',
    );

    if (
      sourceSurfaceLiquidWaterCoverageFraction01 !==
      null
    ) {
      assertNormalized(
        sourceSurfaceLiquidWaterCoverageFraction01,
        'sourceSurfaceLiquidWaterCoverageFraction01',
      );
    }

    const isDeepEnvelope =
      sourceSurfaceLiquidWaterCoverageFraction01 ===
      null;

    if (
      isDeepEnvelope
    ) {
      if (
        internalHeatRetentionIndex01 !==
          null ||
        tidalHeatingIndex01 !==
          null ||
        mantleConvectionIndex01 !==
          null ||
        geologicalActivityIndex01 !==
          null ||
        volcanismIndex01 !==
          null ||
        tectonicMobilityIndex01 !==
          null ||
        volatileOutgassingPotential01 !==
          null ||
        surfaceRenewalPotential01 !==
          null ||
        geologyRegime !==
          PlanetGeologyRegime.DEEP_ENVELOPE ||
        volcanismRegime !==
          PlanetVolcanismRegime.DEEP_ENVELOPE ||
        tectonicRegime !==
          PlanetTectonicRegime.DEEP_ENVELOPE
      ) {
        throw new RangeError(
          'Point-20.8 deep-envelope geology requires null solid-surface indices and DEEP_ENVELOPE regimes.',
        );
      }

      return;
    }

    for (
      const [
        propertyName,
        value,
      ]
      of [
        [
          'internalHeatRetentionIndex01',
          internalHeatRetentionIndex01,
        ],
        [
          'tidalHeatingIndex01',
          tidalHeatingIndex01,
        ],
        [
          'mantleConvectionIndex01',
          mantleConvectionIndex01,
        ],
        [
          'geologicalActivityIndex01',
          geologicalActivityIndex01,
        ],
        [
          'volcanismIndex01',
          volcanismIndex01,
        ],
        [
          'tectonicMobilityIndex01',
          tectonicMobilityIndex01,
        ],
        [
          'volatileOutgassingPotential01',
          volatileOutgassingPotential01,
        ],
        [
          'surfaceRenewalPotential01',
          surfaceRenewalPotential01,
        ],
      ] as const
    ) {
      if (
        value ===
        null
      ) {
        throw new RangeError(
          `${propertyName} must be defined for a solid-surface point-20.8 geology state.`,
        );
      }

      assertNormalized(
        value,
        propertyName,
      );
    }

    if (
      geologyRegime !==
      planetGeologyRegimeForActivityIndex01(
        geologicalActivityIndex01!,
      )
    ) {
      throw new RangeError(
        'geologyRegime must match the point-20.8 geological-activity thresholds.',
      );
    }

    if (
      volcanismRegime !==
      planetVolcanismRegimeForIndex01(
        volcanismIndex01!,
      )
    ) {
      throw new RangeError(
        'volcanismRegime must match the point-20.8 volcanism thresholds.',
      );
    }

    if (
      tectonicRegime !==
      planetTectonicRegimeForMobilityIndex01(
        tectonicMobilityIndex01!,
      )
    ) {
      throw new RangeError(
        'tectonicRegime must match the point-20.8 mobility thresholds.',
      );
    }
  }

  get hasDefinedSolidSurfaceGeology():
    boolean {

    return this
      .geologicalActivityIndex01 !==
      null;
  }

  get isGeologicallyActive():
    boolean {

    return (
      this.geologicalActivityIndex01 !==
        null &&
      this.geologicalActivityIndex01 >=
        0.25
    );
  }

  get hasActiveVolcanism():
    boolean {

    return (
      this.volcanismRegime ===
        PlanetVolcanismRegime.MODERATE ||
      this.volcanismRegime ===
        PlanetVolcanismRegime.HIGH ||
      this.volcanismRegime ===
        PlanetVolcanismRegime.EXTREME
    );
  }

  get supportsMobileLithosphere():
    boolean {

    return (
      this.tectonicRegime ===
        PlanetTectonicRegime.MOBILE_LID ||
      this.tectonicRegime ===
        PlanetTectonicRegime.PLATE_TECTONICS
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

function assertNonNegativeFinite(
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
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and non-negative: ${value}.`,
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
