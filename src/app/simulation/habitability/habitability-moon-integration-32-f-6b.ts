import type {
  HabitabilityConstraint, HabitabilityEvidence, HabitabilityRoute,
  HabitabilityScenarioAssessment,
} from '../../domain/habitability/habitability-scenario';
import type { MoonOceanReality32F2c } from '../../domain/planetary/moon-ocean-reality-32-f-2c';
import type { MoonScientificResolvedTarget } from '../planetary/moon-scientific-target-resolver';
import { HabitabilityEnvironmentResolver31_2,
  type HabitabilityEnvironmentContext31_2, type MoonEnvironmentalSource31_2,
} from './habitability-environment-resolver-31-2';
import { HabitabilityMoonResolver31_10,
  type MoonHabitabilitySource31_10,
} from './habitability-moon-resolver-31-10';
import { HabitabilityEngine } from './habitability-engine';

const ROUTE = 'SUBSURFACE_AQUEOUS' as const;
const OCEAN_PROVENANCE = 'SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION';
type OceanState32F6b = MoonOceanReality32F2c['state'] | 'NOT_AVAILABLE';

export interface MoonHabitabilityPhysicsCoverage32F6b {
  readonly atmosphericColumn: 'INDEPENDENT_PHYSICAL_BALANCE' | 'CONDITIONAL_ONLY' | 'UNKNOWN';
  readonly photonProtection: 'REFERENCE_PRIMARY_GAMMA_NOT_DOSE' | 'UNKNOWN';
  readonly chemicalEnergy: 'THERMAL_ONLY_REACTANTS_UNRESOLVED' | 'UNKNOWN';
  readonly historicalIrradianceIntervals: number;
  readonly historicalOceanContinuityResolved: false;
}

export interface MoonHabitabilityIntegrationResult32F6b {
  readonly assessment: HabitabilityScenarioAssessment;
  /** Distinguish a real 31.10 invocation from a partial/legacy scientific DTO. */
  readonly usedMoonResolver31_10: boolean;
  /** A model state is not a statement about all possible solvents or life. */
  readonly ct0OceanState: OceanState32F6b;
  /** Read-only coverage, NEVER an observer DTO or biological judgement. */
  readonly physicalCoverage: MoonHabitabilityPhysicsCoverage32F6b | null;
}

/**
 * 32.F.6b — production crosswalk, WITHOUT new generators, numerical indices,
 * time extrapolation or a new life probability.
 *
 * 31.2 -> 31.10 are invoked on the SAME moon as the scientific fiche. 32.F.2c
 * can replace conditional C geometry/reservoir evidence, but 32.F.3 reference
 * photons are NOT dose, 32.F.4 thermal watts are NOT chemical free energy,
 * and 32.F.5a stellar history is NOT stable oceans or environments.
 *
 * This bridge returns scenario-only evidence. The caller MUST separately
 * authorize the scientific fiche before opening the target or calling it.
 */
export class HabitabilityMoonIntegration32F6b {
  private constructor() {}

