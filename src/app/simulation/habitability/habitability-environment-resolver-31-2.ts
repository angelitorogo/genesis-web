import type {
  HabitabilityConstraint,
  HabitabilityEvidence,
  HabitabilityEvidenceBasis,
  HabitabilityEvidenceVerdict,
  HabitabilityMultiplicity,
  HabitabilityPerspective,
  HabitabilityRoute,
  HabitabilityScenarioAssessment,
  HabitabilityTimeContextCt0,
} from '../../domain/habitability/habitability-scenario';
import type { PlanetWaterInventory } from '../../domain/planetary/planet-water-inventory';
import type { AtmosphereRetentionState } from '../../domain/planetary/atmosphere-retention-state';
import type { PlanetClimateState } from '../../domain/planetary/planet-climate-state';
import type { MoonEnvironmentState } from '../../domain/planetary/moon-environment-state';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import {
  WATER_V1_CRITICAL_TEMPERATURE_KELVIN,
  WATER_V1_FREEZING_TEMPERATURE_KELVIN,
  WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL,
  waterBoilingTemperatureKelvinForPressurePascal,
} from '../planetary/planet-water-engine';
import { waterSaturationVaporPressurePascal } from '../planetary/atmosphere-radiative-column-model';
import { HabitabilityEngine } from './habitability-engine';

/**
 * 31.2 is a read-only bridge from *existing resolved states* to the 31.1
 * environmental constraints. Neither the pressure support nor the inferred
 * thermal window is proof of long-term hydrological stability or life.
 */
export interface HabitabilityEnvironmentContext31_2 {
  readonly bodyKey: string;
  readonly multiplicity: HabitabilityMultiplicity;
  readonly perspective: HabitabilityPerspective;
  readonly time: HabitabilityTimeContextCt0;
  /** Granted only by the discovery layer. Default = no observer access. */
  readonly observerAccessibleEvidence: readonly Readonly<{
    route: Exclude<HabitabilityRoute, 'ALTERNATIVE_CHEMISTRY'>;
    constraint: HabitabilityConstraint;
  }>[];
}

/** Existing point-20.7 water inventory: phase and coverage, never ocean mass. */
export type PlanetEnvironmentalWaterSource31_2 = Pick<PlanetWaterInventory,
  | 'planetOrdinal'
  | 'sourceRetainedSurfacePressurePascal'
  | 'sourceRetainedAtmosphericWaterVaporMoleFraction01'
  | 'sourceMeanSurfaceTemperatureKelvin'
  | 'sourceMinimumSurfaceTemperatureKelvin'
  | 'sourceMaximumSurfaceTemperatureKelvin'
  | 'surfaceLiquidWaterCoverageFraction01'
  | 'hasPersistentSurfaceLiquidWater'
  | 'waterInventoryIndex01'
>;

/** Optional cross-check against retained atmospheric state, not new physics. */
export type PlanetEnvironmentalAtmosphereSource31_2 = Pick<AtmosphereRetentionState,
  'planetOrdinal' | 'retainedSurfacePressurePascal' | 'retainedGasComponents'
>;
export type PlanetEnvironmentalClimateSource31_2 = Pick<PlanetClimateState,
  'planetOrdinal' | 'meanSurfaceTemperatureKelvin'
>;

export interface PlanetEnvironmentalSources31_2 {
  readonly water: PlanetEnvironmentalWaterSource31_2 | null;
  readonly atmosphere?: PlanetEnvironmentalAtmosphereSource31_2 | null;
  readonly climate?: PlanetEnvironmentalClimateSource31_2 | null;
}

/** Only actually modeled lunar data; legacy indexes are NOT evidence of oceans. */
export type MoonEnvironmentalSource31_2 = Pick<MoonEnvironmentState,
  | 'estimatedSurfaceTemperatureKelvin'
  | 'waterRegime'
  | 'atmosphereAssessment'
  | 'internalWaterAssessment'
