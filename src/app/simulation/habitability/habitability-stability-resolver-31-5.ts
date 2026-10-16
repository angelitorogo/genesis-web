import type {
  HabitabilityEvidence, HabitabilityEvidenceVerdict, HabitabilityRoute,
  HabitabilityScenarioAssessment,
} from '../../domain/habitability/habitability-scenario';
import type { StellarRotationStabilityProfile } from '../../domain/stellar/stellar-rotation-stability-profile';
import { StellarStabilityRegime } from '../../domain/stellar/stellar-stability-regime';
import type { PlanetarySystemStabilityAssessment } from '../../domain/planetary/planetary-system-stability-assessment';
import { PlanetarySystemStabilityRegime } from '../../domain/planetary/planetary-system-stability-regime';
import { PlanetaryOrbitalPairStabilityRegime } from '../../domain/planetary/planetary-orbital-pair-stability-regime';
import { PlanetarySystemOrbitTopology } from '../../domain/planetary/planetary-system-orbit-topology';
import type { PlanetClimateVariabilityState } from '../../domain/planetary/planet-climate-variability-state';
import {
  PlanetClimateStabilityRegime, planetClimateStabilityRegimeForIndex01,
} from '../../domain/planetary/planet-climate-stability-regime';
import { HabitabilityEngine } from './habitability-engine';
import type { HabitabilityEnvironmentContext31_2 } from './habitability-environment-resolver-31-2';

/**
 * 31.5: CURRENT CT-0 stability proxies, not a reconstruction of historical
 * continuity, a long-term N-body simulation, or proof of biological tolerance.
 * Sources come from 15.5, 18.5, 20.6 and, only when explicitly resolved and
 * scoped to this body, the phase-29 event adapter. This module is read-only.
 */
export type StellarStabilitySource31_5 = Pick<StellarRotationStabilityProfile,
  'ordinaryRotationModelApplicable' | 'stabilityIndex' | 'stabilityRegime'>;

export interface StellarHostStability31_5 {
  readonly hostKey: string;
  readonly rotation: StellarStabilitySource31_5 | null;
}

export type PlanetOrbitalStabilitySource31_5 = Pick<PlanetarySystemStabilityAssessment,
  | 'regime' | 'planetCount' | 'orbitTopology' | 'pairAssessments'
  | 'innerBoundaryClearanceAu' | 'outerBoundaryClearanceAu'>;

export type PlanetClimateStabilitySource31_5 = Pick<PlanetClimateVariabilityState,
  'planetOrdinal' | 'stabilityIndex01' | 'stabilityRegime'>;

/** No transients are synthesized from star class, seed, or stellar age. */
export type TransientCoverage31_5 =
  'NOT_ASSESSED' | 'PARTIAL_CURRENT_EPOCH' | 'COMPLETE_CURRENT_EPOCH';
export type TransientKind31_5 =
  'SUPERNOVA' | 'NOVA' | 'KILONOVA' | 'GAMMA_RAY_BURST' |
  'STELLAR_FLARE' | 'STELLAR_OUTBURST' | 'IMPACT' | 'OTHER';
export interface ScopedTransient31_5 {
  readonly eventKey: string;
  /** Explicit association from the events/observation integration layer. */
  readonly affectedBodyKey: string;
  readonly kind: TransientKind31_5;
  readonly epoch: 'CURRENT' | 'HISTORICAL';
  /** A candidate is not a known environmental consequence. */
  readonly effect: 'RESOLVED_ENVIRONMENTAL_DISRUPTION' | 'POTENTIAL_FORCING' | 'UNRESOLVED';
}
export interface TransientStabilitySources31_5 {
  /** Explicit provenance of search/completeness; absence of events is NOT completeness. */
  readonly coverage: TransientCoverage31_5;
  readonly events: readonly ScopedTransient31_5[];
}

export interface PlanetStabilitySources31_5 {
  readonly planetOrdinal: number;
  readonly stellarHosts?: readonly StellarHostStability31_5[] | null;
  readonly orbital?: PlanetOrbitalStabilitySource31_5 | null;
  readonly climate?: PlanetClimateStabilitySource31_5 | null;
  readonly transients?: TransientStabilitySources31_5 | null;
}
export interface MoonStabilitySources31_5 {
  readonly hostPlanetOrdinal: number;
  readonly moonOrdinal: number;
  readonly stellarHosts?: readonly StellarHostStability31_5[] | null;
  readonly transients?: TransientStabilitySources31_5 | null;
}

