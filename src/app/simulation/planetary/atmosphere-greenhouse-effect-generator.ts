import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  AtmosphereGreenhouseEffect,
  greenhouseLongwaveTrappingFraction01,
  greenhouseTemperatureAmplificationFactor,
} from '../../domain/planetary/atmosphere-greenhouse-effect';

import {
  AtmosphereGreenhouseGasContribution,
} from '../../domain/planetary/atmosphere-greenhouse-gas-contribution';

import {
  atmosphereGreenhouseRegimeForOpticalDepthProxy,
} from '../../domain/planetary/atmosphere-greenhouse-regime';

import {
  AtmosphereGas,
} from '../../domain/planetary/atmosphere-gas';

import {
  type AtmosphereGasComponent,
} from '../../domain/planetary/atmosphere-gas-component';

import {
  AtmosphereRetentionRegime,
} from '../../domain/planetary/atmosphere-retention-regime';

import {
  type AtmosphereRetentionState,
} from '../../domain/planetary/atmosphere-retention-state';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

const V1_EARTH_REFERENCE_PRESSURE_PASCAL =
  101_325;

const V1_SOLID_GREENHOUSE_OPTICAL_DEPTH_SCALE =
  60;

const V1_SOLID_PRESSURE_BROADENING_EXPONENT =
  0.72;

const V1_MAX_PRESSURE_BROADENING_FACTOR =
  12;

const V1_MAX_OPTICAL_DEPTH_PROXY =
  20;

const V1_DEEP_ENVELOPE_BASE_OPTICAL_DEPTH =
  4;

const V1_DEEP_ENVELOPE_MASS_FRACTION_SCALE =
  8;

const V1_DEEP_ENVELOPE_COMPOSITION_SCALE =
  4;

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-20.4 deterministic approximate greenhouse-effect generator.
 *
 * V1 consumes zero PRNG draws and derives zero new seeds. It works exclusively
 * from the retained point-20.3 gas inventory. Solid worlds use retained surface
 * pressure, species-dependent longwave weights and a pressure-broadening proxy
 * to derive an infrared optical-depth proxy. A grey-atmosphere temperature
 * amplification factor is exposed only as a dimensionless point-20.5 handoff;
 * no equilibrium or surface temperature is generated here.
 *
 * Deep-envelope worlds are treated as radiatively blanketed atmospheres without
 * inventing a solid-surface pressure or surface temperature amplification.
 */
export class AtmosphereGreenhouseEffectGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,

    retentionState:
      AtmosphereRetentionState,
  ): AtmosphereGreenhouseEffect {

    assertGenerationContext(
      generationKey,
      planet,
      retentionState,
    );

    return generateGreenhouseEffectV1(
      planet,
      retentionState,
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
  ): readonly AtmosphereGreenhouseEffect[] {

    if (
      !generationKey.equals(
        planetarySystem.generationKey,
      )
    ) {
      throw new RangeError(
        'AtmosphereGreenhouseEffectGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      planets.length !==
        planetarySystem.planetCount ||
      retentionStates.length !==
        planetarySystem.planetCount
    ) {
      throw new RangeError(
        'AtmosphereGreenhouseEffectGenerator.generateAll requires one Planet and one point-20.3 retention state for every mature planet.',
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
              'AtmosphereGreenhouseEffectGenerator.generateAll requires Planets from the exact supplied system in frozen planetOrdinal order.',
            );
          }

          const retentionState =
            retentionStates[index];

          assertGenerationContext(
            generationKey,
            planet,
            retentionState,
          );

          return generateGreenhouseEffectV1(
            planet,
            retentionState,
          );
        },
      ),
    );
  }
}

