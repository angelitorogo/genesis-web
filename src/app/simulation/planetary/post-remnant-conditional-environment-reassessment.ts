import { type Atmosphere } from '../../domain/planetary/atmosphere';
import {
  idealGasDensityKilogramsPerCubicMeter,
} from '../../domain/planetary/atmosphere-bulk-properties';
import { type MoonHabitabilityState } from '../../domain/planetary/moon-habitability-state';
import { type MoonEnvironmentState } from '../../domain/planetary/moon-environment-state';
import { type MoonSystem } from '../../domain/planetary/moon-system';
import { type Planet } from '../../domain/planetary/planet';
import {
  PLANET_CLIMATE_V1_ZERO_ALBEDO_EARTH_EQUILIBRIUM_TEMPERATURE_KELVIN,
} from '../../domain/planetary/planet-climate-state';
import { AtmosphereGenerator } from './atmosphere-generator';
import { MoonEnvironmentEngine } from './moon-environment-engine';
import { MoonHabitabilityEngine } from './moon-habitability-engine';

/**
 * 29.1E-e.2 keeps the existing planet/moon identities and frozen orbital
 * geometry, but reruns the environment stack with the present-day forcing.
 * Post-SN orbital survival is still deliberately NOT inferred here.
 *
 * The thermal closure separates three concepts:
 * - irradiation supplied by the CURRENT stellar/compact host;
 * - intrinsic planetary geothermal + tidal heat;
 * - the tiny numerical/background floor required by the legacy phase-20
 *   contracts when both of the above are effectively zero.
 *
 * Intrinsic heat is converted only to a thermal-equivalent forcing so the
 * existing climate/condensation stack can solve one energy balance. It is not
 * exposed as stellar luminosity and it is not accretion radiation.
 */
export const POST_REMNANT_MINIMUM_RADIATIVE_FORCING_EARTH = 1e-8;

const STEFAN_BOLTZMANN_WATTS_PER_SQUARE_METER_KELVIN4 = 5.670374419e-8;
const EARTH_REFERENCE_GEOTHERMAL_FLUX_WATTS_PER_SQUARE_METER = 0.087;
const EARTH_REFERENCE_INTERNAL_HEAT_RETENTION_INDEX01 = 0.712;
const IO_LIKE_TIDAL_HEAT_FLUX_WATTS_PER_SQUARE_METER = 2.5;
const MAX_CONDITIONAL_GEOTHERMAL_FLUX_WATTS_PER_SQUARE_METER = 5;

const ZERO_ALBEDO_EARTH_AVERAGE_RADIATIVE_FLUX_WATTS_PER_SQUARE_METER =
  STEFAN_BOLTZMANN_WATTS_PER_SQUARE_METER_KELVIN4 *
  PLANET_CLIMATE_V1_ZERO_ALBEDO_EARTH_EQUILIBRIUM_TEMPERATURE_KELVIN ** 4;

export interface PostRemnantIntrinsicThermalState {
  readonly internalHeatRetentionIndex01: number;
  readonly tidalHeatingIndex01: number;
  readonly geothermalHeatFluxWattsPerSquareMeter: number;
  readonly tidalHeatFluxWattsPerSquareMeter: number;
  readonly totalIntrinsicHeatFluxWattsPerSquareMeter: number;
  readonly intrinsicEquivalentInsolationEarth: number;
}

export function postRemnantEffectiveRadiativeForcingEarth(
  thermalEquivalentForcingEarth: number,
): number {
  if (!Number.isFinite(thermalEquivalentForcingEarth) || thermalEquivalentForcingEarth < 0) {
    throw new RangeError('Post-remnant thermal forcing requires a finite non-negative value.');
  }
  return Math.max(
    thermalEquivalentForcingEarth,
    POST_REMNANT_MINIMUM_RADIATIVE_FORCING_EARTH,
  );
}

/**
 * First-order absolute heat-flux bridge for the already-frozen normalized
 * geology proxies. Earth anchors the radiogenic/secular term; the existing
 * normalized tidal index is bounded by an Io-like surface-flux reference.
 * This is intentionally used only by the conditional post-remnant projection.
 */
