import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type AtmosphereRetentionState,
} from '../../domain/planetary/atmosphere-retention-state';

import {
  type PlanetMagnetosphereState,
} from '../../domain/planetary/planet-magnetosphere-state';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  planetRadiationProtectionRegimeForIndex01,
} from '../../domain/planetary/planet-radiation-protection-regime';

import {
  planetSurfaceRadiationRegimeForIndex01,
} from '../../domain/planetary/planet-surface-radiation-regime';

import {
  PlanetSurfaceRadiationState,
} from '../../domain/planetary/planet-surface-radiation-state';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

const CONSISTENCY_TOLERANCE =
  1e-9;

const EARTH_REFERENCE_SURFACE_PRESSURE_PASCAL =
  101_325;

const ATMOSPHERIC_COLUMN_HALF_SHIELDING_EARTH =
  0.25;

const ELECTROMAGNETIC_ATMOSPHERE_ATTENUATION_WEIGHT =
  0.55;

const PARTICLE_CHANNEL_WEIGHT =
  0.55;

const ELECTROMAGNETIC_CHANNEL_WEIGHT =
  0.45;

const EFFECTIVE_PROTECTION_THRESHOLD =
  0.55;

const EFFECTIVE_EXPOSURE_MAXIMUM =
  0.50;

/**
 * Point-20.10 deterministic approximate surface-radiation/protection engine.
 *
 * V1 consumes zero PRNG draws and derives zero new seeds. It combines only
 * already-frozen state:
 * - phase-19 surface gravity and reference mean insolation;
 * - point-20.3 retained surface pressure;
 * - point-20.9 stellar-wind proxy and magnetospheric protection.
 *
 * Atmospheric shielding is driven by pressure/gravity (a column-mass proxy),
 * while magnetic shielding applies only to the particle channel. The photon/
 * electromagnetic channel receives atmospheric attenuation only: V1 has no
 * ozone chemistry, wavelength spectrum or cloud radiative-transfer model.
 *
 * Outputs are normalized comparative indices, never dose in Gy/Sv or a medical
 * safety judgement. Deep-envelope worlds retain top-of-atmosphere environment
 * loads but receive no invented solid-surface exposure state.
 */
export class PlanetSurfaceRadiationEngine {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,

    retentionState:
      AtmosphereRetentionState,