export interface HabitabilityStabilityDiagnostics31_5 {
  readonly stellarBaseline: 'STABLE_PROXY' | 'VARIABLE_PROXY' | 'NOT_RESOLVED';
  readonly orbitalBaseline: 'STABLE_PROXY' | 'MARGINAL_OR_UNRESOLVED' |
    'TARGET_INSTABILITY' | 'NOT_RESOLVED';
  readonly climateBaseline: 'STABLE_PROXY' | 'VARIABLE_PROXY' |
    'DEEP_ENVELOPE' | 'NOT_RESOLVED';
  readonly transientCoverage: TransientCoverage31_5;
  readonly currentRelevantEvents: number;
  readonly historicalRelevantEvents: number;
  readonly unresolvedCurrentForcing: boolean;
  readonly currentResolvedDisruption: boolean;
  readonly currentBaselineVerdict: HabitabilityEvidenceVerdict;
  readonly historicalContinuityResolved: false;
  readonly catastrophicRecoveryResolved: false;
}
export interface HabitabilityStabilityResult31_5 {
  readonly assessment: HabitabilityScenarioAssessment;
  /** Diagnostics are never exported to OBSERVED_KNOWLEDGE. */
  readonly diagnostics: HabitabilityStabilityDiagnostics31_5 | null;
}

const SURFACE: HabitabilityRoute = 'SURFACE_AQUEOUS';
const SUBSURFACE: HabitabilityRoute = 'SUBSURFACE_AQUEOUS';

export class HabitabilityStabilityResolver31_5 {
  private constructor() {}

  static assessPlanet(
    context: HabitabilityEnvironmentContext31_2,
    prior: HabitabilityScenarioAssessment,
    sources: PlanetStabilitySources31_5,
  ): HabitabilityStabilityResult31_5 {
    checkPrior(context, prior, 'PLANET');
    assertOrdinal(sources.planetOrdinal, 'planet');
    const stellar = evaluateStellar(context, sources.stellarHosts);
    const orbit = evaluateOrbit(sources.planetOrdinal, sources.orbital ?? null);
    const climate = evaluateClimate(sources.planetOrdinal, sources.climate ?? null);
    const transient = evaluateTransients(context, sources.transients);

    // Neither stellar rotation nor the current climate proxy proves historical
    // duration. A severe current event with a resolved environmental consequence
    // invalidates the *current stable-baseline* inference, not all possible life.
    const verdict: HabitabilityEvidenceVerdict =
      orbit === 'TARGET_INSTABILITY' || transient.currentResolvedDisruption
        ? 'CONTRADICTS'
        : stellar === 'STABLE_PROXY' && orbit === 'STABLE_PROXY' &&
          climate === 'STABLE_PROXY' && !transient.unresolvedCurrentForcing
          ? 'SUPPORTS' : 'UNRESOLVED';
    const evidence = preserveEvidence(context, prior);
    if (verdict !== 'UNRESOLVED') {
      addStability(context, evidence, SURFACE, verdict,
        verdict === 'CONTRADICTS' && transient.currentResolvedDisruption
          ? 'phase29.scoped.current.resolvedEnvironmentalDisruption'
          : verdict === 'CONTRADICTS'
            ? 'planet.18.5.targetOrbitalInstability'
            : 'stellar.15.5+planet.18.5+planet.20.6.currentBaseline');
    }
    // The frozen 20.6 climate metric models a SOLID surface. The existing
    // 31.2/31.3 subsurface scenario does not resolve long-term internal-ocean
    // orbital/thermal evolution: no invented subsurface stability support.
    return finish(context, prior, evidence, {
      stellarBaseline: stellar, orbitalBaseline: orbit, climateBaseline: climate,
      transientCoverage: transient.coverage,
      currentRelevantEvents: transient.currentCount,
      historicalRelevantEvents: transient.historicalCount,
      unresolvedCurrentForcing: transient.unresolvedCurrentForcing,
      currentResolvedDisruption: transient.currentResolvedDisruption,
      currentBaselineVerdict: verdict,
      historicalContinuityResolved: false,
      catastrophicRecoveryResolved: false,
    });
  }

