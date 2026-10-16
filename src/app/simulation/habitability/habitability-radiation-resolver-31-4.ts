import type {
  HabitabilityEvidence, HabitabilityRoute, HabitabilityScenarioAssessment,
} from '../../domain/habitability/habitability-scenario';
import { PlanetMagnetosphereRegime } from '../../domain/planetary/planet-magnetosphere-regime';
import { PlanetSurfaceRadiationRegime, planetSurfaceRadiationRegimeForIndex01 } from '../../domain/planetary/planet-surface-radiation-regime';
import { PlanetType } from '../../domain/planetary/planet-type';
import type { PlanetMagnetosphereState } from '../../domain/planetary/planet-magnetosphere-state';
import type { PlanetSurfaceRadiationState } from '../../domain/planetary/planet-surface-radiation-state';
import type { MoonEnvironmentState } from '../../domain/planetary/moon-environment-state';
import { HabitabilityEngine } from './habitability-engine';
import type { HabitabilityEnvironmentContext31_2 } from './habitability-environment-resolver-31-2';

/**
 * Phase 31.4 — read-only interpretation of the frozen 20.9/20.10 comparative
 * radiation proxies. There are no dose (Gy/Sv), UV spectrum, LET, organism
 * tolerances, radiolysis or penetration-depth calculations in these models.
 * In particular a model-derived magnetosphere is NOT a measured magnetosphere.
 *
 * Call after 31.3. 31.4 only supplies RADIATION_EXPOSURE evidence; it does
 * not create life, revise surface water, change the planetary radiation engine
 * or synthesize an unobserved lunar magnetic field.
 */
export type MagnetosphereKnowledge31_4 =
  'MEASURED' | 'INFERRED' | 'ABSENT' | 'NOT_EVALUABLE';

/** Explicit measurement furnished by the observation layer, never inferred
 * from CONFIRMED status, magnetosphere index or a rendered magnetic field. */
export interface MagnetosphereMeasurement31_4 {
  readonly detected: boolean;
  readonly sourceKey: string;
  readonly accessibleToObserver: true;
}

export type PlanetRadiationSource31_4 = Pick<PlanetSurfaceRadiationState,
  | 'planetOrdinal' | 'sourcePlanetType' | 'sourceRetainedSurfacePressurePascal'
  | 'sourceMagnetosphereRegime' | 'sourceMagnetosphericProtectionIndex01'
  | 'atmosphericRadiationShieldingIndex01' | 'magneticRadiationShieldingIndex01'
  | 'surfaceParticleRadiationExposureIndex01'
  | 'surfaceElectromagneticRadiationExposureIndex01'
  | 'surfaceRadiationExposureIndex01' | 'radiationRegime'
>;

export type PlanetMagneticSource31_4 = Pick<PlanetMagnetosphereState,
  'planetOrdinal' | 'magnetosphereRegime' | 'magnetosphericProtectionIndex01'
>;

export interface PlanetRadiationSources31_4 {
  readonly radiation?: PlanetRadiationSource31_4 | null;
  readonly magnetosphere?: PlanetMagneticSource31_4 | null;
  readonly measurement?: MagnetosphereMeasurement31_4 | null;
  /** Only for a cross-check with the same planet's 31.2/31.3 gas column. */
  readonly retainedPressurePascal?: number | null;
  readonly planetOrdinal: number;
}

export type MoonRadiationSource31_4 = Pick<MoonEnvironmentState,
  'hostPlanetOrdinal' | 'moonOrdinal' | 'atmosphereAssessment' | 'internalWaterAssessment'
>;

export interface MoonRadiationSources31_4 {
  readonly moon?: MoonRadiationSource31_4 | null;
  readonly measurement?: MagnetosphereMeasurement31_4 | null;
}