export function postRemnantIntrinsicThermalStateFromInputs(
  massEarth: number,
  radiusEarth: number,
  referenceBondAlbedo01: number,
  internalHeatRetentionIndex01: number | null,
  tidalHeatingIndex01: number | null,
): PostRemnantIntrinsicThermalState {
  assertPositiveFinite(massEarth, 'massEarth');
  assertPositiveFinite(radiusEarth, 'radiusEarth');
  assertNormalized(referenceBondAlbedo01, 'referenceBondAlbedo01', false);

  const internalHeat01 = normalizedOrZero(
    internalHeatRetentionIndex01,
    'internalHeatRetentionIndex01',
  );
  const tidalHeat01 = normalizedOrZero(
    tidalHeatingIndex01,
    'tidalHeatingIndex01',
  );

  const areaAdjustedMassScale = massEarth / (radiusEarth ** 2);
  const geothermalHeatFluxWattsPerSquareMeter = Math.min(
    MAX_CONDITIONAL_GEOTHERMAL_FLUX_WATTS_PER_SQUARE_METER,
    EARTH_REFERENCE_GEOTHERMAL_FLUX_WATTS_PER_SQUARE_METER *
      areaAdjustedMassScale *
      (internalHeat01 / EARTH_REFERENCE_INTERNAL_HEAT_RETENTION_INDEX01),
  );

  const tidalHeatFluxWattsPerSquareMeter =
    IO_LIKE_TIDAL_HEAT_FLUX_WATTS_PER_SQUARE_METER *
    tidalHeat01 ** 2;

  const totalIntrinsicHeatFluxWattsPerSquareMeter =
    geothermalHeatFluxWattsPerSquareMeter + tidalHeatFluxWattsPerSquareMeter;

  const absorbedFraction = Math.max(1e-9, 1 - referenceBondAlbedo01);
  const intrinsicEquivalentInsolationEarth =
    totalIntrinsicHeatFluxWattsPerSquareMeter /
    (
      ZERO_ALBEDO_EARTH_AVERAGE_RADIATIVE_FLUX_WATTS_PER_SQUARE_METER *
      absorbedFraction
    );

  return Object.freeze({
    internalHeatRetentionIndex01: internalHeat01,
    tidalHeatingIndex01: tidalHeat01,
    geothermalHeatFluxWattsPerSquareMeter,
    tidalHeatFluxWattsPerSquareMeter,
    totalIntrinsicHeatFluxWattsPerSquareMeter,
    intrinsicEquivalentInsolationEarth,
  });
}

export interface PostRemnantMoonConditionalEnvironment {
  readonly moonOrdinal: number;
  readonly environmentState: MoonEnvironmentState;
  readonly habitabilityState: MoonHabitabilityState;
}

export interface PostRemnantConditionalEnvironmentReassessment {
  readonly atmosphere: Atmosphere;
  readonly moonEnvironments: readonly PostRemnantMoonConditionalEnvironment[];
  readonly currentHostInsolationEarth: number;
  /** Host irradiation + intrinsic planetary heat expressed only as a thermal equivalent. */
  readonly thermalEquivalentForcingEarth: number;
  /** Positive input supplied to the legacy phase-20 thermal solver after the floor. */
  readonly effectiveRadiativeForcingEarth: number;
  readonly usesMinimumRadiativeFloor: boolean;
  readonly intrinsicThermalState: PostRemnantIntrinsicThermalState;
  readonly currentAtmosphericDensityKilogramsPerCubicMeter: number | null;
}

export class PostRemnantConditionalEnvironmentReassessmentEngine {
  private constructor() {}