  static assess(
    context: HabitabilityEnvironmentContext31_2,
    target: MoonScientificResolvedTarget,
  ): MoonHabitabilityIntegrationResult32F6b {
    const e = target.detail.environment;
    // 32.F.6b.b: the 31.12 observer must not promote a conditional
    // atmospheric scenario to a measured or mass-backed surface column,
    // even if a future consumer accidentally grants this constraint.
    // This does NOT affect the simulated-reality hypothesis or the separate
    // subsurface confinement supported by a constitutive CT-0 ocean.
    const effectiveContext: HabitabilityEnvironmentContext31_2 =
      context.perspective !== 'OBSERVED_KNOWLEDGE' ||
      HabitabilityMoonIntegration32F6b.hasPhysicalSurfacePressure32F1(target)
        ? context
        : { ...context, observerAccessibleEvidence: Object.freeze(
            context.observerAccessibleEvidence.filter(grant =>
              grant.route !== 'SURFACE_AQUEOUS' ||
              grant.constraint !== 'PRESSURE_OR_CONFINEMENT'),
          ) };
    const rawMoon: MoonEnvironmentalSource31_2 = {
      estimatedSurfaceTemperatureKelvin: e.estimatedSurfaceTemperatureKelvin,
      waterRegime: e.waterRegime as MoonEnvironmentalSource31_2['waterRegime'],
      atmosphereAssessment: e.atmosphereAssessment ?? null,
      internalWaterAssessment: e.internalWaterAssessment ?? null,
    };
    const prior = HabitabilityEnvironmentResolver31_2.assessMoon(effectiveContext, rawMoon);
    const source31_10 = completeSource31_10(target);
    const refined = source31_10 === null ? prior :
      HabitabilityMoonResolver31_10.assessMoon(effectiveContext, prior, source31_10).assessment;
    const ocean = validOcean(target);
    const coverage = inspectOtherPhysicalModels(target, ocean);
    const state: OceanState32F6b = ocean?.state ?? 'NOT_AVAILABLE';
    if (ocean === null || state === 'UNRESOLVED_IN_SIMULATED_MODEL') {
      return Object.freeze({ assessment: refined,
        usedMoonResolver31_10: source31_10 !== null, ct0OceanState: state,
        physicalCoverage: context.perspective === 'SIMULATED_REALITY' ? coverage : null });
    }

    // Remove the older conditional shell / geometry evidence only for the
    // actually resolved CT-0 phase. No duplicate constraints, no conflicting
    // conditional pressure asserted for an absent ocean.
    const evidence: HabitabilityEvidence[] = refined.routes.flatMap(route =>
      route.route === 'ALTERNATIVE_CHEMISTRY' ? [] : route.constraints.flatMap(c => {
        if (c.verdict === 'UNRESOLVED' || c.sourceKey === null ||
            route.route === ROUTE && (
              c.constraint === 'LIQUID_RESERVOIR' ||
              c.constraint === 'PRESSURE_OR_CONFINEMENT' ||
              c.constraint === 'RESERVOIR_GEOMETRY')) return [];
        return [{ route: route.route, constraint: c.constraint, verdict: c.verdict,
          basis: c.basis, sourceKey: c.sourceKey,
          accessibleToObserver: canObserve(effectiveContext, route.route, c.constraint) }];
      }));
    const present = state === 'PRESENT_IN_SIMULATED_MODEL';
    append(evidence, effectiveContext, 'LIQUID_RESERVOIR', present ? 'SUPPORTS' : 'CONTRADICTS',
      'moon.32F2c.simulatedOceanState');
    if (present) {
      // Presence means a constitutively modelled confined H2O layer, not a
      // verified environment for any biology or direct observation.
      append(evidence, effectiveContext, 'PRESSURE_OR_CONFINEMENT', 'SUPPORTS',
        'moon.32F2c.liquidLayerPressure');
      append(evidence, effectiveContext, 'RESERVOIR_GEOMETRY', 'SUPPORTS',
        'moon.32F2c.radialLayerGeometry');
    }
    return Object.freeze({
      assessment: HabitabilityEngine.evaluate({
        bodyKind: 'MOON', bodyKey: context.bodyKey, multiplicity: context.multiplicity,
        perspective: context.perspective, time: context.time,
        evidence: Object.freeze(evidence),
      }),
      usedMoonResolver31_10: source31_10 !== null, ct0OceanState: state,
      physicalCoverage: context.perspective === 'SIMULATED_REALITY' ? coverage : null,
    });
  }