>;

const LIQUID_VAPOR_REPLENISHMENT_UNRESOLVED_BELOW01 = 0.25;
const COMPOSITION_TOLERANCE = 0.005;
const CONSISTENCY_TOLERANCE = 1e-6;
const SURFACE: HabitabilityRoute = 'SURFACE_AQUEOUS';
const SUBSURFACE: HabitabilityRoute = 'SUBSURFACE_AQUEOUS';

export class HabitabilityEnvironmentResolver31_2 {
  private constructor() {}

  static assessPlanet(
    context: HabitabilityEnvironmentContext31_2,
    sources: PlanetEnvironmentalSources31_2,
  ): HabitabilityScenarioAssessment {
    const evidence: HabitabilityEvidence[] = [];
    const water = sources.water;
    checkPlanetSourceCoherence(water, sources);
    if (water === null) {
      // Pressure and mean climate remain independently usable. Never invent a
      // hydrosphere when the point-20.7 water inventory is not resolved.
      const pressure = sources.atmosphere?.retainedSurfacePressurePascal;
      const mean = sources.climate?.meanSurfaceTemperatureKelvin;
      if (pressure !== null && pressure !== undefined && finiteNonNegative(pressure)) {
        add(evidence, context, SURFACE, 'PRESSURE_OR_CONFINEMENT',
          pressure < WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL ? 'CONTRADICTS' : 'SUPPORTS',
          'PHYSICAL_MODEL', 'planet.20.3.retainedSurfacePressurePascal');
        const boiling = waterBoilingTemperatureKelvinForPressurePascal(pressure);
        if (boiling !== null && mean !== null && mean !== undefined && finitePositive(mean) &&
            mean >= WATER_V1_FREEZING_TEMPERATURE_KELVIN && mean < boiling) {
          // Global mean alone cannot resolve local extrema; this is an inferred
          // thermal opportunity, not a persistent liquid reservoir.
          add(evidence, context, SURFACE, 'TEMPERATURE', 'SUPPORTS',
            'INFERRED_MODEL', 'planet.20.5.meanSurfaceTemperatureKelvin');
        }
      }
    } else {
      const pressure = water.sourceRetainedSurfacePressurePascal;
      const mean = water.sourceMeanSurfaceTemperatureKelvin;
      const min = water.sourceMinimumSurfaceTemperatureKelvin;
      const max = water.sourceMaximumSurfaceTemperatureKelvin;
      const coverage = water.surfaceLiquidWaterCoverageFraction01;
      const deepEnvelope = pressure === null;

      if (deepEnvelope) {
        // A deep envelope has no modeled exposed solid-surface reservoir.
        add(evidence, context, SURFACE, 'LIQUID_RESERVOIR', 'CONTRADICTS',
          'PHYSICAL_MODEL', 'planet.20.7.deepEnvelope.surfaceUndefined');
      } else if (finiteNonNegative(pressure)) {
        add(evidence, context, SURFACE, 'PRESSURE_OR_CONFINEMENT',
          pressure < WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL ? 'CONTRADICTS' : 'SUPPORTS',
          'PHYSICAL_MODEL', 'planet.20.7.retainedSurfacePressurePascal');

        const boiling = waterBoilingTemperatureKelvinForPressurePascal(pressure);
        if (boiling !== null && validThermalRange(mean, min, max)) {
          const verdict: HabitabilityEvidenceVerdict = max! < WATER_V1_FREEZING_TEMPERATURE_KELVIN ||
            min! >= boiling || min! >= WATER_V1_CRITICAL_TEMPERATURE_KELVIN
            ? 'CONTRADICTS'
            : mean! >= WATER_V1_FREEZING_TEMPERATURE_KELVIN && mean! < boiling
              ? 'SUPPORTS'
              : 'UNRESOLVED';
          add(evidence, context, SURFACE, 'TEMPERATURE', verdict,
            verdict === 'UNRESOLVED' ? 'UNRESOLVED' : 'PHYSICAL_MODEL',
            'planet.20.7.surfaceThermalExtrema');
        }

        if (finiteFraction(coverage) && finiteFraction(water.waterInventoryIndex01)) {
          if (coverage === 0 || water.waterInventoryIndex01 === 0) {
            add(evidence, context, SURFACE, 'LIQUID_RESERVOIR', 'CONTRADICTS',
              'PHYSICAL_MODEL', 'planet.20.7.surfaceLiquidWaterCoverageFraction01');
          } else if (water.hasPersistentSurfaceLiquidWater &&
                     validThermalRange(mean, min, max) && boiling !== null &&
                     mean! >= WATER_V1_FREEZING_TEMPERATURE_KELVIN && mean! < boiling) {
            // The water inventory explicitly supports a modeled current surface
            // reservoir. ATM-VIS.3 shows that total pressure alone does NOT
            // demonstrate persistence against evaporation.
            const saturation = waterSaturationVaporPressurePascal(mean!);
            const fraction = water.sourceRetainedAtmosphericWaterVaporMoleFraction01;
            if (finiteFraction(fraction) && Number.isFinite(saturation) && saturation > 0) {
              const vaporSaturation01 = pressure * fraction / saturation;
              add(evidence, context, SURFACE, 'LIQUID_RESERVOIR',
                vaporSaturation01 < LIQUID_VAPOR_REPLENISHMENT_UNRESOLVED_BELOW01
                  ? 'UNRESOLVED' : 'SUPPORTS',
                vaporSaturation01 < LIQUID_VAPOR_REPLENISHMENT_UNRESOLVED_BELOW01
                  ? 'UNRESOLVED' : 'INFERRED_MODEL',
                'planet.20.7.surfaceCoverage+ATM-VIS.3.vaporSaturation');
            }
          }
          // Non-persistent positive coverage is NOT an established stable reservoir.
        }
      }
    }
    return evaluate('PLANET', context, evidence);
  }