  static assessMoon(
    context: HabitabilityEnvironmentContext31_2,
    prior: HabitabilityScenarioAssessment,
    sources: MoonStabilitySources31_5,
  ): HabitabilityStabilityResult31_5 {
    checkPrior(context, prior, 'MOON');
    assertOrdinal(sources.hostPlanetOrdinal, 'lunar host planet');
    assertOrdinal(sources.moonOrdinal, 'moon');
    const stellar = evaluateStellar(context, sources.stellarHosts);
    const transient = evaluateTransients(context, sources.transients);
    // Lunar orbital stability, climate history, and ice-shell continuity are
    // not delivered by the current point-21 lunar indices. Even a known event
    // affecting the surface cannot infer a subsurface ocean's response.
    return finish(context, prior, preserveEvidence(context, prior), {
      stellarBaseline: stellar, orbitalBaseline: 'NOT_RESOLVED',
      climateBaseline: 'NOT_RESOLVED', transientCoverage: transient.coverage,
      currentRelevantEvents: transient.currentCount,
      historicalRelevantEvents: transient.historicalCount,
      unresolvedCurrentForcing: transient.unresolvedCurrentForcing,
      currentResolvedDisruption: transient.currentResolvedDisruption,
      currentBaselineVerdict: 'UNRESOLVED',
      historicalContinuityResolved: false,
      catastrophicRecoveryResolved: false,
    });
  }
}

function evaluateStellar(
  context: HabitabilityEnvironmentContext31_2,
  hosts: readonly StellarHostStability31_5[] | null | undefined,
): HabitabilityStabilityDiagnostics31_5['stellarBaseline'] {
  const expected = { SINGLE: 1, BINARY: 2, TRIPLE: 3, UNKNOWN: null }[context.multiplicity];
  if (hosts === null || hosts === undefined) return 'NOT_RESOLVED';
  if (expected !== null && hosts.length > expected) {
    throw new RangeError('31.5: more stellar hosts than the declared architecture.');
  }
  const keys = new Set<string>();
  let allStable = true;
  let complete = true;
  for (const host of hosts) {
    if (typeof host.hostKey !== 'string' || host.hostKey.trim() === '' ||
        keys.has(host.hostKey)) throw new RangeError('31.5: invalid or duplicate host key.');
    keys.add(host.hostKey);
    const rotation = host.rotation;
    if (rotation === null) { complete = false; continue; }
    const applicable = rotation.ordinaryRotationModelApplicable;
    if (typeof applicable !== 'boolean') throw new RangeError('31.5: invalid ordinary-star flag.');
    if (!applicable) {
      if (rotation.stabilityRegime !== null || rotation.stabilityIndex !== null) {
        throw new RangeError('31.5: compact hosts cannot reuse the ordinary-star stability proxy.');
      }
      complete = false;
      continue;
    }
    if (rotation.stabilityIndex === null || rotation.stabilityRegime === null ||
        !Number.isFinite(rotation.stabilityIndex) || rotation.stabilityIndex < 0 ||
        rotation.stabilityIndex > 1 ||
        StellarStabilityRegime.fromStabilityIndex(rotation.stabilityIndex).name !==
          rotation.stabilityRegime.name) {
      throw new RangeError('31.5: incoherent 15.5 stellar stability source.');
    }
    if (rotation.stabilityRegime.name !== 'STABLE' &&
        rotation.stabilityRegime.name !== 'HIGHLY_STABLE') allStable = false;
  }
  if (expected === null || hosts.length !== expected || hosts.length === 0 || !complete) return 'NOT_RESOLVED';
  return allStable ? 'STABLE_PROXY' : 'VARIABLE_PROXY';
}

