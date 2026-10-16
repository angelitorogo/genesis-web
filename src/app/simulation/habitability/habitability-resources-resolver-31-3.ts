import type {
  HabitabilityConstraint,
  HabitabilityEvidence,
  HabitabilityEvidenceVerdict,
  HabitabilityRoute,
  HabitabilityScenarioAssessment,
} from '../../domain/habitability/habitability-scenario';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import type { PlanetPhysicalProperties } from '../../domain/planetary/planet-physical-properties';
import type { PlanetInternalComposition } from '../../domain/planetary/planet-internal-composition';
import type { AtmosphereRetentionState } from '../../domain/planetary/atmosphere-retention-state';
import type { PlanetClimateState } from '../../domain/planetary/planet-climate-state';
import type { PlanetClimateVariabilityState } from '../../domain/planetary/planet-climate-variability-state';
import type { PlanetGeologyState } from '../../domain/planetary/planet-geology-state';
import type { MoonEnvironmentState } from '../../domain/planetary/moon-environment-state';
import { HabitabilityEngine } from './habitability-engine';
import {
  HabitabilityEnvironmentResolver31_2,
  type HabitabilityEnvironmentContext31_2,
  type PlanetEnvironmentalSources31_2,
  type MoonEnvironmentalSource31_2,
} from './habitability-environment-resolver-31-2';

/**
 * 31.3 only interprets already-resolved physical states. It NEVER creates a
 * metabolism, nutrient budget, geochemical reaction rate or organism, and it
 * never scores gravity against an Earth-gravity preference.
 *
 * Call the 31.2 resolver first; this read-only bridge preserves its evidence.
 * Callers MUST obtain observer permissions from the discovery layer.
 */
export interface PlanetResourceSources31_3 {
  readonly physical?: Pick<PlanetPhysicalProperties,
    'planetOrdinal' | 'surfaceGravityEarth'> | null;
  readonly atmosphere?: Pick<AtmosphereRetentionState,
    'planetOrdinal' | 'retainedSurfacePressurePascal' | 'retainedGasComponents'> | null;
  readonly climate?: Pick<PlanetClimateState,
    'planetOrdinal' | 'sourceReferenceMeanInsolationEarth' | 'absorbedStellarFluxFactor'> | null;
  readonly variability?: Pick<PlanetClimateVariabilityState,
    'planetOrdinal' | 'diurnalTemperatureRangeKelvin'> | null;
  readonly geology?: Pick<PlanetGeologyState,
    'planetOrdinal' | 'internalHeatRetentionIndex01' | 'tidalHeatingIndex01'> | null;
  readonly composition?: Pick<PlanetInternalComposition,
    'planetOrdinal' | 'metallicCoreMassEarth' | 'silicateInteriorMassEarth'
    | 'condensedIceMassEarth' | 'volatileRichInteriorMassEarth'> | null;
}

export type MoonResourceSource31_3 = Pick<MoonEnvironmentState,
  | 'sourceMoonSurfaceGravityEarth'
  | 'sourceReferenceMeanInsolationEarth'
  | 'sourceTidalHeatingIndex01'
  | 'internalHeatRetentionIndex01'
  | 'atmosphereAssessment'
  | 'internalWaterAssessment'
>;

export interface HabitabilityResourceDiagnostics31_3 {
  /** Physical gravity, not a fitness score nor a threshold against 1 g. */
  readonly gravityEarth: number | null;
  readonly retention: 'RETAINED_GAS_MODELED' | 'NO_RETAINED_GAS_MODELED' |
    'CONDITIONAL_LUNAR_COLUMN' | 'NOT_RESOLVED';
  /** Gas-phase pairs are candidates, NOT dissolved surface chemistry. */
  readonly candidateGasRedoxPair: string | null;
  readonly radiativeSourceResolved: boolean;
  /** Planetary day/night contrast is modeled, not a measured heat-engine yield. */
  readonly thermalContrastKelvin: number | null;
  readonly internalEnergy: 'BOUNDED_CONDITIONAL_TIDES' | 'INDEX_ONLY' | 'NOT_RESOLVED';
  readonly chemicalAccessibilityResolved: boolean;
  readonly metabolismResolved: false;
}