function assertGenerationContext(
  generationKey:
    UniverseGenerationKey,

  planet:
    Planet,

  retentionState:
    AtmosphereRetentionState,
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
      'AtmosphereGreenhouseEffectGenerator requires the Planet to share the supplied UniverseGenerationKey.',
    );
  }

  if (
    !planet.isTypePhysicallyCoherent
  ) {
    throw new RangeError(
      'AtmosphereGreenhouseEffectGenerator requires a point-19.7 physically coherent Planet.',
    );
  }

  if (
    retentionState.planetOrdinal !==
      planet.planetOrdinal ||
    !sameBodyLocator(
      retentionState.bodyLocator,
      planet.locator,
    ) ||
    retentionState.bodySeed.normalizedValue !==
      planet.seed.normalizedValue
  ) {
    throw new RangeError(
      'AtmosphereGreenhouseEffectGenerator requires the point-20.3 state to preserve the exact Planet identity.',
    );
  }

  if (
    !approximatelyEqual(
      retentionState.sourceReferenceMeanInsolationEarth,
      planet.typeClassification.referenceMeanInsolationEarth,
    ) ||
    !approximatelyEqual(
      retentionState.sourceReferenceBondAlbedo01,
      planet.referenceBondAlbedo01,
    )
  ) {
    throw new RangeError(
      'AtmosphereGreenhouseEffectGenerator requires the point-20.3 state to preserve the exact phase-19 irradiation/albedo source values.',
    );
  }
}

function generateGreenhouseEffectV1(
  planet:
    Planet,

  retentionState:
    AtmosphereRetentionState,
): AtmosphereGreenhouseEffect {

  if (
    retentionState.retentionRegime ===
      AtmosphereRetentionRegime.VACUUM
  ) {
    return new AtmosphereGreenhouseEffect(
      planet.planetOrdinal,
      planet.locator,
      planet.seed,
      retentionState.retentionRegime,
      retentionState.retainedPressureRegime,
      retentionState.retainedSurfacePressurePascal,
      retentionState.retainedMoleInventoryFraction01,
      retentionState.sourceReferenceMeanInsolationEarth,
      retentionState.sourceReferenceBondAlbedo01,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      atmosphereGreenhouseRegimeForOpticalDepthProxy(
        0,
        false,
      ),
      [],
    );
  }

  const contributions =
    greenhouseContributionsV1(
      retentionState.retainedGasComponents,
    );

  const greenhouseActiveMoleFraction01 =
    contributions.reduce(
      (
        total,
        contribution,
      ) =>
        total +
        contribution.retainedMoleFraction01,
      0,
    );

  const weightedGreenhouseMoleFraction =
    contributions.reduce(
      (
        total,
        contribution,
      ) =>
        total +
        contribution.weightedMoleFraction,
      0,
    );

  if (
    retentionState.retentionRegime ===
      AtmosphereRetentionRegime.DEEP_ENVELOPE
  ) {
    const pressureBroadeningFactor =
      1;

    const infraredOpticalDepthProxy =
      clamp(
        V1_DEEP_ENVELOPE_BASE_OPTICAL_DEPTH +
          V1_DEEP_ENVELOPE_MASS_FRACTION_SCALE *
            planet.physicalProperties.envelopeMassFraction01 +
          V1_DEEP_ENVELOPE_COMPOSITION_SCALE *
            weightedGreenhouseMoleFraction,
        V1_DEEP_ENVELOPE_BASE_OPTICAL_DEPTH,
        V1_MAX_OPTICAL_DEPTH_PROXY,
      );

    return new AtmosphereGreenhouseEffect(
      planet.planetOrdinal,
      planet.locator,
      planet.seed,
      retentionState.retentionRegime,
      retentionState.retainedPressureRegime,
      retentionState.retainedSurfacePressurePascal,
      retentionState.retainedMoleInventoryFraction01,
      retentionState.sourceReferenceMeanInsolationEarth,
      retentionState.sourceReferenceBondAlbedo01,
      greenhouseActiveMoleFraction01,
      weightedGreenhouseMoleFraction,
      pressureBroadeningFactor,
      null,
      infraredOpticalDepthProxy,
      greenhouseLongwaveTrappingFraction01(
        infraredOpticalDepthProxy,
      ),
      null,
      atmosphereGreenhouseRegimeForOpticalDepthProxy(
        infraredOpticalDepthProxy,
        true,
      ),
      contributions,
    );
  }

  const retainedSurfacePressurePascal =
    retentionState.retainedSurfacePressurePascal;

  if (
    retainedSurfacePressurePascal ===
      null ||
    retainedSurfacePressurePascal <=
      0
  ) {
    throw new RangeError(
      'Point-20.4 non-vacuum solid worlds require a positive retained surface pressure from point 20.3.',
    );
  }

  const pressureBroadeningFactor =
    Math.min(
      V1_MAX_PRESSURE_BROADENING_FACTOR,
      Math.pow(
        retainedSurfacePressurePascal /
          V1_EARTH_REFERENCE_PRESSURE_PASCAL,
        V1_SOLID_PRESSURE_BROADENING_EXPONENT,
      ),
    );

  const weightedGreenhouseColumnPascal =
    retainedSurfacePressurePascal *
    weightedGreenhouseMoleFraction;

  const infraredOpticalDepthProxy =
    clamp(
      V1_SOLID_GREENHOUSE_OPTICAL_DEPTH_SCALE *
        weightedGreenhouseMoleFraction *
        pressureBroadeningFactor,
      0,
      V1_MAX_OPTICAL_DEPTH_PROXY,
    );

  return new AtmosphereGreenhouseEffect(
    planet.planetOrdinal,
    planet.locator,
    planet.seed,
    retentionState.retentionRegime,
    retentionState.retainedPressureRegime,
    retainedSurfacePressurePascal,
    retentionState.retainedMoleInventoryFraction01,
    retentionState.sourceReferenceMeanInsolationEarth,
    retentionState.sourceReferenceBondAlbedo01,
    greenhouseActiveMoleFraction01,
    weightedGreenhouseMoleFraction,
    pressureBroadeningFactor,
    weightedGreenhouseColumnPascal,
    infraredOpticalDepthProxy,
    greenhouseLongwaveTrappingFraction01(
      infraredOpticalDepthProxy,
    ),
    greenhouseTemperatureAmplificationFactor(
      infraredOpticalDepthProxy,
    ),
    atmosphereGreenhouseRegimeForOpticalDepthProxy(
      infraredOpticalDepthProxy,
      false,
    ),
    contributions,
  );
}

