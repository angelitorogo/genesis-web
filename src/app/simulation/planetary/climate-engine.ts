import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type AtmosphereGreenhouseEffect,
} from '../../domain/planetary/atmosphere-greenhouse-effect';

import {
  AtmosphereGreenhouseRegime,
} from '../../domain/planetary/atmosphere-greenhouse-regime';

import {
  PlanetClimateState,
  planetaryEquilibriumTemperatureKelvin,
} from '../../domain/planetary/planet-climate-state';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-20.5 deterministic global-mean climate thermal engine.
 *
 * V1 consumes zero PRNG draws and derives zero new seeds. It computes an
 * effective radiative equilibrium temperature from the frozen phase-19 Bond
 * albedo and reference stellar insolation, then applies the dimensionless
 * point-20.4 greenhouse temperature amplification for solid-surface worlds.
 *
 * Deep-envelope planets still receive an equilibrium temperature at the top of
 * the atmosphere, but no solid-surface temperature is invented. Seasons,
 * day/night/latitudinal extremes and climate stability remain point 20.6.
 */
export class ClimateEngine {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,

    greenhouseEffect:
      AtmosphereGreenhouseEffect,
  ): PlanetClimateState {

    assertGenerationContext(
      generationKey,
      planet,
      greenhouseEffect,
    );

    return generateClimateV1(
      planet,
      greenhouseEffect,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    planets:
      readonly Planet[],

    greenhouseEffects:
      readonly AtmosphereGreenhouseEffect[],
  ): readonly PlanetClimateState[] {

    if (
      !generationKey.equals(
        planetarySystem.generationKey,
      )
    ) {
      throw new RangeError(
        'ClimateEngine requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      planets.length !==
        planetarySystem.planetCount ||
      greenhouseEffects.length !==
        planetarySystem.planetCount
    ) {
      throw new RangeError(
        'ClimateEngine.generateAll requires one Planet and one point-20.4 greenhouse state for every mature planet.',
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
              'ClimateEngine.generateAll requires Planets from the exact supplied system in frozen planetOrdinal order.',
            );
          }

          const greenhouseEffect =
            greenhouseEffects[index];

          assertGenerationContext(
            generationKey,
            planet,
            greenhouseEffect,
          );

          return generateClimateV1(
            planet,
            greenhouseEffect,
          );
        },
      ),
    );
  }
}

function generateClimateV1(
  planet:
    Planet,

  greenhouseEffect:
    AtmosphereGreenhouseEffect,
): PlanetClimateState {

  const referenceMeanInsolationEarth =
    greenhouseEffect
      .sourceReferenceMeanInsolationEarth;

  const referenceBondAlbedo01 =
    greenhouseEffect
      .sourceReferenceBondAlbedo01;

  const absorbedStellarFluxFactor =
    referenceMeanInsolationEarth *
    (
      1 -
      referenceBondAlbedo01
    );

  const equilibriumTemperatureKelvin =
    planetaryEquilibriumTemperatureKelvin(
      referenceMeanInsolationEarth,
      referenceBondAlbedo01,
    );

  const isDeepEnvelope =
    greenhouseEffect.regime ===
      AtmosphereGreenhouseRegime.DEEP_ENVELOPE;

  const meanSurfaceTemperatureKelvin =
    isDeepEnvelope
      ? null
      : equilibriumTemperatureKelvin *
        greenhouseEffect
          .temperatureAmplificationFactor!;

  const greenhouseSurfaceWarmingKelvin =
    meanSurfaceTemperatureKelvin ===
      null
      ? null
      : Math.max(
          0,
          meanSurfaceTemperatureKelvin -
            equilibriumTemperatureKelvin,
        );

  return new PlanetClimateState(
    planet.planetOrdinal,
    planet.locator,
    planet.seed,
    referenceMeanInsolationEarth,
    referenceBondAlbedo01,
    greenhouseEffect.regime,
    greenhouseEffect.infraredOpticalDepthProxy,
    greenhouseEffect.temperatureAmplificationFactor,
    absorbedStellarFluxFactor,
    equilibriumTemperatureKelvin,
    meanSurfaceTemperatureKelvin,
    greenhouseSurfaceWarmingKelvin,
  );
}

function assertGenerationContext(
  generationKey:
    UniverseGenerationKey,

  planet:
    Planet,

  greenhouseEffect:
    AtmosphereGreenhouseEffect,
): void {

  if (
    generationKey.generatorVersion !==
      GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  if (
    !generationKey.equals(
      planet.generationKey,
    )
  ) {
    throw new RangeError(
      'ClimateEngine requires the Planet to share the supplied UniverseGenerationKey.',
    );
  }

  if (
    !planet.isTypePhysicallyCoherent
  ) {
    throw new RangeError(
      'ClimateEngine requires a point-19.7 physically coherent Planet.',
    );
  }

  if (
    greenhouseEffect.planetOrdinal !==
      planet.planetOrdinal ||
    greenhouseEffect.bodyLocator !==
      planet.locator ||
    greenhouseEffect.bodySeed.normalizedValue !==
      planet.seed.normalizedValue
  ) {
    throw new RangeError(
      'ClimateEngine requires the point-20.4 greenhouse state to preserve the exact Planet identity.',
    );
  }

  if (
    !approximatelyEqual(
      greenhouseEffect.sourceReferenceMeanInsolationEarth,
      planet.typeClassification.referenceMeanInsolationEarth,
    ) ||
    !approximatelyEqual(
      greenhouseEffect.sourceReferenceBondAlbedo01,
      planet.referenceBondAlbedo01,
    )
  ) {
    throw new RangeError(
      'ClimateEngine requires the point-20.4 greenhouse state to preserve the exact phase-19 irradiation/albedo source values.',
    );
  }

  const isDeepEnvelope =
    greenhouseEffect.regime ===
      AtmosphereGreenhouseRegime.DEEP_ENVELOPE;

  if (
    isDeepEnvelope !==
      (
        greenhouseEffect.temperatureAmplificationFactor ===
          null
      )
  ) {
    throw new RangeError(
      'ClimateEngine requires point-20.4 deep-envelope and temperature-amplification semantics to agree.',
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