export interface HabitabilityResourcesResult31_3 {
  readonly assessment: HabitabilityScenarioAssessment;
  /** Null in observed projections: diagnostics are ground-truth introspection. */
  readonly diagnostics: HabitabilityResourceDiagnostics31_3 | null;
}

const SURFACE: HabitabilityRoute = 'SURFACE_AQUEOUS';
const SUBSURFACE: HabitabilityRoute = 'SUBSURFACE_AQUEOUS';

const REDOX_PAIRS: ReadonlyArray<readonly [AtmosphereGas, AtmosphereGas]> = [
  [AtmosphereGas.HYDROGEN, AtmosphereGas.CARBON_DIOXIDE],
  [AtmosphereGas.HYDROGEN, AtmosphereGas.OXYGEN],
  [AtmosphereGas.METHANE, AtmosphereGas.OXYGEN],
  [AtmosphereGas.CARBON_MONOXIDE, AtmosphereGas.OXYGEN],
];

export class HabitabilityResourcesResolver31_3 {
  private constructor() {}

  /** Safe public integration: evaluate 31.2 then 31.3 with coherent planet inputs. */
  static assessPlanetFromSources(
    context: HabitabilityEnvironmentContext31_2,
    environmental: PlanetEnvironmentalSources31_2,
    resources: PlanetResourceSources31_3,
  ): HabitabilityResourcesResult31_3 {
    const environmentalOrdinals = [
      environmental.water?.planetOrdinal,
      environmental.atmosphere?.planetOrdinal,
      environmental.climate?.planetOrdinal,
    ].filter((n): n is number => n !== null && n !== undefined);
    const resourceOrdinals = [resources.physical?.planetOrdinal, resources.atmosphere?.planetOrdinal,
      resources.climate?.planetOrdinal, resources.variability?.planetOrdinal,
      resources.geology?.planetOrdinal, resources.composition?.planetOrdinal]
      .filter((n): n is number => n !== null && n !== undefined);
    if (environmentalOrdinals.length > 0 && resourceOrdinals.length > 0 &&
        environmentalOrdinals[0] !== resourceOrdinals[0]) {
      throw new RangeError('31.3: environmental and resource sources belong to different planets.');
    }
    const environmentalPressure = environmental.water?.sourceRetainedSurfacePressurePascal ??
      environmental.atmosphere?.retainedSurfacePressurePascal ?? null;
    const resourcePressure = resources.atmosphere?.retainedSurfacePressurePascal ?? null;
    if (environmentalPressure !== null && resourcePressure !== null &&
        (!Number.isFinite(environmentalPressure) || !Number.isFinite(resourcePressure) ||
         Math.abs(environmentalPressure - resourcePressure) >
           1e-6 * Math.max(1, environmentalPressure, resourcePressure))) {
      throw new RangeError('31.3: retained pressure differs between 31.2 and 31.3.');
    }
    return this.assessPlanet(context,
      HabitabilityEnvironmentResolver31_2.assessPlanet(context, environmental), resources);
  }

  /** Same lunar source for both phases; no imaginary observed ocean. */
  static assessMoonFromSources(
    context: HabitabilityEnvironmentContext31_2,
    moon: (MoonEnvironmentalSource31_2 & MoonResourceSource31_3) | null,
  ): HabitabilityResourcesResult31_3 {
    return this.assessMoon(context,
      HabitabilityEnvironmentResolver31_2.assessMoon(context, moon), moon);
  }