    magnetosphereState:
      PlanetMagnetosphereState,
  ): PlanetSurfaceRadiationState {

    assertGenerationContext(
      generationKey,
      planet,
      retentionState,
      magnetosphereState,
    );

    return generateSurfaceRadiationV1(
      planet,
      retentionState,
      magnetosphereState,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    planets:
      readonly Planet[],

    retentionStates:
      readonly AtmosphereRetentionState[],

    magnetosphereStates:
      readonly PlanetMagnetosphereState[],
  ): readonly PlanetSurfaceRadiationState[] {

    assertSupportedGenerationKey(
      generationKey,
    );

    if (
      !generationKey.equals(
        planetarySystem.generationKey,
      )
    ) {
      throw new RangeError(
        'PlanetSurfaceRadiationEngine requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      planets.length !==
        planetarySystem.planetCount ||
      retentionStates.length !==
        planetarySystem.planetCount ||
      magnetosphereStates.length !==
        planetarySystem.planetCount
    ) {
      throw new RangeError(
        'PlanetSurfaceRadiationEngine.generateAll requires one Planet, point-20.3 retention state and point-20.9 magnetosphere state for every mature planet.',
      );
    }

    return Object.freeze(
      planets.map(
        (
          planet,
          index,
        ) => {
          if (
            planet.hostPlanetarySystem !==
              planetarySystem ||
            planet.planetOrdinal !==
              index +
                1
          ) {
            throw new RangeError(
              'PlanetSurfaceRadiationEngine.generateAll requires Planets from the exact supplied system in frozen planetOrdinal order.',
            );
          }

          const retentionState =
            retentionStates[index];

          const magnetosphereState =
            magnetosphereStates[index];

          assertGenerationContext(
            generationKey,
            planet,
            retentionState,
            magnetosphereState,
          );

          return generateSurfaceRadiationV1(
            planet,
            retentionState,
            magnetosphereState,
          );
        },
      ),
    );
  }
}

function generateSurfaceRadiationV1(
  planet:
    Planet,

  retentionState:
    AtmosphereRetentionState,

  magnetosphereState:
    PlanetMagnetosphereState,
): PlanetSurfaceRadiationState {

  const referenceMeanInsolationEarth =
    planet.typeClassification
      .referenceMeanInsolationEarth;

  const stellarElectromagneticRadiationLoadIndex01 =
    environmentLoadIndexV1(
      referenceMeanInsolationEarth,
    );

  const stellarParticleRadiationLoadIndex01 =
    Math.sqrt(
      environmentLoadIndexV1(
        magnetosphereState
          .stellarWindPressureProxyEarth,
      ),
    );

  const unshieldedRadiationEnvironmentIndex01 =
    clamp01(
      PARTICLE_CHANNEL_WEIGHT *
        stellarParticleRadiationLoadIndex01 +
      ELECTROMAGNETIC_CHANNEL_WEIGHT *
        stellarElectromagneticRadiationLoadIndex01,
    );

  const deepEnvelope =
    isDeepEnvelopeType(
      planet.planetType,
    );

  if (
    deepEnvelope
  ) {
    return new PlanetSurfaceRadiationState(
      planet.planetOrdinal,
      planet.locator,
      planet.seed,
      planet.planetType,
      planet.surfaceGravityEarth,
      referenceMeanInsolationEarth,
      null,
      magnetosphereState.stellarWindPressureProxyEarth,
      magnetosphereState.magnetosphericProtectionIndex01,
      magnetosphereState.magneticFieldRegime,
      magnetosphereState.magnetosphereRegime,
      stellarElectromagneticRadiationLoadIndex01,
      stellarParticleRadiationLoadIndex01,
      unshieldedRadiationEnvironmentIndex01,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      planetSurfaceRadiationRegimeForIndex01(null),
      planetRadiationProtectionRegimeForIndex01(null),
      false,
    );
  }

  const retainedSurfacePressurePascal =
    retentionState
      .retainedSurfacePressurePascal;

  if (
    retainedSurfacePressurePascal ===
    null
  ) {
    throw new RangeError(
      'Solid-surface point-20.10 worlds require a point-20.3 retained surface pressure.',
    );
  }

  const atmosphericColumnMassEarth =
    retainedSurfacePressurePascal /
    EARTH_REFERENCE_SURFACE_PRESSURE_PASCAL /
    planet.surfaceGravityEarth;

  const atmosphericRadiationShieldingIndex01 =
    atmosphericShieldingIndexV1(
      atmosphericColumnMassEarth,
    );

  const magneticRadiationShieldingIndex01 =
    magnetosphereState
      .magnetosphericProtectionIndex01;

  const particleRadiationProtectionIndex01 =
    combinedIndependentProtectionV1(
      atmosphericRadiationShieldingIndex01,
      magneticRadiationShieldingIndex01,
    );

  const electromagneticRadiationProtectionIndex01 =
    clamp01(
      ELECTROMAGNETIC_ATMOSPHERE_ATTENUATION_WEIGHT *
      atmosphericRadiationShieldingIndex01,
    );

  const surfaceRadiationProtectionIndex01 =
    clamp01(
      PARTICLE_CHANNEL_WEIGHT *
        particleRadiationProtectionIndex01 +
      ELECTROMAGNETIC_CHANNEL_WEIGHT *
        electromagneticRadiationProtectionIndex01,
    );

  const surfaceParticleRadiationExposureIndex01 =
    clamp01(
      stellarParticleRadiationLoadIndex01 *
      (
        1 -
        particleRadiationProtectionIndex01
      ),
    );

  const surfaceElectromagneticRadiationExposureIndex01 =
    clamp01(
      stellarElectromagneticRadiationLoadIndex01 *
      (
        1 -
        electromagneticRadiationProtectionIndex01
      ),
    );

  const surfaceRadiationExposureIndex01 =
    clamp01(
      PARTICLE_CHANNEL_WEIGHT *
        surfaceParticleRadiationExposureIndex01 +
      ELECTROMAGNETIC_CHANNEL_WEIGHT *
        surfaceElectromagneticRadiationExposureIndex01,
    );

  const hasEffectiveSurfaceRadiationProtection =
    surfaceRadiationProtectionIndex01 >=
      EFFECTIVE_PROTECTION_THRESHOLD &&
    surfaceRadiationExposureIndex01 <
      EFFECTIVE_EXPOSURE_MAXIMUM;

  return new PlanetSurfaceRadiationState(
    planet.planetOrdinal,
    planet.locator,
    planet.seed,
    planet.planetType,
    planet.surfaceGravityEarth,
    referenceMeanInsolationEarth,
    retainedSurfacePressurePascal,
    magnetosphereState.stellarWindPressureProxyEarth,
    magnetosphereState.magnetosphericProtectionIndex01,
    magnetosphereState.magneticFieldRegime,
    magnetosphereState.magnetosphereRegime,
    stellarElectromagneticRadiationLoadIndex01,
    stellarParticleRadiationLoadIndex01,
    unshieldedRadiationEnvironmentIndex01,
    atmosphericColumnMassEarth,
    atmosphericRadiationShieldingIndex01,
    magneticRadiationShieldingIndex01,
    particleRadiationProtectionIndex01,
    electromagneticRadiationProtectionIndex01,
    surfaceRadiationProtectionIndex01,
    surfaceParticleRadiationExposureIndex01,
    surfaceElectromagneticRadiationExposureIndex01,
    surfaceRadiationExposureIndex01,
    planetSurfaceRadiationRegimeForIndex01(
      surfaceRadiationExposureIndex01,
    ),
    planetRadiationProtectionRegimeForIndex01(
      surfaceRadiationProtectionIndex01,
    ),
    hasEffectiveSurfaceRadiationProtection,
  );
}

function environmentLoadIndexV1(
  relativeEnvironmentEarth:
    number,
): number {

  return clamp01(
    relativeEnvironmentEarth /
    (
      1 +
      relativeEnvironmentEarth
    ),
  );
}

function atmosphericShieldingIndexV1(
  atmosphericColumnMassEarth:
    number,
): number {

  if (
    atmosphericColumnMassEarth <=
    0
  ) {
    return 0;
  }

  return clamp01(
    atmosphericColumnMassEarth /
    (
      atmosphericColumnMassEarth +
      ATMOSPHERIC_COLUMN_HALF_SHIELDING_EARTH
    ),
  );
}

function combinedIndependentProtectionV1(
  firstProtectionIndex01:
    number,

  secondProtectionIndex01:
    number,
): number {

  return clamp01(
    1 -
    (
      1 -
      firstProtectionIndex01
    ) *
    (
      1 -
      secondProtectionIndex01
    ),
  );
}

function assertGenerationContext(
  generationKey:
    UniverseGenerationKey,

  planet:
    Planet,

  retentionState:
    AtmosphereRetentionState,

  magnetosphereState:
    PlanetMagnetosphereState,
): void {

  assertSupportedGenerationKey(
    generationKey,
  );

  if (
    !generationKey.equals(
      planet.generationKey,
    )
  ) {
    throw new RangeError(
      'PlanetSurfaceRadiationEngine requires the Planet to share the supplied UniverseGenerationKey.',
    );
  }

  if (
    !planet.isTypePhysicallyCoherent
  ) {
    throw new RangeError(
      'PlanetSurfaceRadiationEngine requires a point-19.7 physically coherent Planet.',
    );
  }

  if (
    retentionState.planetOrdinal !==
      planet.planetOrdinal ||
    !sameBodyIdentity(
      planet,
      retentionState,
    ) ||
    !approximatelyEqual(
      retentionState.sourceReferenceMeanInsolationEarth,
      planet.typeClassification
        .referenceMeanInsolationEarth,
    )
  ) {
    throw new RangeError(
      'PlanetSurfaceRadiationEngine requires the exact point-20.3 retention state belonging to the supplied Planet.',
    );
  }

  if (
    magnetosphereState.planetOrdinal !==
      planet.planetOrdinal ||
    !sameBodyIdentity(
      planet,
      magnetosphereState,
    ) ||
    magnetosphereState.sourcePlanetType !==
      planet.planetType ||
    !approximatelyEqual(
      magnetosphereState.sourceReferenceMeanInsolationEarth,
      planet.typeClassification
        .referenceMeanInsolationEarth,
    ) ||
    magnetosphereState.sourceRetainedSurfacePressurePascal !==
      retentionState.retainedSurfacePressurePascal
  ) {
    throw new RangeError(
      'PlanetSurfaceRadiationEngine requires the exact point-20.9 magnetosphere state belonging to the supplied Planet and point-20.3 retention state.',
    );
  }

  const deepEnvelope =
    isDeepEnvelopeType(
      planet.planetType,
    );

  if (
    deepEnvelope !==
    (
      retentionState
        .retainedSurfacePressurePascal ===
      null
    )
  ) {
    throw new RangeError(
      'Point-20.10 deep-envelope surface semantics must match point-20.3 retained-pressure semantics.',
    );
  }
}

function assertSupportedGenerationKey(
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

function isDeepEnvelopeType(
  planetType:
    PlanetType,
): boolean {

  return planetType ===
    PlanetType.MINI_NEPTUNE ||
    planetType ===
      PlanetType.GAS_GIANT ||
    planetType ===
      PlanetType.ICE_GIANT;
}

function sameBodyIdentity(
  planet:
    Planet,

  source:
    AtmosphereRetentionState |
    PlanetMagnetosphereState,
): boolean {

  return (
    source.bodyLocator.galaxyIndex ===
      planet.locator.galaxyIndex &&
    source.bodyLocator.sectorKey ===
      planet.locator.sectorKey &&
    source.bodyLocator.galacticObjectIndex ===
      planet.locator.galacticObjectIndex &&
    source.bodyLocator.bodyIndex ===
      planet.locator.bodyIndex &&
    source.bodySeed.normalizedValue ===
      planet.seed.normalizedValue
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

  return Math.abs(
    left -
    right,
  ) <=
  CONSISTENCY_TOLERANCE *
    scale;
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
