import type {
  HabitabilityEvidence,
  HabitabilityScenarioAssessment,
} from '../../domain/habitability/habitability-scenario';
import type { MoonEnvironmentState } from '../../domain/planetary/moon-environment-state';
import type { MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { HabitabilityEngine } from './habitability-engine';
import type { HabitabilityEnvironmentContext31_2 } from './habitability-environment-resolver-31-2';

/**
 * 31.10 — read-only lunar scenario refinement after 31.2–31.5, before 31.6.
 *
 * C's bounded eccentricity-tide calculation is a CONDITIONAL conductive-shell
 * scenario, not a measured shell thickness, subsurface ocean, brine chemistry,
 * or radiogenic heat flow. Legacy 21.6 indices are never used as observations.
 *
 * The C model tests geometric feasibility against 0.35 moon radii; 31.10
 * applies that same existing scenario bound, not a new planet/moon generator.
 */
export type MoonHabitabilitySource31_10 = Pick<MoonEnvironmentState,
  | 'hostPlanetOrdinal' | 'moonOrdinal' | 'sourceMoonRadiusEarth'
  | 'estimatedSurfaceTemperatureKelvin' | 'waterInventoryIndex01'
  | 'inferredIceRichnessIndex01' | 'sourceTidalHeatingIndex01'
  | 'waterRegime' | 'atmosphereAssessment' | 'internalWaterAssessment'
>;

export type MoonIceOceanScenarioStatus31_10 =
  | 'CONDITIONAL_GEOMETRY_ADMISSIBLE'
  | 'CONDITIONAL_GEOMETRY_UNRESOLVED'
  | 'OUTSIDE_CURRENT_C_GEOMETRY_BOUNDS'
  | 'NOT_SUPPORTED_BY_CURRENT_C_SCENARIO'
  | 'NOT_EVALUABLE';

export interface MoonHabitabilityDiagnostics31_10 {
  readonly iceOceanScenario: MoonIceOceanScenarioStatus31_10;
  readonly iceShellThermalRegime: MoonInternalWaterAssessment['iceShellThermalRegime'] | null;
  /** Model-derived opportunity only. Not a detected water reservoir. */
  readonly volatileInventory: 'MODELED_ICE_WATER_OPPORTUNITY' | 'INVENTORY_LIMITED' | 'NOT_RESOLVED';
  readonly estimatedSurfacePressurePascal: number | null;
  readonly atmosphericPressureBasis: 'CONDITIONAL_SCENARIO' | 'UNRESOLVED';
  readonly geometry: 'ADMISSIBLE_WITHIN_C_BOUNDS' | 'OUTSIDE_C_BOUNDS' | 'NOT_RESOLVED';
  /** Conservative geometrical ceiling of the existing C calculation. */
  readonly maximumGeometricShellKilometers: number | null;
  /** These are scenario equilibrium ranges, NOT measured shell depths. */
  readonly conditionalShellMinimumKilometers: number | null;
  readonly conditionalShellMaximumKilometers: number | null;
  /** A bounded tidal source cannot establish bioavailable gradients. */
  readonly conditionalTidalFluxMinimumWattsPerSquareMeter: number | null;
  readonly conditionalTidalFluxMaximumWattsPerSquareMeter: number | null;
  readonly oceanConfirmed: false;
  readonly internalLiquidPressureResolved: false;
  readonly salinityResolved: false;
  readonly radiogenicHeatResolved: false;
  readonly accessibleChemistryResolved: false;
  readonly biologicalEnergyResolved: false;
  readonly irradiationPenetrationResolved: false;
  readonly historicalOceanContinuityResolved: false;
}

export interface MoonHabitabilityResult31_10 {
  readonly assessment: HabitabilityScenarioAssessment;
  /** Internal numerical diagnostics must not leak into observed knowledge. */
  readonly diagnostics: MoonHabitabilityDiagnostics31_10 | null;
}

const EARTH_RADIUS_KM = 6371;
const C_GEOMETRY_CEILING_RADIUS_FRACTION = 0.35;
const SURFACE_ICE_FREEZING_K = 273.15;
const C_VOLATILE_INVENTORY_THRESHOLD = 0.08;
const SUBSURFACE = 'SUBSURFACE_AQUEOUS' as const;

export class HabitabilityMoonResolver31_10 {
  private constructor() {}

  static assessMoon(
    context: HabitabilityEnvironmentContext31_2,
    prior: HabitabilityScenarioAssessment,
    moon: MoonHabitabilitySource31_10 | null,
  ): MoonHabitabilityResult31_10 {
    checkPrior(context, prior);
    const evidence = preserveEvidence(context, prior);
    if (moon === null) return result(context, prior, evidence, emptyDiagnostics());

    validateMoon(moon);
    const internal = moon.internalWaterAssessment;
    const geometryCeiling = C_GEOMETRY_CEILING_RADIUS_FRACTION *
      EARTH_RADIUS_KM * moon.sourceMoonRadiusEarth;
    const shellMinimum = internal?.conductiveShellThicknessMinimumKilometers ?? null;
    const shellMaximum = internal?.conductiveShellThicknessMaximumKilometers ?? null;
    const boundedOcean = internal?.iceShellThermalRegime === 'CONDITIONAL_ICE_OCEAN';
    // Both conductive-shell bounds are reference *scenarios*; there is no
    // observed shell thickness. Zero-minimum cannot demonstrate a confined lid.
    const geometricOpportunity = boundedOcean && shellMinimum !== null &&
      shellMaximum !== null && shellMinimum > 0 && shellMaximum >= shellMinimum &&
      shellMinimum <= geometryCeiling &&
      moon.estimatedSurfaceTemperatureKelvin < SURFACE_ICE_FREEZING_K;
    const geometry = !boundedOcean || shellMinimum === null || shellMaximum === null ||
      shellMinimum === 0 ? 'NOT_RESOLVED'
      : shellMinimum <= geometryCeiling ? 'ADMISSIBLE_WITHIN_C_BOUNDS'
      : 'OUTSIDE_C_BOUNDS';
    const iceOceanScenario: MoonIceOceanScenarioStatus31_10 = !internal ||
      internal.iceShellThermalRegime === 'NOT_EVALUABLE_HIGH_ECCENTRICITY' ||
      internal.iceShellThermalRegime === 'NOT_EVALUABLE_NON_SYNCHRONOUS'
      ? 'NOT_EVALUABLE'
      : boundedOcean ? geometricOpportunity
        ? 'CONDITIONAL_GEOMETRY_ADMISSIBLE'
        : geometry === 'OUTSIDE_C_BOUNDS'
          ? 'OUTSIDE_CURRENT_C_GEOMETRY_BOUNDS'
          : 'CONDITIONAL_GEOMETRY_UNRESOLVED'
      : 'NOT_SUPPORTED_BY_CURRENT_C_SCENARIO';

    // A geometrically possible conductive water-ice lid may support the
    // *candidate* confinement and geometry constraints as INFERRED evidence.
    // It NEVER supports LIQUID_RESERVOIR (oceanConfirmed is always false),
    // ENERGY_GRADIENT (usable chemical disequilibrium unresolved), or
    // RADIATION_EXPOSURE (penetration depth unresolved in 31.4).
    if (geometricOpportunity) {
      add(context, evidence, 'RESERVOIR_GEOMETRY',
        'moon.C.conditionalConductiveIceShell.geometry');
      add(context, evidence, 'PRESSURE_OR_CONFINEMENT',
        'moon.C.conditionalConductiveIceShell.confinement');
    }

    const atmosphericPressure = moon.atmosphereAssessment?.pressureBasis === 'CONDITIONAL_SCENARIO'
      ? moon.atmosphereAssessment.estimatedSurfacePressurePascal : null;
    return result(context, prior, evidence, Object.freeze({
      iceOceanScenario,
      iceShellThermalRegime: internal?.iceShellThermalRegime ?? null,
      volatileInventory: moon.waterInventoryIndex01 >= C_VOLATILE_INVENTORY_THRESHOLD &&
        moon.inferredIceRichnessIndex01 >= C_VOLATILE_INVENTORY_THRESHOLD
        ? 'MODELED_ICE_WATER_OPPORTUNITY'
        : 'INVENTORY_LIMITED',
      estimatedSurfacePressurePascal: atmosphericPressure ?? null,
      atmosphericPressureBasis: moon.atmosphereAssessment?.pressureBasis ?? 'UNRESOLVED',
      geometry,
      maximumGeometricShellKilometers: geometryCeiling,
      conditionalShellMinimumKilometers: shellMinimum,
      conditionalShellMaximumKilometers: shellMaximum,
      conditionalTidalFluxMinimumWattsPerSquareMeter:
        internal?.tidalHeatFluxMinimumWattsPerSquareMeter ?? null,
      conditionalTidalFluxMaximumWattsPerSquareMeter:
        internal?.tidalHeatFluxMaximumWattsPerSquareMeter ?? null,
      oceanConfirmed: false as const,
      internalLiquidPressureResolved: false as const,
      salinityResolved: false as const,
      radiogenicHeatResolved: false as const,
      accessibleChemistryResolved: false as const,
      biologicalEnergyResolved: false as const,
      irradiationPenetrationResolved: false as const,
      historicalOceanContinuityResolved: false as const,
    }));
  }
}

function checkPrior(
  context: HabitabilityEnvironmentContext31_2,
  prior: HabitabilityScenarioAssessment,
): void {
  if (!prior || prior.bodyKind !== 'MOON' || prior.bodyKey !== context.bodyKey ||
      prior.multiplicity !== context.multiplicity ||
      prior.perspective !== context.perspective ||
      prior.contractVersion !== '31.1-CT0' ||
      prior.time.kind !== context.time.kind ||
      prior.time.systemAgeBillionYears !== context.time.systemAgeBillionYears) {
    throw new RangeError('31.10: prior CT-0 assessment must refer to the same moon and perspective.');
  }
  const previous = prior.routes.find((r) => r.route === SUBSURFACE);
  if (!previous || previous.constraints.some((constraint) =>
      (constraint.constraint === 'RESERVOIR_GEOMETRY' ||
       constraint.constraint === 'PRESSURE_OR_CONFINEMENT') &&
      constraint.verdict !== 'UNRESOLVED')) {
    throw new RangeError('31.10: cannot overwrite prior lunar geometry or confinement evidence.');
  }
}

function validateMoon(moon: MoonHabitabilitySource31_10): void {
  for (const [label, ordinal] of [
    ['hostPlanetOrdinal', moon.hostPlanetOrdinal],
    ['moonOrdinal', moon.moonOrdinal],
  ] as const) {
    if (!Number.isInteger(ordinal) || ordinal < 1) {
      throw new RangeError(`31.10: invalid ${label}.`);
    }
  }
  positive(moon.sourceMoonRadiusEarth, 'moon radius');
  positive(moon.estimatedSurfaceTemperatureKelvin, 'surface temperature');
  fraction(moon.waterInventoryIndex01, 'water inventory proxy');
  fraction(moon.inferredIceRichnessIndex01, 'ice richness proxy');
  fraction(moon.sourceTidalHeatingIndex01, 'tidal index');
  if (!Object.values(MoonWaterRegime).includes(moon.waterRegime)) {
    throw new RangeError('31.10: unknown lunar water regime.');
  }

  const atmosphere = moon.atmosphereAssessment;
  if (atmosphere) {
    if (atmosphere.pressureBasis !== 'CONDITIONAL_SCENARIO' &&
        atmosphere.pressureBasis !== 'UNRESOLVED') {
      throw new RangeError('31.10: invalid lunar atmosphere pressure basis.');
    }
    const pressure = atmosphere.estimatedSurfacePressurePascal;
    if (pressure !== null) nonnegative(pressure, 'conditional lunar surface pressure');
    if ((atmosphere.pressureBasis === 'UNRESOLVED') !== (pressure === null)) {
      throw new RangeError('31.10: pressure basis and conditional gas column must agree.');
    }
    if (atmosphere.chargedParticleEnvironment !== 'UNRESOLVED' ||
        atmosphere.hostMagnetosphereShielding !== 'UNRESOLVED') {
      throw new RangeError('31.10: 21.B lunar particle and host-field environments are unresolved.');
    }
  }
  const internal = moon.internalWaterAssessment;
  if (internal === null) return; // Legacy fixture/knowledge: never make a positive C claim.
  if (internal.basis !== 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO' ||
      internal.oceanConfirmed !== false || internal.radiogenicHeatResolved !== false) {
    throw new RangeError('31.10: lunar C only supports unconfirmed eccentricity-tide scenarios.');
  }
  const validRegimes = [
    'NOT_EVALUABLE_HIGH_ECCENTRICITY', 'NOT_EVALUABLE_NON_SYNCHRONOUS',
    'NO_STABLE_SURFACE_ICE', 'ICE_INVENTORY_LIMITED',
    'TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO', 'CONDITIONAL_ICE_OCEAN',
    'HIGH_TIDAL_FLUX_SCENARIO',
  ] as const;
  if (!validRegimes.includes(internal.iceShellThermalRegime)) {
    throw new RangeError('31.10: invalid C-layer ice-shell thermal regime.');
  }
  const minFlux = internal.tidalHeatFluxMinimumWattsPerSquareMeter;
  const maxFlux = internal.tidalHeatFluxMaximumWattsPerSquareMeter;
  const minShell = internal.conductiveShellThicknessMinimumKilometers;
  const maxShell = internal.conductiveShellThicknessMaximumKilometers;
  for (const [label, value] of [
    ['tidal flux minimum', minFlux], ['tidal flux maximum', maxFlux],
    ['conductive ice shell minimum', minShell], ['conductive ice shell maximum', maxShell],
  ] as const) {
    if (value !== null) nonnegative(value, label);
  }
  if ((minFlux === null) !== (maxFlux === null) ||
      (minShell === null) !== (maxShell === null) ||
      minFlux !== null && maxFlux !== null && minFlux > maxFlux ||
      minShell !== null && maxShell !== null && minShell > maxShell) {
    throw new RangeError('31.10: incomplete, inverted or nonphysical tidal/shell bounds.');
  }
  if (internal.iceShellThermalRegime === 'CONDITIONAL_ICE_OCEAN' && (
      moon.estimatedSurfaceTemperatureKelvin >= SURFACE_ICE_FREEZING_K ||
      moon.waterInventoryIndex01 < C_VOLATILE_INVENTORY_THRESHOLD ||
      moon.inferredIceRichnessIndex01 < C_VOLATILE_INVENTORY_THRESHOLD)) {
    throw new RangeError('31.10: conditional ice ocean requires a frozen surface and modeled volatiles.');
  }
  if ((internal.iceShellThermalRegime === 'NOT_EVALUABLE_HIGH_ECCENTRICITY' ||
       internal.iceShellThermalRegime === 'NOT_EVALUABLE_NON_SYNCHRONOUS') &&
      (minFlux !== null || minShell !== null)) {
    throw new RangeError('31.10: non-evaluable C tide scenarios cannot carry calculated flux or shell.');
  }
  if (internal.iceShellThermalRegime === 'NO_STABLE_SURFACE_ICE' &&
      moon.estimatedSurfaceTemperatureKelvin < SURFACE_ICE_FREEZING_K) {
    throw new RangeError('31.10: the C no-ice regime conflicts with a subfreezing surface.');
  }
}

function preserveEvidence(
  context: HabitabilityEnvironmentContext31_2,
  prior: HabitabilityScenarioAssessment,
): HabitabilityEvidence[] {
  const evidence: HabitabilityEvidence[] = [];
  for (const route of prior.routes) {
    if (route.route === 'ALTERNATIVE_CHEMISTRY') continue;
    for (const c of route.constraints) {
      if (c.verdict !== 'UNRESOLVED' && c.sourceKey !== null) {
        evidence.push({
          route: route.route, constraint: c.constraint, verdict: c.verdict,
          basis: c.basis, sourceKey: c.sourceKey,
          accessibleToObserver: context.perspective === 'OBSERVED_KNOWLEDGE' ||
            context.observerAccessibleEvidence.some((grant) =>
              grant.route === route.route && grant.constraint === c.constraint),
        });
      }
    }
  }
  return evidence;
}

function add(
  context: HabitabilityEnvironmentContext31_2,
  evidence: HabitabilityEvidence[],
  constraint: 'RESERVOIR_GEOMETRY' | 'PRESSURE_OR_CONFINEMENT',
  sourceKey: string,
): void {
  evidence.push({
    route: SUBSURFACE, constraint, verdict: 'SUPPORTS', basis: 'INFERRED_MODEL',
    sourceKey,
    accessibleToObserver: context.observerAccessibleEvidence.some((grant) =>
      grant.route === SUBSURFACE && grant.constraint === constraint),
  });
}

function result(
  context: HabitabilityEnvironmentContext31_2,
  prior: HabitabilityScenarioAssessment,
  evidence: HabitabilityEvidence[],
  diagnostics: MoonHabitabilityDiagnostics31_10,
): MoonHabitabilityResult31_10 {
  return Object.freeze({
    assessment: HabitabilityEngine.evaluate({
      bodyKind: 'MOON', bodyKey: context.bodyKey,
      multiplicity: context.multiplicity, perspective: context.perspective,
      time: context.time, evidence,
    }),
    diagnostics: context.perspective === 'SIMULATED_REALITY' ? diagnostics : null,
  });
}

function emptyDiagnostics(): MoonHabitabilityDiagnostics31_10 {
  return Object.freeze({
    iceOceanScenario: 'NOT_EVALUABLE', iceShellThermalRegime: null,
    volatileInventory: 'NOT_RESOLVED', estimatedSurfacePressurePascal: null,
    atmosphericPressureBasis: 'UNRESOLVED', geometry: 'NOT_RESOLVED',
    maximumGeometricShellKilometers: null,
    conditionalShellMinimumKilometers: null, conditionalShellMaximumKilometers: null,
    conditionalTidalFluxMinimumWattsPerSquareMeter: null,
    conditionalTidalFluxMaximumWattsPerSquareMeter: null,
    oceanConfirmed: false, internalLiquidPressureResolved: false,
    salinityResolved: false, radiogenicHeatResolved: false,
    accessibleChemistryResolved: false, biologicalEnergyResolved: false,
    irradiationPenetrationResolved: false, historicalOceanContinuityResolved: false,
  });
}

function positive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`31.10: ${label} must be finite and positive.`);
  }
}
function nonnegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`31.10: ${label} must be finite and nonnegative.`);
  }
}
function fraction(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`31.10: ${label} must be a finite fraction in [0,1].`);
  }
}