  static assessPlanet(
    context: HabitabilityEnvironmentContext31_2,
    environment: HabitabilityScenarioAssessment,
    sources: PlanetResourceSources31_3,
  ): HabitabilityResourcesResult31_3 {
    validatePrior(context, environment, 'PLANET');
    validatePlanetOrdinals(sources);
    const evidence = preserveEvidence(context, environment);
    const atmosphere = sources.atmosphere ?? null;
    const physical = sources.physical ?? null;
    const climate = sources.climate ?? null;
    const variability = sources.variability ?? null;
    const geology = sources.geology ?? null;
    const composition = sources.composition ?? null;

    const gravity = physical?.surfaceGravityEarth ?? null;
    if (gravity !== null) requirePositive(gravity, 'planet gravity');
    const pressure = atmosphere?.retainedSurfacePressurePascal ?? null;
    if (pressure !== null) requireNonNegative(pressure, 'retained gas pressure');
    const retention = atmosphere === null || pressure === null
      ? 'NOT_RESOLVED'
      : pressure > 0 ? 'RETAINED_GAS_MODELED' : 'NO_RETAINED_GAS_MODELED';
    // No Earth gravity cutoffs, no "too-low g" penalties. Actual retained gas
    // is an independent physical output; it does not prove chemical suitability.
    if (gravity !== null && retention === 'RETAINED_GAS_MODELED') {
      add(evidence, context, SURFACE, 'GRAVITY_AND_RETENTION', 'SUPPORTS',
        'PHYSICAL_MODEL', 'planet.19.2.surfaceGravity+20.3.retainedGas');
    }

    const gases = new Map<AtmosphereGas, number>();
    if (atmosphere) {
      for (const component of atmosphere.retainedGasComponents) {
        if (!Number.isFinite(component.moleFraction01) ||
            component.moleFraction01 < 0 || component.moleFraction01 > 1 ||
            gases.has(component.gas)) {
          throw new RangeError('31.3 requires valid, unique retained gas species.');
        }
        gases.set(component.gas, component.moleFraction01);
      }
    }
    const redox = retention === 'RETAINED_GAS_MODELED'
      ? REDOX_PAIRS.find(([a, b]) => (gases.get(a) ?? 0) > 0 && (gases.get(b) ?? 0) > 0)
      : undefined;
    const candidateGasRedoxPair = redox ? `${redox[0]}+${redox[1]}` : null;
    // A physically modeled liquid reservoir and coexisting gas redox species
    // support only an INFERRED *candidate* chemical opportunity. They do not
    // resolve solubility, nutrients, pH, metabolism or long-term reaction rate.
    if (candidateGasRedoxPair && hasResolvedSupport(environment, SURFACE, 'LIQUID_RESERVOIR')) {
      add(evidence, context, SURFACE, 'CHEMICAL_FEASIBILITY', 'SUPPORTS',
        'INFERRED_MODEL', 'planet.20.3.gasRedoxPair+20.7.inferredSurfaceReservoir');
    }

    const absorbed = climate?.absorbedStellarFluxFactor ?? null;
    const insolation = climate?.sourceReferenceMeanInsolationEarth ?? null;
    const contrast = variability?.diurnalTemperatureRangeKelvin ?? null;
    if (absorbed !== null) requireNonNegative(absorbed, 'absorbed stellar flux factor');
    if (insolation !== null) requireNonNegative(insolation, 'reference insolation');
    if (contrast !== null) requireNonNegative(contrast, 'day/night contrast');
    const hasRadiativeSource = absorbed !== null && absorbed > 0 &&
      insolation !== null && insolation > 0;
    // A resolved radiative input plus modeled day/night thermal contrast is a
    // thermal energy gradient, not a measured biochemical free-energy flux.
    if (hasRadiativeSource && contrast !== null && contrast > 0) {
      add(evidence, context, SURFACE, 'ENERGY_GRADIENT', 'SUPPORTS',
        'INFERRED_MODEL', 'planet.20.5.absorbedStellarFlux+20.6.diurnalTemperatureRange');
    }
    if (geology) {
      checkIndex(geology.internalHeatRetentionIndex01, 'planet internal heat proxy');
      checkIndex(geology.tidalHeatingIndex01, 'planet tidal heat proxy');
    }
    if (composition) {
      for (const [key, value] of Object.entries(composition)) {
        if (key !== 'planetOrdinal') requireNonNegative(value, `bulk ${key}`);
      }
    }
    // Interior inventory and geothermal activity INDICES are not proof of an
    // exposed reactant reservoir, flux or sustained usable gradient.
    return output(context, environment, evidence, {
      gravityEarth: gravity,
      retention,
      candidateGasRedoxPair,
      radiativeSourceResolved: hasRadiativeSource,
      thermalContrastKelvin: contrast,
      internalEnergy: geology && (
        geology.internalHeatRetentionIndex01 !== null ||
        geology.tidalHeatingIndex01 !== null
      ) ? 'INDEX_ONLY' : 'NOT_RESOLVED',
      chemicalAccessibilityResolved: false,
      metabolismResolved: false,
    });
  }