export interface HabitabilityRadiationDiagnostics31_4 {
  readonly magnetosphereKnowledge: MagnetosphereKnowledge31_4;
  /** NONE may be inferred or measured absent; no assumed physical field in tesla. */
  readonly magnetosphereRegime: PlanetMagnetosphereRegime | null;
  readonly magnetosphereBasis: 'DIRECT_OBSERVATION' | 'INFERRED_MODEL' | 'UNRESOLVED';
  readonly atmosphericShieldingIndex01: number | null;
  readonly magneticShieldingIndex01: number | null;
  readonly particleExposureIndex01: number | null;
  readonly electromagneticExposureIndex01: number | null;
  readonly surfaceExposureIndex01: number | null;
  readonly radiationRegime: PlanetSurfaceRadiationRegime | null;
  readonly subsurfaceShielding: 'CONDITIONAL_ICE_SHELL' | 'NOT_RESOLVED';
  readonly biologicalDoseResolved: false;
}

export interface HabitabilityRadiationResult31_4 {
  readonly assessment: HabitabilityScenarioAssessment;
  /** Only explicit measured magnetic evidence may appear in observed knowledge. */
  readonly observedMagnetosphere: Readonly<{
    knowledge: 'MEASURED' | 'ABSENT'; sourceKey: string;
  }> | null;
  /** No ground-truth diagnostics are projected into observed knowledge. */
  readonly diagnostics: HabitabilityRadiationDiagnostics31_4 | null;
}

const SURFACE: HabitabilityRoute = 'SURFACE_AQUEOUS';

export class HabitabilityRadiationResolver31_4 {
  private constructor() {}

  static assessPlanet(
    context: HabitabilityEnvironmentContext31_2,
    prior: HabitabilityScenarioAssessment,
    sources: PlanetRadiationSources31_4,
  ): HabitabilityRadiationResult31_4 {
    checkPrior(context, prior, 'PLANET');
    checkMeasurement(sources.measurement);
    checkPlanetSources(sources);
    const evidence = preserveEvidence(context, prior);
    const radiation = sources.radiation ?? null;
    const magnetosphere = sources.magnetosphere ?? null;
    const resolvedRegime = magnetosphere?.magnetosphereRegime ??
      radiation?.sourceMagnetosphereRegime ?? null;
    const knowledge = classifyMagnetosphere(resolvedRegime, sources.measurement);

    if (radiation && radiation.radiationRegime !== PlanetSurfaceRadiationRegime.DEEP_ENVELOPE &&
        radiation.surfaceRadiationExposureIndex01 !== null) {
      // 20.10 is a *comparative* proxy, not a life-tolerance or a biological dose.
      // Only its low-load families support an INFERRED relatively shielded
      // surface environment. HIGH/EXTREME never prove biological exclusion.
      if (radiation.radiationRegime === PlanetSurfaceRadiationRegime.MINIMAL ||
          radiation.radiationRegime === PlanetSurfaceRadiationRegime.LOW) {
        addRadiationEvidence(context, evidence,
          'INFERRED_MODEL', 'planet.20.10.surfaceRadiationRegime+particle+electromagnetic');
      }
    }

    return output(context, prior, evidence, sources.measurement ?? null, {
      magnetosphereKnowledge: knowledge,
      magnetosphereRegime: resolvedRegime,
      magnetosphereBasis: sources.measurement
        ? 'DIRECT_OBSERVATION' : resolvedRegime === null ? 'UNRESOLVED' : 'INFERRED_MODEL',
      atmosphericShieldingIndex01: radiation?.atmosphericRadiationShieldingIndex01 ?? null,
      magneticShieldingIndex01: radiation?.magneticRadiationShieldingIndex01 ?? null,
      particleExposureIndex01: radiation?.surfaceParticleRadiationExposureIndex01 ?? null,
      electromagneticExposureIndex01: radiation?.surfaceElectromagneticRadiationExposureIndex01 ?? null,
      surfaceExposureIndex01: radiation?.surfaceRadiationExposureIndex01 ?? null,
      radiationRegime: radiation?.radiationRegime ?? null,
      subsurfaceShielding: 'NOT_RESOLVED',
      biologicalDoseResolved: false,
    });
  }