  static generate(
    planet: Planet,
    moonSystem: MoonSystem,
    currentHostInsolationEarth: number,
    sourceAtmosphere?: Atmosphere,
  ): PostRemnantConditionalEnvironmentReassessment {
    if (!Number.isFinite(currentHostInsolationEarth) || currentHostInsolationEarth < 0) {
      throw new RangeError('Post-remnant reassessment requires a finite non-negative current host insolation.');
    }
    if (moonSystem.hostPlanet !== planet) {
      throw new RangeError('Post-remnant reassessment requires the original MoonSystem of the supplied Planet.');
    }

    const frozenSourceAtmosphere = sourceAtmosphere ?? AtmosphereGenerator.generate(
      planet.generationKey,
      planet,
    );
    if (frozenSourceAtmosphere.hostPlanet !== planet) {
      throw new RangeError('Post-remnant reassessment requires the original Atmosphere of the supplied Planet.');
    }

    const intrinsicThermalState = postRemnantIntrinsicThermalStateFromInputs(
      planet.massEarth,
      planet.radiusEarth,
      planet.referenceBondAlbedo01,
      frozenSourceAtmosphere.internalHeatRetentionIndex01,
      frozenSourceAtmosphere.tidalHeatingIndex01,
    );

    const thermalEquivalentForcingEarth =
      currentHostInsolationEarth +
      intrinsicThermalState.intrinsicEquivalentInsolationEarth;

    const effectiveRadiativeForcingEarth =
      postRemnantEffectiveRadiativeForcingEarth(thermalEquivalentForcingEarth);

    const conditionalPlanet = planetWithConditionalInsolation(
      planet,
      effectiveRadiativeForcingEarth,
    );
    const atmosphere = AtmosphereGenerator.generate(
      planet.generationKey,
      conditionalPlanet,
    );

    /* Planetary geothermal heat does not illuminate its moons like a star. The
     * lunar environment therefore receives current EXTERNAL forcing only; its
     * own point-21.4 tidal heat remains inside MoonEnvironmentEngine. */
    const moonExternalForcingEarth =
      postRemnantEffectiveRadiativeForcingEarth(currentHostInsolationEarth);
    const conditionalMoonHostPlanet = planetWithConditionalInsolation(
      planet,
      moonExternalForcingEarth,
    );

    const moonEnvironments = Object.freeze(
      moonSystem.relevantMoons.map(moon => {
        const environmentState = MoonEnvironmentEngine.generate(
          conditionalMoonHostPlanet,
          moon.physicalProperties,
          moon.tidalState,
        );
        return Object.freeze({
          moonOrdinal: moon.moonOrdinal,
          environmentState,
          habitabilityState: MoonHabitabilityEngine.generate(environmentState),
        });
      }),
    );

    return Object.freeze({
      atmosphere,
      moonEnvironments,
      currentHostInsolationEarth,
      thermalEquivalentForcingEarth,
      effectiveRadiativeForcingEarth,
      usesMinimumRadiativeFloor:
        effectiveRadiativeForcingEarth !== thermalEquivalentForcingEarth,
      intrinsicThermalState,
      currentAtmosphericDensityKilogramsPerCubicMeter:
        currentAtmosphericDensity(atmosphere),
    });
  }
}

function currentAtmosphericDensity(
  atmosphere: Atmosphere,
): number | null {
  const pressurePascal = atmosphere.retainedSurfacePressurePascal;
  const molarMassGramsPerMole = atmosphere.retainedMeanMolarMassGramsPerMole;
  const temperatureKelvin = atmosphere.meanSurfaceTemperatureKelvin;

  if (
    pressurePascal === null ||
    molarMassGramsPerMole === null ||
    temperatureKelvin === null ||
    pressurePascal <= 0 ||
    molarMassGramsPerMole <= 0 ||
    temperatureKelvin <= 0
  ) {
    return null;
  }

  return idealGasDensityKilogramsPerCubicMeter(
    pressurePascal,
    temperatureKelvin,
    molarMassGramsPerMole,
  );
}

function planetWithConditionalInsolation(
  planet: Planet,
  referenceMeanInsolationEarth: number,
): Planet {
  const classification = Object.create(
    Object.getPrototypeOf(planet.typeClassification),
  ) as Planet['typeClassification'];
  const classificationDescriptors: Record<string, PropertyDescriptor> = {
    ...Object.getOwnPropertyDescriptors(planet.typeClassification),
  };
  classificationDescriptors['referenceMeanInsolationEarth'] = {
    ...(classificationDescriptors['referenceMeanInsolationEarth'] ?? {
      enumerable: true,
      configurable: true,
      writable: true,
    }),
    value: referenceMeanInsolationEarth,
  };
  Object.defineProperties(classification, classificationDescriptors);
  Object.freeze(classification);

  const conditionalPlanet = Object.create(
    Object.getPrototypeOf(planet),
  ) as Planet;
  const planetDescriptors: Record<string, PropertyDescriptor> = {
    ...Object.getOwnPropertyDescriptors(planet),
  };
  planetDescriptors['typeClassification'] = {
    ...(planetDescriptors['typeClassification'] ?? {
      enumerable: true,
      configurable: true,
      writable: true,
    }),
    value: classification,
  };
  Object.defineProperties(conditionalPlanet, planetDescriptors);
  return Object.freeze(conditionalPlanet);
}

function normalizedOrZero(
  value: number | null,
  propertyName: string,
): number {
  if (value === null) return 0;
  assertNormalized(value, propertyName, true);
  return value;
}

function assertNormalized(
  value: number,
  propertyName: string,
  inclusiveUpperBound: boolean,
): void {
  const upperValid = inclusiveUpperBound ? value <= 1 : value < 1;
  if (!Number.isFinite(value) || value < 0 || !upperValid) {
    throw new RangeError(`${propertyName} must be finite and normalized: ${value}.`);
  }
}

function assertPositiveFinite(
  value: number,
  propertyName: string,
): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${propertyName} must be finite and positive: ${value}.`);
  }
}