  static assessMoon(
    context: HabitabilityEnvironmentContext31_2,
    environment: HabitabilityScenarioAssessment,
    source: MoonResourceSource31_3 | null,
  ): HabitabilityResourcesResult31_3 {
    validatePrior(context, environment, 'MOON');
    const evidence = preserveEvidence(context, environment);
    if (source === null) {
      return output(context, environment, evidence, {
        gravityEarth: null, retention: 'NOT_RESOLVED',
        candidateGasRedoxPair: null, radiativeSourceResolved: false,
        thermalContrastKelvin: null, internalEnergy: 'NOT_RESOLVED',
        chemicalAccessibilityResolved: false, metabolismResolved: false,
      });
    }
    requirePositive(source.sourceMoonSurfaceGravityEarth, 'moon gravity');
    requireNonNegative(source.sourceReferenceMeanInsolationEarth, 'moon insolation');
    checkIndex(source.sourceTidalHeatingIndex01, 'lunar tidal heating proxy');
    checkIndex(source.internalHeatRetentionIndex01, 'lunar internal heat proxy');
    const fluxMin = source.internalWaterAssessment?.tidalHeatFluxMinimumWattsPerSquareMeter ?? null;
    const fluxMax = source.internalWaterAssessment?.tidalHeatFluxMaximumWattsPerSquareMeter ?? null;
    if (fluxMin !== null) requireNonNegative(fluxMin, 'lunar modeled tidal flux min');
    if (fluxMax !== null) requireNonNegative(fluxMax, 'lunar modeled tidal flux max');
    if (fluxMin !== null && fluxMax !== null && fluxMin > fluxMax) {
      throw new RangeError('31.3: lunar tidal flux bounds must be ordered.');
    }
    // These fluxes are conditional k2/Q bounds, not measured heat flows;
    // no ocean is confirmed, and no accessible redox boundary is resolved.
    return output(context, environment, evidence, {
      gravityEarth: source.sourceMoonSurfaceGravityEarth,
      retention: source.atmosphereAssessment?.pressureBasis === 'CONDITIONAL_SCENARIO'
        ? 'CONDITIONAL_LUNAR_COLUMN' : 'NOT_RESOLVED',
      candidateGasRedoxPair: null,
      radiativeSourceResolved: source.sourceReferenceMeanInsolationEarth > 0,
      thermalContrastKelvin: null,
      internalEnergy: fluxMin !== null && fluxMax !== null
        ? 'BOUNDED_CONDITIONAL_TIDES' : 'INDEX_ONLY',
      chemicalAccessibilityResolved: false,
      metabolismResolved: false,
    });
  }
}

function validatePrior(
  context: HabitabilityEnvironmentContext31_2,
  prior: HabitabilityScenarioAssessment,
  kind: 'PLANET' | 'MOON',
): void {
  if (prior.bodyKind !== kind || prior.bodyKey !== context.bodyKey ||
      prior.multiplicity !== context.multiplicity || prior.perspective !== context.perspective ||
      prior.contractVersion !== '31.1-CT0' || prior.time.kind !== context.time.kind ||
      prior.time.systemAgeBillionYears !== context.time.systemAgeBillionYears) {
    throw new RangeError('31.3: the 31.2 assessment must match body, time and perspective.');
  }
}