  /**
   * A genuine 32.F.1 physical gas column is the ONLY lunar surface-pressure
   * source that 31.12 may treat as observer-accessible pressure evidence.
   * CT-0 ocean pressure is a DIFFERENT, subsurface constraint.
   * Keep all private mass/flux/source fields inside the bridge.
   */
  static hasPhysicalSurfacePressure32F1(target: MoonScientificResolvedTarget): boolean {
    const atmosphere = target.detail.environment.atmosphereAssessment;
    const balance = atmosphere?.physicalBalance32F1;
    return atmosphere?.pressureBasis === 'PHYSICAL_BALANCE' &&
      balance?.sourceKind === 'INDEPENDENT_MASS_AND_FLUXES' &&
      balance.interpretation === 'PHYSICAL_INTERVAL_MODEL_NOT_OBSERVATION' &&
      typeof balance.sourceId === 'string' && balance.sourceId.trim().length > 0 &&
      finitePositive(balance.durationSeconds) &&
      finiteNonNegative(balance.remainingGasMassKilograms) &&
      finiteNonNegative(balance.surfacePressurePascal) &&
      finiteNonNegative(atmosphere.estimatedSurfacePressurePascal) &&
      atmosphere.estimatedSurfacePressurePascal === balance.surfacePressurePascal &&
      Array.isArray(balance.gasResults) && balance.gasResults.length > 0;
  }

  /** Specific per-criterion grants, never an all-evidence authorization. */
  static ct0ObserverGrants(target: MoonScientificResolvedTarget):
    HabitabilityEnvironmentContext31_2['observerAccessibleEvidence'] {
    const ocean = validOcean(target);
    if (!ocean || ocean.state === 'UNRESOLVED_IN_SIMULATED_MODEL') return Object.freeze([]);
    const constraints: HabitabilityConstraint[] = ocean.state === 'PRESENT_IN_SIMULATED_MODEL'
      ? ['LIQUID_RESERVOIR', 'PRESSURE_OR_CONFINEMENT', 'RESERVOIR_GEOMETRY']
      : ['LIQUID_RESERVOIR'];
    return Object.freeze(constraints.map(constraint => Object.freeze({route: ROUTE, constraint})));
  }
}

function append(evidence: HabitabilityEvidence[], context: HabitabilityEnvironmentContext31_2,
  constraint: HabitabilityConstraint, verdict: 'SUPPORTS' | 'CONTRADICTS', sourceKey: string): void {
  evidence.push({ route: ROUTE, constraint, verdict, basis: 'PHYSICAL_MODEL', sourceKey,
    accessibleToObserver: canObserve(context, ROUTE, constraint) });
}
function canObserve(context: HabitabilityEnvironmentContext31_2,
  route: HabitabilityRoute,
  constraint: HabitabilityConstraint): boolean {
  return context.observerAccessibleEvidence.some(g =>
    g.route === route && g.constraint === constraint);
}
function completeSource31_10(target: MoonScientificResolvedTarget): MoonHabitabilitySource31_10 | null {
  const e = target.detail.environment;
  const g = target.detail.general;
  const tides = target.detail.tides;
  const identity = target.identity;
  // Legacy/partial scientific DTOs are still read-only, never rounded into
  // invented radii, ordinals, tide indices, or volatile concentrations.
  if (!g || !tides || !identity ||
      !Number.isInteger(identity.hostPlanetOrdinal) || identity.hostPlanetOrdinal < 1 ||
      !Number.isInteger(identity.moonOrdinal) || identity.moonOrdinal < 1 ||
      !finitePositive(g.radiusEarth) ||
      !finiteFraction(tides.tidalHeatingIndex01) ||
      !finiteFraction(e.waterInventoryIndex01) ||
      !finiteFraction(e.inferredIceRichnessIndex01) ||
      !finitePositive(e.estimatedSurfaceTemperatureKelvin)) return null;
  const physicalHostOrdinal = physicalHostPlanetOrdinal(target);
  if (physicalHostOrdinal === null) return null;
  return {
    hostPlanetOrdinal: physicalHostOrdinal, moonOrdinal: identity.moonOrdinal,
    sourceMoonRadiusEarth: g.radiusEarth,
    estimatedSurfaceTemperatureKelvin: e.estimatedSurfaceTemperatureKelvin,
    waterInventoryIndex01: e.waterInventoryIndex01,
    inferredIceRichnessIndex01: e.inferredIceRichnessIndex01,
    sourceTidalHeatingIndex01: tides.tidalHeatingIndex01,
    waterRegime: e.waterRegime as MoonHabitabilitySource31_10['waterRegime'],
    atmosphereAssessment: e.atmosphereAssessment ?? null,
    internalWaterAssessment: e.internalWaterAssessment ?? null,
  };
}
/** A public multihost planet number is NOT the ordinal of the physical
 * child-system moon. Only the atomic multihost resolver can provide that
 * private physical lineage; ordinary SINGLE and legacy fixtures use the
 * canonical host ordinal. Do not derive this from the ocean being validated.
 */