  static assessMoon(
    context: HabitabilityEnvironmentContext31_2,
    prior: HabitabilityScenarioAssessment,
    sources: MoonRadiationSources31_4,
  ): HabitabilityRadiationResult31_4 {
    checkPrior(context, prior, 'MOON');
    checkMeasurement(sources.measurement);
    const moon = sources.moon ?? null;
    if (moon) {
      if (!Number.isInteger(moon.moonOrdinal) || moon.moonOrdinal <= 0 ||
          !Number.isInteger(moon.hostPlanetOrdinal) || moon.hostPlanetOrdinal <= 0) {
        throw new RangeError('31.4: invalid lunar ordinal or host planet ordinal.');
      }
      // Phase-21 charged-particle environment and host magnetic shielding are
      // unresolved. Conditional lunar gas columns are NOT shielding measurements.
      if (moon.atmosphereAssessment && (
        moon.atmosphereAssessment.chargedParticleEnvironment !== 'UNRESOLVED' ||
        moon.atmosphereAssessment.hostMagnetosphereShielding !== 'UNRESOLVED')) {
        throw new RangeError('31.4: unsupported lunar radiation-source contract.');
      }
      const shell = moon.internalWaterAssessment;
      if (shell) {
        checkNonNegativeOptional(shell.conductiveShellThicknessMinimumKilometers,
          'lunar conditional shell minimum');
        checkNonNegativeOptional(shell.conductiveShellThicknessMaximumKilometers,
          'lunar conditional shell maximum');
        if (shell.conductiveShellThicknessMinimumKilometers !== null &&
            shell.conductiveShellThicknessMaximumKilometers !== null &&
            shell.conductiveShellThicknessMinimumKilometers > shell.conductiveShellThicknessMaximumKilometers) {
          throw new RangeError('31.4: lunar shell-thickness bounds out of order.');
        }
      }
    }
    // Even a conditional kilometer-thick ice shell is not a measured ocean or
    // a calculated depth-dependent particle/UV attenuation. Leave BOTH routes
    // unresolved until an appropriate radiative transport model exists.
    return output(context, prior, preserveEvidence(context, prior), sources.measurement ?? null, {
      magnetosphereKnowledge: sources.measurement
        ? sources.measurement.detected ? 'MEASURED' : 'ABSENT' : 'NOT_EVALUABLE',
      magnetosphereRegime: null,
      magnetosphereBasis: sources.measurement ? 'DIRECT_OBSERVATION' : 'UNRESOLVED',
      atmosphericShieldingIndex01: null,
      magneticShieldingIndex01: null,
      particleExposureIndex01: null,
      electromagneticExposureIndex01: null,
      surfaceExposureIndex01: null,
      radiationRegime: null,
      subsurfaceShielding: moon?.internalWaterAssessment?.iceShellThermalRegime === 'CONDITIONAL_ICE_OCEAN'
        ? 'CONDITIONAL_ICE_SHELL' : 'NOT_RESOLVED',
      biologicalDoseResolved: false,
    });
  }
}

function classifyMagnetosphere(
  regime: PlanetMagnetosphereRegime | null,
  measurement: MagnetosphereMeasurement31_4 | null | undefined,
): MagnetosphereKnowledge31_4 {
  if (measurement) return measurement.detected ? 'MEASURED' : 'ABSENT';
  if (regime === null) return 'NOT_EVALUABLE';
  return regime === PlanetMagnetosphereRegime.NONE ? 'ABSENT' : 'INFERRED';
}

function checkMeasurement(
  measurement: MagnetosphereMeasurement31_4 | null | undefined,
): void {
  if (measurement === undefined || measurement === null) return;
  if (typeof measurement.detected !== 'boolean' ||
      measurement.accessibleToObserver !== true ||
      typeof measurement.sourceKey !== 'string' || measurement.sourceKey.trim() === '') {
    throw new RangeError('31.4: a measured magnetosphere requires an explicit, observer-accessible source.');
  }
}

