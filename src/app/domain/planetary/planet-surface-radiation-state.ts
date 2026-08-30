import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  type PlanetMagneticFieldRegime,
} from './planet-magnetic-field-regime';

import {
  type PlanetMagnetosphereRegime,
} from './planet-magnetosphere-regime';

import {
  PlanetRadiationProtectionRegime,
  planetRadiationProtectionRegimeForIndex01,
} from './planet-radiation-protection-regime';

import {
  PlanetSurfaceRadiationRegime,
  planetSurfaceRadiationRegimeForIndex01,
} from './planet-surface-radiation-regime';

import {
  PlanetType,
} from './planet-type';

const EFFECTIVE_PROTECTION_THRESHOLD =
  0.55;

const EFFECTIVE_EXPOSURE_MAXIMUM =
  0.50;

/**
 * Point-20.10 deterministic surface-radiation / protection state.
 *
 * Every radiation/protection quantity is a normalized comparative V1 proxy.
 * No field is an absorbed/equivalent dose in gray/sievert, a wavelength-
 * resolved UV flux, a cosmic-ray spectrum or a magnetopause measurement.
 *
 * For MINI_NEPTUNE/GAS_GIANT/ICE_GIANT, stellar environmental loads remain
 * meaningful but every solid-surface-specific output is null and both regimes
 * are DEEP_ENVELOPE: V1 does not invent a solid surface below a deep envelope.
 */
export class PlanetSurfaceRadiationState {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourcePlanetType:
      PlanetType,

    readonly sourceSurfaceGravityEarth:
      number,

    readonly sourceReferenceMeanInsolationEarth:
      number,

    readonly sourceRetainedSurfacePressurePascal:
      number | null,

    readonly sourceStellarWindPressureProxyEarth:
      number,

    readonly sourceMagnetosphericProtectionIndex01:
      number,

    readonly sourceMagneticFieldRegime:
      PlanetMagneticFieldRegime,

    readonly sourceMagnetosphereRegime:
      PlanetMagnetosphereRegime,

    readonly stellarElectromagneticRadiationLoadIndex01:
      number,

    readonly stellarParticleRadiationLoadIndex01:
      number,

    readonly unshieldedRadiationEnvironmentIndex01:
      number,

    readonly atmosphericColumnMassEarth:
      number | null,

    readonly atmosphericRadiationShieldingIndex01:
      number | null,

    readonly magneticRadiationShieldingIndex01:
      number | null,

    readonly particleRadiationProtectionIndex01:
      number | null,

    readonly electromagneticRadiationProtectionIndex01:
      number | null,

    readonly surfaceRadiationProtectionIndex01:
      number | null,

    readonly surfaceParticleRadiationExposureIndex01:
      number | null,

    readonly surfaceElectromagneticRadiationExposureIndex01:
      number | null,

    readonly surfaceRadiationExposureIndex01:
      number | null,

    readonly radiationRegime:
      PlanetSurfaceRadiationRegime,

    readonly protectionRegime:
      PlanetRadiationProtectionRegime,