function physicalHostPlanetOrdinal(target: MoonScientificResolvedTarget): number | null {
  const source = target.physicalHostPlanetOrdinal;
  if (source === undefined) {
    // Partial/legacy observed DTOs may omit identity. Absence is unknown, not
    // ordinal zero and never evidence for an unrelated physical source.
    const host = target.identity?.hostPlanetOrdinal;
    return typeof host === 'number' && Number.isSafeInteger(host) && host >= 1 ? host : null;
  }
  if (!Number.isSafeInteger(source) || source < 1) {
    throw new RangeError('32.F.6b: invalid physical host planet ordinal.');
  }
  return source;
}

function validOcean(target: MoonScientificResolvedTarget): MoonOceanReality32F2c | null {
  const m = target.detail.environment.oceanReality32F2c;
  if (!m || m.provenance !== OCEAN_PROVENANCE ||
      m.contractVersion !== '32.F.2c-seeded-interior-ocean-model-v1') return null;
  const identity = target.identity;
  const physicalHostOrdinal = physicalHostPlanetOrdinal(target);
  if (!identity || physicalHostOrdinal === null) return null;
  if (identity && ((Number.isInteger(physicalHostOrdinal) &&
      physicalHostOrdinal !== m.hostPlanetOrdinal) ||
      (Number.isInteger(identity.moonOrdinal) && identity.moonOrdinal !== m.moonOrdinal))) {
    throw new RangeError('32.F.6b: moon/ocean identities differ; refuse physical evidence.');
  }
  if (m.state !== 'PRESENT_IN_SIMULATED_MODEL' &&
      m.state !== 'ABSENT_IN_SIMULATED_MODEL' &&
      m.state !== 'UNRESOLVED_IN_SIMULATED_MODEL') return null;
  if (m.state === 'PRESENT_IN_SIMULATED_MODEL') {
    if (!finitePositive(m.liquidLayerThicknessKilometers) ||
        !finitePositive(m.simulatedLiquidWaterMassKilograms) ||
        !finiteNonNegative(m.iceCoverThicknessKilometers) ||
        !finitePositive(m.waterInventoryKilograms) ||
        !finiteNonNegative(m.simulatedSolidWaterMassKilograms) ||
        !finiteNonNegative(m.pressureAtWaterShellBasePascal) ||
        !Array.isArray(m.radialLayers)) return null;
    const total = m.simulatedLiquidWaterMassKilograms + m.simulatedSolidWaterMassKilograms;
    if (Math.abs(total - m.waterInventoryKilograms) > 1e-5 * m.waterInventoryKilograms) {
      throw new RangeError('32.F.6b: non-conserved CT-0 water inventory.');
    }
  }
  return m;
}
function finitePositive(x: number | null | undefined): x is number {
  return x !== null && x !== undefined && Number.isFinite(x) && x > 0;
}
function finiteNonNegative(x: number | null | undefined): x is number {
  return x !== null && x !== undefined && Number.isFinite(x) && x >= 0;
}
function finiteFraction(x: number | null | undefined): x is number {
  return finiteNonNegative(x) && x <= 1;
}

/** Inspect *separate* contracts without promoting them to evidence of life.
 * Physical dose, chemical Gibbs energy and past continuity are absent in
 * present 32.F models. In particular zero modelled photo transmission is not
 * zero radiation dose, heat is not a food source, and dated irradiance is not
 * dated hydrology or dynamical persistence.
 */