  static assessMoon(
    context: HabitabilityEnvironmentContext31_2,
    moon: MoonEnvironmentalSource31_2 | null,
  ): HabitabilityScenarioAssessment {
    const evidence: HabitabilityEvidence[] = [];
    if (moon !== null) {
      const temperature = moon.estimatedSurfaceTemperatureKelvin;
      const atmosphere = moon.atmosphereAssessment;
      const pressure = atmosphere?.pressureBasis === 'CONDITIONAL_SCENARIO'
        ? atmosphere.estimatedSurfacePressurePascal : null;

      if (pressure !== null && pressure !== undefined && finiteNonNegative(pressure)) {
        add(evidence, context, SURFACE, 'PRESSURE_OR_CONFINEMENT',
          pressure >= WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL ? 'SUPPORTS' : 'CONTRADICTS',
          'INFERRED_MODEL', 'moon.B.atmosphere.conditionalPressure');

        const boiling = waterBoilingTemperatureKelvinForPressurePascal(pressure);
        if (boiling !== null && finitePositive(temperature)) {
          // Lunar temperatures/pressures are conditional, not local measurements.
          // No contradiction from global estimates alone: local niches unresolved.
          if (temperature >= WATER_V1_FREEZING_TEMPERATURE_KELVIN && temperature < boiling) {
            add(evidence, context, SURFACE, 'TEMPERATURE', 'SUPPORTS',
              'INFERRED_MODEL', 'moon.21.5.temperature+moon.B.conditionalPressure');
          }
        }
      }

      // V1 lunar waterRegime is a POTENTIAL, never a confirmed reservoir.
      // The C-layer oceanConfirmed is currently always false. A thermally
      // admissible ice-ocean hypothesis may support temperature only.
      if (moon.internalWaterAssessment?.iceShellThermalRegime === 'CONDITIONAL_ICE_OCEAN' &&
          finitePositive(temperature) && temperature < WATER_V1_FREEZING_TEMPERATURE_KELVIN) {
        add(evidence, context, SUBSURFACE, 'TEMPERATURE', 'SUPPORTS',
          'INFERRED_MODEL', 'moon.C.conditionalIceShellThermalRegime');
      }
      // Explicitly keep SUBSURFACE LIQUID_RESERVOIR, pressure/confinement,
      // and geometry unresolved until 31.10 supplies defensible constraints.
    }
    return evaluate('MOON', context, evidence);
  }
}