function greenhouseContributionsV1(
  gasComponents:
    readonly AtmosphereGasComponent[],
): readonly AtmosphereGreenhouseGasContribution[] {

  return Object.freeze(
    gasComponents.flatMap(
      component => {
        const infraredWeight =
          greenhouseInfraredWeightV1(
            component.gas,
          );

        if (
          infraredWeight ===
          0
        ) {
          return [];
        }

        return [
          new AtmosphereGreenhouseGasContribution(
            component.gas,
            component.moleFraction01,
            infraredWeight,
            component.moleFraction01 *
              infraredWeight,
          ),
        ];
      },
    ),
  );
}

function greenhouseInfraredWeightV1(
  gas:
    AtmosphereGas,
): number {

  switch (
    gas
  ) {
    case AtmosphereGas.HYDROGEN:
      return 0.04;

    case AtmosphereGas.CARBON_DIOXIDE:
      return 1.00;

    case AtmosphereGas.WATER_VAPOR:
      return 1.35;

    case AtmosphereGas.METHANE:
      return 4.00;

    case AtmosphereGas.SULFUR_DIOXIDE:
      return 1.80;

    case AtmosphereGas.AMMONIA:
      return 5.00;

    case AtmosphereGas.HELIUM:
    case AtmosphereGas.NITROGEN:
    case AtmosphereGas.OXYGEN:
    case AtmosphereGas.ARGON:
    case AtmosphereGas.CARBON_MONOXIDE:
      return 0;
  }
}

function sameBodyLocator(
  left:
    Planet['locator'],

  right:
    Planet['locator'],
): boolean {

  return (
    left.galaxyIndex ===
      right.galaxyIndex &&
    left.sectorKey ===
      right.sectorKey &&
    left.galacticObjectIndex ===
      right.galacticObjectIndex &&
    left.bodyIndex ===
      right.bodyIndex
  );
}

function clamp(
  value:
    number,
  minimum:
    number,
  maximum:
    number,
): number {

  return Math.min(
    maximum,
    Math.max(
      minimum,
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
    CONSISTENCY_TOLERANCE *
      scale
  );
}