function inspectOtherPhysicalModels(target: MoonScientificResolvedTarget,
  ocean: MoonOceanReality32F2c | null): MoonHabitabilityPhysicsCoverage32F6b {
  const e = target.detail.environment;
  const identity = target.identity;
  const physicalHostOrdinal = physicalHostPlanetOrdinal(target);
  for (const [name, model] of [
    ['radiation', e.radiationProtection32F3],
    ['chemistry', e.geochemicalEnergy32F4],
    ['history', e.environmentalHistory32F5],
  ] as const) {
    if (!model || !identity) continue;
    if ((Number.isInteger(physicalHostOrdinal) &&
         model.hostPlanetOrdinal !== physicalHostOrdinal) ||
        (Number.isInteger(identity.moonOrdinal) &&
         model.moonOrdinal !== identity.moonOrdinal)) {
      throw new RangeError(`32.F.6b: ${name} model and lunar identity differ.`);
    }
  }
  const a = e.atmosphereAssessment;
  const physicalAtmosphere = HabitabilityMoonIntegration32F6b.hasPhysicalSurfacePressure32F1(target);
  const r = e.radiationProtection32F3;
  const radiationReference = r?.provenance ===
    'V2_BOLOMETRIC_AND_CT0_GEOMETRY_WITH_NIST_PHOTON_REFERENCE' &&
    r.contractVersion === '32.F.3-source-separated-photon-transfer-v1' &&
    r.surfaceIonisingDoseGrayPerYear === null &&
    r.subsurfaceIonisingDoseGrayPerYear === null;
  const c = e.geochemicalEnergy32F4;
  const chemistry = c?.provenance ===
    'CT0_PHASE_AND_THERMAL_MODEL_WITH_UNIDENTIFIED_REACTANTS' &&
    c.contractVersion === '32.F.4-chemical-constraints-and-thermal-gradients-v1' &&
    c.actualChemicalPowerWatts === null && c.actualChemicalDisequilibriumJoulesPerMole === null;
  if (chemistry && ocean && (
    ocean.state === 'PRESENT_IN_SIMULATED_MODEL' && c!.solventState !== 'MODELLED_LIQUID_H2O_CT0' ||
    ocean.state === 'ABSENT_IN_SIMULATED_MODEL' && c!.solventState === 'MODELLED_LIQUID_H2O_CT0')) {
    throw new RangeError('32.F.6b: CT-0 water phase and geochemical solvent disagree.');
  }
  const h = e.environmentalHistory32F5;
  const validHistory = h?.provenance ===
    'RETAINED_V2_DATED_IRRADIANCE_AND_INDEPENDENT_LUNAR_SOURCES' &&
    h.contractVersion === '32.F.5-dated-lunar-environment-v1';
  if (validHistory && ocean && (
    ocean.state === 'PRESENT_IN_SIMULATED_MODEL' && h!.currentOceanStateCT0 !== 'PRESENT' ||
    ocean.state === 'ABSENT_IN_SIMULATED_MODEL' && h!.currentOceanStateCT0 !== 'ABSENT')) {
    throw new RangeError('32.F.6b: current ocean and dated history snapshot disagree.');
  }
  return Object.freeze({
    atmosphericColumn: physicalAtmosphere ? 'INDEPENDENT_PHYSICAL_BALANCE'
      : a?.pressureBasis === 'CONDITIONAL_SCENARIO' ? 'CONDITIONAL_ONLY' : 'UNKNOWN',
    photonProtection: radiationReference ? 'REFERENCE_PRIMARY_GAMMA_NOT_DOSE' : 'UNKNOWN',
    chemicalEnergy: chemistry ? 'THERMAL_ONLY_REACTANTS_UNRESOLVED' : 'UNKNOWN',
    historicalIrradianceIntervals: validHistory &&
      Number.isInteger(h?.datedIrradianceIntervalCount) && h!.datedIrradianceIntervalCount > 0
      ? h!.datedIrradianceIntervalCount : 0,
    historicalOceanContinuityResolved: false as const,
  });
}
