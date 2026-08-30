import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  AtmosphereGreenhouseRegime,
} from './atmosphere-greenhouse-regime';

export const PLANET_CLIMATE_V1_ZERO_ALBEDO_EARTH_EQUILIBRIUM_TEMPERATURE_KELVIN =
  278.33;

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-20.5 global-mean thermal climate baseline for one mature Planet.
 *
 * equilibriumTemperatureKelvin is the full-redistribution effective radiative
 * equilibrium temperature implied by the frozen phase-19 Bond-albedo prior and
 * reference mean stellar insolation. meanSurfaceTemperatureKelvin is a coarse
 * globally averaged solid-surface temperature after applying the point-20.4
 * retained-atmosphere greenhouse amplification. It is null for deep-envelope
 * worlds because phase 19 defines no solid surface there.
 *
 * This contract deliberately contains no seasons, latitudinal/day-night
 * extremes, climate variability or stability judgement; point 20.6 owns those
 * refinements.
 */
export class PlanetClimateState {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourceReferenceMeanInsolationEarth:
      number,

    readonly sourceReferenceBondAlbedo01:
      number,

    readonly sourceGreenhouseRegime:
      AtmosphereGreenhouseRegime,

    readonly sourceInfraredOpticalDepthProxy:
      number,

    readonly sourceGreenhouseTemperatureAmplificationFactor:
      number | null,

    readonly absorbedStellarFluxFactor:
      number,

    readonly equilibriumTemperatureKelvin:
      number,

    readonly meanSurfaceTemperatureKelvin:
      number | null,

    readonly greenhouseSurfaceWarmingKelvin:
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
        'Point-20.5 climate state must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetClimateState requires a BodySeed.',
      );
    }

    assertPositiveFinite(
      sourceReferenceMeanInsolationEarth,
      'sourceReferenceMeanInsolationEarth',
    );

    assertBondAlbedo(
      sourceReferenceBondAlbedo01,
    );

    if (
      !Object.values(
        AtmosphereGreenhouseRegime,
      ).includes(
        sourceGreenhouseRegime,
      )
    ) {
      throw new RangeError(
        'sourceGreenhouseRegime must be a known AtmosphereGreenhouseRegime.',
      );
    }

    assertNonNegativeFinite(
      sourceInfraredOpticalDepthProxy,
      'sourceInfraredOpticalDepthProxy',
    );

    const isDeepEnvelope =
      sourceGreenhouseRegime ===
        AtmosphereGreenhouseRegime.DEEP_ENVELOPE;

    if (
      isDeepEnvelope
    ) {
      if (
        sourceGreenhouseTemperatureAmplificationFactor !==
          null ||
        meanSurfaceTemperatureKelvin !==
          null ||
        greenhouseSurfaceWarmingKelvin !==
          null
      ) {
        throw new RangeError(
          'Point-20.5 deep-envelope worlds require null greenhouse amplification, solid-surface temperature and surface warming.',
        );
      }
    } else {
      assertAtLeastOneFinite(
        sourceGreenhouseTemperatureAmplificationFactor,
        'sourceGreenhouseTemperatureAmplificationFactor',
      );

      assertPositiveFinite(
        meanSurfaceTemperatureKelvin,
        'meanSurfaceTemperatureKelvin',
      );

      assertNonNegativeFinite(
        greenhouseSurfaceWarmingKelvin,
        'greenhouseSurfaceWarmingKelvin',
      );
    }

    const expectedAbsorbedStellarFluxFactor =
      sourceReferenceMeanInsolationEarth *
      (
        1 -
        sourceReferenceBondAlbedo01
      );

    if (
      !approximatelyEqual(
        absorbedStellarFluxFactor,
        expectedAbsorbedStellarFluxFactor,
      )
    ) {
      throw new RangeError(
        'absorbedStellarFluxFactor must equal referenceMeanInsolationEarth * (1 - Bond albedo).',
      );
    }

    assertPositiveFinite(
      equilibriumTemperatureKelvin,
      'equilibriumTemperatureKelvin',
    );

    const expectedEquilibriumTemperatureKelvin =
      planetaryEquilibriumTemperatureKelvin(
        sourceReferenceMeanInsolationEarth,
        sourceReferenceBondAlbedo01,
      );

    if (
      !approximatelyEqual(
        equilibriumTemperatureKelvin,
        expectedEquilibriumTemperatureKelvin,
      )
    ) {
      throw new RangeError(
        'equilibriumTemperatureKelvin must match the frozen V1 insolation/albedo equilibrium relation.',
      );
    }

    if (
      !isDeepEnvelope
    ) {
      const amplification =
        sourceGreenhouseTemperatureAmplificationFactor!;

      const expectedSurfaceTemperatureKelvin =
        equilibriumTemperatureKelvin *
        amplification;

      if (
        !approximatelyEqual(
          meanSurfaceTemperatureKelvin!,
          expectedSurfaceTemperatureKelvin,
        )
      ) {
        throw new RangeError(
          'meanSurfaceTemperatureKelvin must equal equilibriumTemperatureKelvin times the point-20.4 greenhouse amplification.',
        );
      }

      if (
        !approximatelyEqual(
          greenhouseSurfaceWarmingKelvin!,
          meanSurfaceTemperatureKelvin! -
            equilibriumTemperatureKelvin,
        )
      ) {
        throw new RangeError(
          'greenhouseSurfaceWarmingKelvin must equal mean surface minus equilibrium temperature.',
        );
      }
    }
  }

  get hasDefinedSolidSurfaceTemperature():
    boolean {

    return this
      .meanSurfaceTemperatureKelvin !==
      null;
  }

  get isDeepEnvelopeThermalState():
    boolean {

    return this
      .sourceGreenhouseRegime ===
      AtmosphereGreenhouseRegime.DEEP_ENVELOPE;
  }
}

export function planetaryEquilibriumTemperatureKelvin(
  referenceMeanInsolationEarth:
    number,

  referenceBondAlbedo01:
    number,
): number {

  assertPositiveFinite(
    referenceMeanInsolationEarth,
    'referenceMeanInsolationEarth',
  );

  assertBondAlbedo(
    referenceBondAlbedo01,
  );

  return PLANET_CLIMATE_V1_ZERO_ALBEDO_EARTH_EQUILIBRIUM_TEMPERATURE_KELVIN *
    Math.pow(
      referenceMeanInsolationEarth *
        (
          1 -
          referenceBondAlbedo01
        ),
      0.25,
    );
}

function assertBondAlbedo(
  value:
    number,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >=
      1
  ) {
    throw new RangeError(
      `sourceReferenceBondAlbedo01 must be finite and in [0, 1): ${value}.`,
    );
  }
}

function assertPositiveFinite(
  value:
    number | null,

  propertyName:
    string,
): asserts value is number {

  if (
    value ===
      null ||
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

function assertAtLeastOneFinite(
  value:
    number | null,

  propertyName:
    string,
): asserts value is number {

  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    ) ||
    value <
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and at least 1: ${value}.`,
    );
  }
}

function assertNonNegativeFinite(
  value:
    number | null,

  propertyName:
    string,
): asserts value is number {

  if (
    value ===
      null ||
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

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {

  return Math.abs(
    left -
      right,
  ) <=
    CONSISTENCY_TOLERANCE *
      Math.max(
        1,
        Math.abs(left),
        Math.abs(right),
      );
}