function validatePlanetOrdinals(sources: PlanetResourceSources31_3): void {
  const ordinals = [sources.physical?.planetOrdinal, sources.atmosphere?.planetOrdinal,
    sources.climate?.planetOrdinal, sources.variability?.planetOrdinal,
    sources.geology?.planetOrdinal, sources.composition?.planetOrdinal]
    .filter((n): n is number => n !== null && n !== undefined);
  if (ordinals.some((n) => !Number.isInteger(n) || n < 1 || n !== ordinals[0])) {
    throw new RangeError('31.3: resource sources belong to different planet ordinals.');
  }
}

function preserveEvidence(
  context: HabitabilityEnvironmentContext31_2,
  prior: HabitabilityScenarioAssessment,
): HabitabilityEvidence[] {
  const entries: HabitabilityEvidence[] = [];
  for (const route of prior.routes) {
    if (route.route === 'ALTERNATIVE_CHEMISTRY') continue;
    for (const c of route.constraints) {
      if (c.verdict !== 'UNRESOLVED' && c.sourceKey !== null) {
        entries.push({ route: route.route, constraint: c.constraint,
          verdict: c.verdict, basis: c.basis, sourceKey: c.sourceKey,
          accessibleToObserver: context.perspective === 'OBSERVED_KNOWLEDGE' ||
            context.observerAccessibleEvidence.some((entry) =>
              entry.route === route.route && entry.constraint === c.constraint),
        });
      }
    }
  }
  return entries;
}

function hasResolvedSupport(
  prior: HabitabilityScenarioAssessment,
  route: HabitabilityRoute,
  constraint: HabitabilityConstraint,
): boolean {
  return prior.routes.find((r) => r.route === route)?.constraints
    .find((c) => c.constraint === constraint)?.verdict === 'SUPPORTS';
}

function add(
  evidence: HabitabilityEvidence[],
  context: HabitabilityEnvironmentContext31_2,
  route: HabitabilityRoute,
  constraint: HabitabilityConstraint,
  verdict: HabitabilityEvidenceVerdict,
  basis: 'PHYSICAL_MODEL' | 'INFERRED_MODEL',
  sourceKey: string,
): void {
  if (evidence.some((e) => e.route === route && e.constraint === constraint)) {
    throw new RangeError(`31.3: preexisting evidence cannot be overwritten: ${route}/${constraint}.`);
  }
  evidence.push({ route, constraint, verdict, basis, sourceKey,
    accessibleToObserver: context.observerAccessibleEvidence.some((entry) =>
      entry.route === route && entry.constraint === constraint),
  });
}

function output(
  context: HabitabilityEnvironmentContext31_2,
  prior: HabitabilityScenarioAssessment,
  evidence: HabitabilityEvidence[],
  diagnostics: HabitabilityResourceDiagnostics31_3,
): HabitabilityResourcesResult31_3 {
  return Object.freeze({
    assessment: HabitabilityEngine.evaluate({
      bodyKind: prior.bodyKind, bodyKey: context.bodyKey,
      multiplicity: context.multiplicity, perspective: context.perspective,
      time: context.time, evidence,
    }),
    // Never expose the raw simulated resource inventory in an observational
    // projection, even when one constraint has been approved for display.
    diagnostics: context.perspective === 'SIMULATED_REALITY'
      ? Object.freeze({ ...diagnostics }) : null,
  });
}

function requirePositive(v: number, label: string): void {
  if (!Number.isFinite(v) || v <= 0) throw new RangeError(`31.3: ${label} must be positive and finite.`);
}
function requireNonNegative(v: number, label: string): void {
  if (!Number.isFinite(v) || v < 0) throw new RangeError(`31.3: ${label} must be nonnegative and finite.`);
}
function checkIndex(v: number | null, label: string): void {
  if (v !== null && (!Number.isFinite(v) || v < 0 || v > 1)) {
    throw new RangeError(`31.3: ${label} must be a modeled index in [0, 1].`);
  }
}