function checkPlanetSources(sources: PlanetRadiationSources31_4): void {
  const radiation = sources.radiation ?? null;
  const mag = sources.magnetosphere ?? null;
  const ordinals = [sources.planetOrdinal, radiation?.planetOrdinal, mag?.planetOrdinal]
    .filter((n): n is number => n !== undefined && n !== null);
  if (ordinals.some((n) => !Number.isInteger(n) || n <= 0 || n !== ordinals[0])) {
    throw new RangeError('31.4: radiation and magnetic states must belong to the same planet.');
  }
  if (mag) {
    checkIndex(mag.magnetosphericProtectionIndex01, 'magnetospheric protection');
    if (!Object.values(PlanetMagnetosphereRegime).includes(mag.magnetosphereRegime)) {
      throw new RangeError('31.4: unknown magnetosphere regime.');
    }
    if (mag.magnetosphereRegime === PlanetMagnetosphereRegime.NONE &&
        mag.magnetosphericProtectionIndex01 !== 0) {
      throw new RangeError('31.4: absent magnetosphere cannot provide magnetic shielding.');
    }
  }
  if (radiation) {
    checkIndex(radiation.sourceMagnetosphericProtectionIndex01, 'source magnetic protection');
    for (const [name, value] of [
      ['atmospheric shielding', radiation.atmosphericRadiationShieldingIndex01],
      ['magnetic shielding', radiation.magneticRadiationShieldingIndex01],
      ['particle exposure', radiation.surfaceParticleRadiationExposureIndex01],
      ['electromagnetic exposure', radiation.surfaceElectromagneticRadiationExposureIndex01],
      ['surface exposure', radiation.surfaceRadiationExposureIndex01],
    ] as const) checkIndex(value, name);
    if (!Object.values(PlanetSurfaceRadiationRegime).includes(radiation.radiationRegime)) {
      throw new RangeError('31.4: unknown surface radiation regime.');
    }
    if (!Object.values(PlanetMagnetosphereRegime).includes(radiation.sourceMagnetosphereRegime)) {
      throw new RangeError('31.4: unknown magnetic regime.');
    }
    const values = [radiation.atmosphericRadiationShieldingIndex01,
      radiation.magneticRadiationShieldingIndex01,
      radiation.surfaceParticleRadiationExposureIndex01,
      radiation.surfaceElectromagneticRadiationExposureIndex01,
      radiation.surfaceRadiationExposureIndex01];
    const isDeepType = [PlanetType.MINI_NEPTUNE, PlanetType.GAS_GIANT, PlanetType.ICE_GIANT]
      .includes(radiation.sourcePlanetType);
    if (isDeepType !== (radiation.radiationRegime === PlanetSurfaceRadiationRegime.DEEP_ENVELOPE)) {
      throw new RangeError('31.4: radiation regime must respect the deep-envelope boundary.');
    }
    if (radiation.radiationRegime !== planetSurfaceRadiationRegimeForIndex01(
      radiation.surfaceRadiationExposureIndex01)) {
      throw new RangeError('31.4: radiation regime disagrees with modeled exposure.');
    }
    if (radiation.sourceMagnetosphereRegime === PlanetMagnetosphereRegime.NONE &&
        (radiation.sourceMagnetosphericProtectionIndex01 !== 0 ||
         radiation.magneticRadiationShieldingIndex01 !== null &&
         radiation.magneticRadiationShieldingIndex01 !== 0)) {
      throw new RangeError('31.4: absent magnetosphere cannot provide magnetic shielding.');
    }
    if (radiation.radiationRegime === PlanetSurfaceRadiationRegime.DEEP_ENVELOPE) {
      if (values.some((v) => v !== null) || radiation.sourceRetainedSurfacePressurePascal !== null) {
        throw new RangeError('31.4: deep envelopes have no modeled solid-surface radiation.');
      }
    } else if (values.some((v) => v === null) ||
               radiation.sourceRetainedSurfacePressurePascal === null) {
      throw new RangeError('31.4: solid surface radiation requires resolved shielding and exposure.');
    }
    checkNonNegativeOptional(radiation.sourceRetainedSurfacePressurePascal,
      'radiation source surface pressure');
    if (mag && (mag.magnetosphereRegime !== radiation.sourceMagnetosphereRegime ||
        Math.abs(mag.magnetosphericProtectionIndex01 -
          radiation.sourceMagnetosphericProtectionIndex01) > 1e-9)) {
      throw new RangeError('31.4: magnetosphere and radiation states are inconsistent.');
    }
    if (sources.retainedPressurePascal !== null && sources.retainedPressurePascal !== undefined &&
        radiation.sourceRetainedSurfacePressurePascal !== null &&
        Math.abs(sources.retainedPressurePascal - radiation.sourceRetainedSurfacePressurePascal) >
          1e-6 * Math.max(1, sources.retainedPressurePascal,
            radiation.sourceRetainedSurfacePressurePascal)) {
      throw new RangeError('31.4: radiation and 31.2 atmospheric pressures disagree.');
    }
  }
  checkNonNegativeOptional(sources.retainedPressurePascal, '31.2 retained pressure');
  const measurement = sources.measurement;
  if (measurement && (mag || radiation)) {
    const regime = mag?.magnetosphereRegime ?? radiation?.sourceMagnetosphereRegime;
    if (regime !== undefined && measurement.detected === (regime === PlanetMagnetosphereRegime.NONE)) {
      throw new RangeError('31.4: measured magnetic presence conflicts with simulated source.');
    }
  }
}