function evaluateOrbit(
  ordinal: number, source: PlanetOrbitalStabilitySource31_5 | null,
): HabitabilityStabilityDiagnostics31_5['orbitalBaseline'] {
  if (!source) return 'NOT_RESOLVED';
  if (!Number.isInteger(source.planetCount) || source.planetCount <= 0 ||
      ordinal > source.planetCount ||
      !Object.values(PlanetarySystemStabilityRegime).includes(source.regime) ||
      !Object.values(PlanetarySystemOrbitTopology).includes(source.orbitTopology) ||
      source.regime === PlanetarySystemStabilityRegime.EMPTY ||
      source.regime === PlanetarySystemStabilityRegime.DYNAMICALLY_EXCLUDED) {
    throw new RangeError('31.5: orbital stability source cannot represent the target planet.');
  }
  const pairs = source.pairAssessments;
  if (pairs.length !== source.planetCount - 1) {
    throw new RangeError('31.5: incomplete 18.5 adjacent-pair coverage.');
  }
  const observed = new Set<string>();
  let targetUnstablePair = false;
  for (const pair of pairs) {
    const key = `${pair.innerPlanetOrdinal}/${pair.outerPlanetOrdinal}`;
    if (!Number.isInteger(pair.innerPlanetOrdinal) || pair.innerPlanetOrdinal <= 0 ||
        pair.outerPlanetOrdinal !== pair.innerPlanetOrdinal + 1 ||
        pair.outerPlanetOrdinal > source.planetCount || observed.has(key) ||
        !Object.values(PlanetaryOrbitalPairStabilityRegime).includes(pair.regime)) {
      throw new RangeError('31.5: invalid 18.5 adjacent-pair source.');
    }
    observed.add(key);
    if (pair.regime === PlanetaryOrbitalPairStabilityRegime.UNSTABLE &&
        (pair.innerPlanetOrdinal === ordinal || pair.outerPlanetOrdinal === ordinal)) {
      targetUnstablePair = true;
    }
  }
  for (let i = 1; i < source.planetCount; i++) {
    if (!observed.has(`${i}/${i + 1}`)) {
      throw new RangeError('31.5: missing adjacent-pair diagnostic.');
    }
  }
  if (source.regime === PlanetarySystemStabilityRegime.STABLE &&
      pairs.some((p) => p.regime !== PlanetaryOrbitalPairStabilityRegime.STABLE)) {
    throw new RangeError('31.5: stable-system declaration conflicts with pairwise instability.');
  }
  for (const value of [source.innerBoundaryClearanceAu, source.outerBoundaryClearanceAu]) {
    if (value !== null && !Number.isFinite(value)) {
      throw new RangeError('31.5: invalid 18.5 orbital boundary clearance.');
    }
  }
  const boundaryFailure = source.orbitTopology === PlanetarySystemOrbitTopology.CIRCUMBINARY &&
    (source.innerBoundaryClearanceAu !== null && source.innerBoundaryClearanceAu < 0 ||
     source.outerBoundaryClearanceAu !== null && source.outerBoundaryClearanceAu < 0);
  if (targetUnstablePair || boundaryFailure) return 'TARGET_INSTABILITY';
  if (source.regime === PlanetarySystemStabilityRegime.STABLE) return 'STABLE_PROXY';
  return 'MARGINAL_OR_UNRESOLVED';
}

function evaluateClimate(
  ordinal: number, source: PlanetClimateStabilitySource31_5 | null,
): HabitabilityStabilityDiagnostics31_5['climateBaseline'] {
  if (!source) return 'NOT_RESOLVED';
  if (source.planetOrdinal !== ordinal ||
      !Object.values(PlanetClimateStabilityRegime).includes(source.stabilityRegime) ||
      source.stabilityRegime !== planetClimateStabilityRegimeForIndex01(
        source.stabilityIndex01,
        source.stabilityRegime === PlanetClimateStabilityRegime.DEEP_ENVELOPE,
      )) {
    throw new RangeError('31.5: incoherent 20.6 climate source or planet ordinal.');
  }
  if (source.stabilityRegime === PlanetClimateStabilityRegime.DEEP_ENVELOPE) {
    return 'DEEP_ENVELOPE';
  }
  return source.stabilityRegime === PlanetClimateStabilityRegime.STABLE ||
    source.stabilityRegime === PlanetClimateStabilityRegime.MODERATELY_VARIABLE
    ? 'STABLE_PROXY' : 'VARIABLE_PROXY';
}