    readonly hasEffectiveSurfaceRadiationProtection:
      boolean,
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
        'Point-20.10 surface radiation must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetSurfaceRadiationState requires a BodySeed.',
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
      sourceSurfaceGravityEarth,
      'sourceSurfaceGravityEarth',
    );

    assertPositiveFinite(
      sourceReferenceMeanInsolationEarth,
      'sourceReferenceMeanInsolationEarth',
    );

    if (
      sourceRetainedSurfacePressurePascal !==
      null
    ) {
      assertNonNegativeFinite(
        sourceRetainedSurfacePressurePascal,
        'sourceRetainedSurfacePressurePascal',
      );
    }

    if (
      !Number.isFinite(
        sourceStellarWindPressureProxyEarth,
      ) ||
      sourceStellarWindPressureProxyEarth <
        0.01 ||
      sourceStellarWindPressureProxyEarth >
        100
    ) {
      throw new RangeError(
        'sourceStellarWindPressureProxyEarth must be finite and in [0.01, 100].',
      );
    }

    assertNormalized(
      sourceMagnetosphericProtectionIndex01,
      'sourceMagnetosphericProtectionIndex01',
    );

    for (
      const [
        propertyName,
        value,
      ]
      of [
        [
          'stellarElectromagneticRadiationLoadIndex01',
          stellarElectromagneticRadiationLoadIndex01,
        ],
        [
          'stellarParticleRadiationLoadIndex01',
          stellarParticleRadiationLoadIndex01,
        ],
        [
          'unshieldedRadiationEnvironmentIndex01',
          unshieldedRadiationEnvironmentIndex01,
        ],
      ] as const
    ) {
      assertNormalized(
        value,
        propertyName,
      );
    }

    const deepEnvelope =
      sourcePlanetType ===
        PlanetType.MINI_NEPTUNE ||
      sourcePlanetType ===
        PlanetType.GAS_GIANT ||
      sourcePlanetType ===
        PlanetType.ICE_GIANT;

    const surfaceValues = [
      atmosphericRadiationShieldingIndex01,
      magneticRadiationShieldingIndex01,
      particleRadiationProtectionIndex01,
      electromagneticRadiationProtectionIndex01,
      surfaceRadiationProtectionIndex01,
      surfaceParticleRadiationExposureIndex01,
      surfaceElectromagneticRadiationExposureIndex01,
      surfaceRadiationExposureIndex01,
    ] as const;

    if (
      deepEnvelope
    ) {
      if (
        sourceRetainedSurfacePressurePascal !==
          null ||
        atmosphericColumnMassEarth !==
          null ||
        surfaceValues.some(
          value =>
            value !==
            null,
        ) ||
        radiationRegime !==
          PlanetSurfaceRadiationRegime.DEEP_ENVELOPE ||
        protectionRegime !==
          PlanetRadiationProtectionRegime.DEEP_ENVELOPE ||
        hasEffectiveSurfaceRadiationProtection
      ) {
        throw new RangeError(
          'Deep-envelope point-20.10 worlds cannot expose a modeled solid-surface radiation/protection state.',
        );
      }

      return;
    }

    if (
      sourceRetainedSurfacePressurePascal ===
        null ||
      atmosphericColumnMassEarth ===
        null
    ) {
      throw new RangeError(
        'Solid-surface point-20.10 worlds require retained surface pressure and atmospheric column mass.',
      );
    }

    assertNonNegativeFinite(
      atmosphericColumnMassEarth,
      'atmosphericColumnMassEarth',
    );

    for (
      const [
        propertyName,
        value,
      ]
      of [
        [
          'atmosphericRadiationShieldingIndex01',
          atmosphericRadiationShieldingIndex01,
        ],
        [
          'magneticRadiationShieldingIndex01',
          magneticRadiationShieldingIndex01,
        ],
        [
          'particleRadiationProtectionIndex01',
          particleRadiationProtectionIndex01,
        ],
        [
          'electromagneticRadiationProtectionIndex01',
          electromagneticRadiationProtectionIndex01,
        ],
        [
          'surfaceRadiationProtectionIndex01',
          surfaceRadiationProtectionIndex01,
        ],
        [
          'surfaceParticleRadiationExposureIndex01',
          surfaceParticleRadiationExposureIndex01,
        ],
        [
          'surfaceElectromagneticRadiationExposureIndex01',
          surfaceElectromagneticRadiationExposureIndex01,
        ],
        [
          'surfaceRadiationExposureIndex01',
          surfaceRadiationExposureIndex01,
        ],
      ] as const
    ) {
      if (
        value ===
        null
      ) {
        throw new RangeError(
          `${propertyName} must be defined for solid-surface point-20.10 worlds.`,
        );
      }

      assertNormalized(
        value,
        propertyName,
      );
    }

    if (
      surfaceRadiationProtectionIndex01 ===
        null ||
      surfaceRadiationExposureIndex01 ===
        null ||
      magneticRadiationShieldingIndex01 ===
        null
    ) {
      throw new RangeError(
        'Solid-surface point-20.10 protection/exposure indices cannot be null.',
      );
    }

    if (
      magneticRadiationShieldingIndex01 !==
      sourceMagnetosphericProtectionIndex01
    ) {
      throw new RangeError(
        'magneticRadiationShieldingIndex01 must preserve the exact point-20.9 magnetospheric protection index.',
      );
    }

    if (
      radiationRegime !==
      planetSurfaceRadiationRegimeForIndex01(
        surfaceRadiationExposureIndex01,
      )
    ) {
      throw new RangeError(
        'radiationRegime must match surfaceRadiationExposureIndex01.',
      );
    }

    if (
      protectionRegime !==
      planetRadiationProtectionRegimeForIndex01(
        surfaceRadiationProtectionIndex01,
      )
    ) {
      throw new RangeError(
        'protectionRegime must match surfaceRadiationProtectionIndex01.',
      );
    }

    const expectedEffectiveProtection =
      surfaceRadiationProtectionIndex01 >=
        EFFECTIVE_PROTECTION_THRESHOLD &&
      surfaceRadiationExposureIndex01 <
        EFFECTIVE_EXPOSURE_MAXIMUM;

    if (
      hasEffectiveSurfaceRadiationProtection !==
      expectedEffectiveProtection
    ) {
      throw new RangeError(
        'hasEffectiveSurfaceRadiationProtection must match the frozen point-20.10 protection/exposure thresholds.',
      );
    }
  }

  get hasModeledSolidSurface():
    boolean {

    return this
      .radiationRegime !==
      PlanetSurfaceRadiationRegime
        .DEEP_ENVELOPE;
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