function checkIndex(value: number | null, name: string): void {
  if (value !== null && (!Number.isFinite(value) || value < 0 || value > 1)) {
    throw new RangeError(`31.4: ${name} must be a normalized comparative index.`);
  }
}
function checkNonNegativeOptional(value: number | null | undefined, name: string): void {
  if (value !== null && value !== undefined && (!Number.isFinite(value) || value < 0)) {
    throw new RangeError(`31.4: ${name} must be finite and nonnegative.`);
  }
}

function checkPrior(
  context: HabitabilityEnvironmentContext31_2,
  prior: HabitabilityScenarioAssessment,
  bodyKind: 'PLANET' | 'MOON',
): void {
  if (prior.bodyKind !== bodyKind || prior.bodyKey !== context.bodyKey ||
      prior.multiplicity !== context.multiplicity || prior.perspective !== context.perspective ||
      prior.contractVersion !== '31.1-CT0' || prior.time.kind !== context.time.kind ||
      prior.time.systemAgeBillionYears !== context.time.systemAgeBillionYears) {
    throw new RangeError('31.4: prior assessment must match body, time and perspective.');
  }
  if (prior.routes.some((route) => route.constraints.some((c) =>
    c.constraint === 'RADIATION_EXPOSURE' && c.verdict !== 'UNRESOLVED'))) {
    throw new RangeError('31.4: radiation evidence already resolved; refusing overwrite.');
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
            context.observerAccessibleEvidence.some((grant) =>
              grant.route === route.route && grant.constraint === c.constraint),
        });
      }
    }
  }
  return entries;
}

function addRadiationEvidence(
  context: HabitabilityEnvironmentContext31_2,
  evidence: HabitabilityEvidence[],
  basis: 'INFERRED_MODEL',
  sourceKey: string,
): void {
  evidence.push({ route: SURFACE, constraint: 'RADIATION_EXPOSURE',
    verdict: 'SUPPORTS', basis, sourceKey,
    accessibleToObserver: context.observerAccessibleEvidence.some((grant) =>
      grant.route === SURFACE && grant.constraint === 'RADIATION_EXPOSURE'),
  });
}

function output(
  context: HabitabilityEnvironmentContext31_2,
  prior: HabitabilityScenarioAssessment,
  evidence: HabitabilityEvidence[],
  measurement: MagnetosphereMeasurement31_4 | null,
  diagnostics: HabitabilityRadiationDiagnostics31_4,
): HabitabilityRadiationResult31_4 {
  return Object.freeze({
    assessment: HabitabilityEngine.evaluate({
      bodyKind: prior.bodyKind, bodyKey: context.bodyKey, multiplicity: context.multiplicity,
      perspective: context.perspective, time: context.time, evidence,
    }),
    observedMagnetosphere: context.perspective === 'OBSERVED_KNOWLEDGE' && measurement
      ? Object.freeze({ knowledge: measurement.detected ? 'MEASURED' as const : 'ABSENT' as const,
        sourceKey: measurement.sourceKey }) : null,
    diagnostics: context.perspective === 'SIMULATED_REALITY'
      ? Object.freeze({ ...diagnostics }) : null,
  });
}