interface TransientEvaluation {
  readonly coverage: TransientCoverage31_5;
  readonly currentCount: number;
  readonly historicalCount: number;
  readonly currentResolvedDisruption: boolean;
  readonly unresolvedCurrentForcing: boolean;
}
function evaluateTransients(
  context: HabitabilityEnvironmentContext31_2,
  source: TransientStabilitySources31_5 | null | undefined,
): TransientEvaluation {
  if (!source) return { coverage: 'NOT_ASSESSED', currentCount: 0,
    historicalCount: 0, currentResolvedDisruption: false, unresolvedCurrentForcing: false };
  if (!['NOT_ASSESSED', 'PARTIAL_CURRENT_EPOCH', 'COMPLETE_CURRENT_EPOCH'].includes(source.coverage) ||
      !Array.isArray(source.events) ||
      source.coverage === 'NOT_ASSESSED' && source.events.length > 0) {
    throw new RangeError('31.5: invalid transient coverage contract.');
  }
  const keys = new Set<string>();
  let currentCount = 0, historicalCount = 0;
  let currentResolvedDisruption = false, unresolvedCurrentForcing = false;
  for (const event of source.events) {
    if (typeof event.eventKey !== 'string' || event.eventKey.trim() === '' ||
        keys.has(event.eventKey) || event.affectedBodyKey !== context.bodyKey ||
        !['SUPERNOVA', 'NOVA', 'KILONOVA', 'GAMMA_RAY_BURST', 'STELLAR_FLARE',
          'STELLAR_OUTBURST', 'IMPACT', 'OTHER'].includes(event.kind) ||
        !['CURRENT', 'HISTORICAL'].includes(event.epoch) ||
        !['RESOLVED_ENVIRONMENTAL_DISRUPTION', 'POTENTIAL_FORCING', 'UNRESOLVED']
          .includes(event.effect)) {
      throw new RangeError('31.5: unscoped, invalid or contradictory transient event.');
    }
    keys.add(event.eventKey);
    if (event.epoch === 'HISTORICAL') { historicalCount++; continue; }
    currentCount++;
    if (event.effect === 'RESOLVED_ENVIRONMENTAL_DISRUPTION') {
      currentResolvedDisruption = true;
    } else {
      unresolvedCurrentForcing = true;
    }
  }
  return { coverage: source.coverage, currentCount, historicalCount,
    currentResolvedDisruption, unresolvedCurrentForcing };
}

function checkPrior(
  context: HabitabilityEnvironmentContext31_2, prior: HabitabilityScenarioAssessment,
  expectedKind: 'PLANET' | 'MOON',
): void {
  if (prior.bodyKind !== expectedKind || prior.bodyKey !== context.bodyKey ||
      prior.multiplicity !== context.multiplicity || prior.perspective !== context.perspective ||
      prior.contractVersion !== '31.1-CT0' || prior.time.kind !== context.time.kind ||
      prior.time.systemAgeBillionYears !== context.time.systemAgeBillionYears) {
    throw new RangeError('31.5: prior result and CT-0 context must refer to the same body.');
  }
  if (prior.routes.some((r) => r.constraints.some((c) =>
      c.constraint === 'DYNAMICAL_STABILITY' && c.verdict !== 'UNRESOLVED'))) {
    throw new RangeError('31.5: refusing to overwrite existing dynamical stability evidence.');
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
        evidence.push({ route: route.route, constraint: c.constraint,
          verdict: c.verdict, basis: c.basis, sourceKey: c.sourceKey,
          accessibleToObserver: context.perspective === 'OBSERVED_KNOWLEDGE' ||
            context.observerAccessibleEvidence.some((g) =>
              g.route === route.route && g.constraint === c.constraint),
        });
      }
    }
  }
  return evidence;
}

function addStability(
  context: HabitabilityEnvironmentContext31_2, evidence: HabitabilityEvidence[],
  route: HabitabilityRoute, verdict: 'SUPPORTS' | 'CONTRADICTS', sourceKey: string,
): void {
  evidence.push({ route, constraint: 'DYNAMICAL_STABILITY', verdict,
    basis: 'INFERRED_MODEL', sourceKey,
    accessibleToObserver: context.observerAccessibleEvidence.some((g) =>
      g.route === route && g.constraint === 'DYNAMICAL_STABILITY'),
  });
}

function finish(
  context: HabitabilityEnvironmentContext31_2, prior: HabitabilityScenarioAssessment,
  evidence: HabitabilityEvidence[], diagnostics: HabitabilityStabilityDiagnostics31_5,
): HabitabilityStabilityResult31_5 {
  return Object.freeze({
    assessment: HabitabilityEngine.evaluate({
      bodyKind: prior.bodyKind, bodyKey: context.bodyKey,
      multiplicity: context.multiplicity, perspective: context.perspective,
      time: context.time, evidence,
    }),
    diagnostics: context.perspective === 'SIMULATED_REALITY'
      ? Object.freeze({ ...diagnostics }) : null,
  });
}

function assertOrdinal(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`31.5: invalid ${label} ordinal.`);
  }
}