function evaluate(
  bodyKind: 'PLANET' | 'MOON',
  context: HabitabilityEnvironmentContext31_2,
  evidence: readonly HabitabilityEvidence[],
): HabitabilityScenarioAssessment {
  return HabitabilityEngine.evaluate({
    bodyKind,
    bodyKey: context.bodyKey,
    multiplicity: context.multiplicity,
    perspective: context.perspective,
    time: context.time,
    evidence,
  });
}

function add(
  output: HabitabilityEvidence[],
  context: HabitabilityEnvironmentContext31_2,
  route: HabitabilityRoute,
  constraint: HabitabilityConstraint,
  verdict: HabitabilityEvidenceVerdict,
  basis: HabitabilityEvidenceBasis,
  sourceKey: string,
): void {
  output.push({
    route, constraint, verdict, basis, sourceKey,
    accessibleToObserver: context.observerAccessibleEvidence.some((entry) =>
      entry.route === route && entry.constraint === constraint),
  });
}

function checkPlanetSourceCoherence(
  water: PlanetEnvironmentalWaterSource31_2 | null,
  sources: PlanetEnvironmentalSources31_2,
): void {
  const atmosphere = sources.atmosphere;
  const climate = sources.climate;
  if (water === null) {
    if (atmosphere && climate && atmosphere.planetOrdinal !== climate.planetOrdinal) {
      throw new RangeError('31.2: atmosphere and climate belong to different planets.');
    }
    return;
  }
  if (atmosphere !== null && atmosphere !== undefined) {
    if (atmosphere.planetOrdinal !== water.planetOrdinal ||
        !sameNumber(atmosphere.retainedSurfacePressurePascal, water.sourceRetainedSurfacePressurePascal)) {
      throw new RangeError('31.2: atmosphere and water inventory refer to incompatible planet or pressure.');
    }
    const components = atmosphere.retainedGasComponents;
    const sum = components.reduce((total, gas) => total + gas.moleFraction01, 0);
    if (components.length > 0 && Math.abs(sum - 1) < COMPOSITION_TOLERANCE) {
      const vapor = components.filter((gas) => gas.gas === AtmosphereGas.WATER_VAPOR)
        .reduce((total, gas) => total + gas.moleFraction01, 0);
      if (!sameNumber(vapor, water.sourceRetainedAtmosphericWaterVaporMoleFraction01)) {
        throw new RangeError('31.2: retained water vapor differs between atmosphere and water inventory.');
      }
    }
  }
  if (climate !== null && climate !== undefined &&
      (climate.planetOrdinal !== water.planetOrdinal ||
       !sameNumber(climate.meanSurfaceTemperatureKelvin, water.sourceMeanSurfaceTemperatureKelvin))) {
    throw new RangeError('31.2: planet climate and water inventory use different temperature states.');
  }
}

function sameNumber(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return a === b;
  return Number.isFinite(a) && Number.isFinite(b) &&
    Math.abs(a - b) <= CONSISTENCY_TOLERANCE * Math.max(1, Math.abs(a), Math.abs(b));
}

function finiteFraction(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 1;
}
function finiteNonNegative(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0;
}
function finitePositive(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}
function validThermalRange(
  mean: number | null, min: number | null, max: number | null,
): boolean {
  return finitePositive(mean) && finitePositive(min) && finitePositive(max) &&
    min <= mean && mean <= max;
}
