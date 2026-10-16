import { describe, expect, it } from 'vitest';
import type { HabitabilityScenarioAssessment } from '../../domain/habitability/habitability-scenario';
import { StellarStabilityRegime } from '../../domain/stellar/stellar-stability-regime';
import { PlanetClimateStabilityRegime } from '../../domain/planetary/planet-climate-stability-regime';
import { PlanetarySystemStabilityRegime } from '../../domain/planetary/planetary-system-stability-regime';
import { PlanetarySystemOrbitTopology } from '../../domain/planetary/planetary-system-orbit-topology';
import { PlanetaryOrbitalPairStabilityRegime } from '../../domain/planetary/planetary-orbital-pair-stability-regime';
import { PlanetaryOrbitalPairStability } from '../../domain/planetary/planetary-orbital-pair-stability';
import { HabitabilityEngine } from './habitability-engine';
import { HabitabilityRadiationResolver31_4 } from './habitability-radiation-resolver-31-4';
import type { HabitabilityEnvironmentContext31_2 } from './habitability-environment-resolver-31-2';
import {
  HabitabilityStabilityResolver31_5, type PlanetStabilitySources31_5,
  type MoonStabilitySources31_5, type StellarHostStability31_5,
  type TransientStabilitySources31_5,
} from './habitability-stability-resolver-31-5';

const base: HabitabilityEnvironmentContext31_2 = {
  bodyKey: 'G0/S35/O0/B2', multiplicity: 'SINGLE',
  perspective: 'SIMULATED_REALITY',
  time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 3.5 },
  observerAccessibleEvidence: [],
};
const stellar: StellarHostStability31_5 = {
  hostKey: 'A', rotation: { ordinaryRotationModelApplicable: true,
    stabilityIndex: 0.83, stabilityRegime: StellarStabilityRegime.HIGHLY_STABLE },
};
const orbit = {
  regime: PlanetarySystemStabilityRegime.STABLE,
  planetCount: 3,
  orbitTopology: PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
  pairAssessments: [pair(1), pair(2)],
  innerBoundaryClearanceAu: null, outerBoundaryClearanceAu: null,
};
const climate = { planetOrdinal: 3, stabilityIndex01: 0.84,
  stabilityRegime: PlanetClimateStabilityRegime.STABLE };
const baseSources: PlanetStabilitySources31_5 = {
  planetOrdinal: 3, stellarHosts: [stellar], orbital: orbit, climate,
};
const event: TransientStabilitySources31_5 = {
  coverage: 'PARTIAL_CURRENT_EPOCH',
  events: [{ eventKey: 'phase29.event.73', affectedBodyKey: base.bodyKey,
    kind: 'SUPERNOVA', epoch: 'CURRENT', effect: 'POTENTIAL_FORCING' }],
};
function pair(i: number, regime = PlanetaryOrbitalPairStabilityRegime.STABLE) {
  return new PlanetaryOrbitalPairStability(
    i, i + 1, 1, 1.25, 1.02, 1.20, 0.18, 1, 1, 0.02, 12.5, 1.4, 1, regime,
  );
}
function prior(ctx = base, bodyKind: 'PLANET' | 'MOON' = 'PLANET') {
  return HabitabilityEngine.evaluate({
    bodyKind, bodyKey: ctx.bodyKey, multiplicity: ctx.multiplicity,
    perspective: ctx.perspective, time: ctx.time,
    evidence: [{ route: 'SURFACE_AQUEOUS', constraint: 'TEMPERATURE',
      verdict: 'SUPPORTS', basis: 'PHYSICAL_MODEL', sourceKey: 'planet.20.6.thermal',
      accessibleToObserver: ctx.observerAccessibleEvidence.some((g) =>
        g.route === 'SURFACE_AQUEOUS' && g.constraint === 'TEMPERATURE') }],
  });
}
function assess(
  sources: PlanetStabilitySources31_5 = baseSources,
  ctx: HabitabilityEnvironmentContext31_2 = base,
  p: HabitabilityScenarioAssessment = prior(ctx),
) {
  return HabitabilityStabilityResolver31_5.assessPlanet(ctx, p, sources);
}
function factor(a: HabitabilityScenarioAssessment,
  route: 'SURFACE_AQUEOUS' | 'SUBSURFACE_AQUEOUS' = 'SURFACE_AQUEOUS') {
  return a.routes.find((r) => r.route === route)!.constraints
    .find((f) => f.constraint === 'DYNAMICAL_STABILITY')!;
}

describe('GENESIS 31.5 — current stellar, orbital and climate stability / transient forcing', () => {
  it('supports only an inferred CURRENT solid-surface stability baseline', () => {
    const r = assess();
    expect(factor(r.assessment).verdict).toBe('SUPPORTS');
    expect(factor(r.assessment).basis).toBe('INFERRED_MODEL');
    expect(r.diagnostics?.historicalContinuityResolved).toBe(false);
    expect(r.diagnostics?.catastrophicRecoveryResolved).toBe(false);
    expect(r.diagnostics?.transientCoverage).toBe('NOT_ASSESSED');
    expect(r.assessment.routes.find((x) => x.route === 'SURFACE_AQUEOUS')?.status)
      .toBe('INSUFFICIENT_EVIDENCE');
  });

  it('does not promote a current stable solid surface to a confirmed subsurface ocean', () => {
    expect(factor(assess().assessment, 'SUBSURFACE_AQUEOUS').verdict).toBe('UNRESOLVED');
  });

  it('conserves earlier 31.1 evidence without mutating the input', () => {
    const p = prior();
    const before = JSON.stringify(p);
    const r = assess(baseSources, base, p);
    const temp = r.assessment.routes[0].constraints.find((x) => x.constraint === 'TEMPERATURE');
    expect(temp?.verdict).toBe('SUPPORTS');
    expect(temp?.sourceKey).toBe('planet.20.6.thermal');
    expect(JSON.stringify(p)).toBe(before);
  });

  it('accepts an assessment already passed through 31.4 without overwriting radiation', () => {
    const rad = HabitabilityRadiationResolver31_4.assessPlanet(base, prior(),
      { planetOrdinal: 3 });
    const r = assess(baseSources, base, rad.assessment);
    expect(factor(r.assessment).verdict).toBe('SUPPORTS');
    expect(r.assessment.routes[0].constraints.find((x) =>
      x.constraint === 'RADIATION_EXPOSURE')?.verdict).toBe('UNRESOLVED');
  });

  it('does not infer stellar stability from an incomplete or missing host roster', () => {
    expect(factor(assess({ ...baseSources, stellarHosts: null }).assessment).verdict)
      .toBe('UNRESOLVED');
    const ctx = { ...base, multiplicity: 'BINARY' as const };
    const r = assess({ ...baseSources, stellarHosts: [stellar] }, ctx);
    expect(r.diagnostics?.stellarBaseline).toBe('NOT_RESOLVED');
    expect(factor(r.assessment).verdict).toBe('UNRESOLVED');
  });

  it('recognizes BINARY and TRIPLE only with all actual stellar components resolved', () => {
    for (const [multiplicity, names] of [
      ['BINARY', ['A', 'B']], ['TRIPLE', ['A', 'B', 'C']],
    ] as const) {
      const ctx = { ...base, multiplicity };
      const sources = { ...baseSources,
        stellarHosts: names.map((hostKey) => ({ ...stellar, hostKey })) };
      expect(factor(assess(sources, ctx).assessment).verdict).toBe('SUPPORTS');
    }
  });

  it('does not assume that a compact host has ordinary-star stability', () => {
    const r = assess({ ...baseSources, stellarHosts: [{ hostKey: 'A', rotation: {
      ordinaryRotationModelApplicable: false, stabilityIndex: null, stabilityRegime: null,
    } }] });
    expect(r.diagnostics?.stellarBaseline).toBe('NOT_RESOLVED');
    expect(factor(r.assessment).verdict).toBe('UNRESOLVED');
  });

  it('does not declare climate or biology incompatible from a variable stellar baseline', () => {
    const r = assess({ ...baseSources, stellarHosts: [{ ...stellar, rotation: {
      ordinaryRotationModelApplicable: true, stabilityIndex: 0.38,
      stabilityRegime: StellarStabilityRegime.VARIABLE,
    } }] });
    expect(r.diagnostics?.stellarBaseline).toBe('VARIABLE_PROXY');
    expect(factor(r.assessment).verdict).toBe('UNRESOLVED');
  });

  it('allows a moderately variable current climate baseline but not an extreme one', () => {
    expect(factor(assess({ ...baseSources, climate: {
      ...climate, stabilityIndex01: 0.67,
      stabilityRegime: PlanetClimateStabilityRegime.MODERATELY_VARIABLE,
    } }).assessment).verdict).toBe('SUPPORTS');
    expect(factor(assess({ ...baseSources, climate: {
      ...climate, stabilityIndex01: 0.20,
      stabilityRegime: PlanetClimateStabilityRegime.EXTREME,
    } }).assessment).verdict).toBe('UNRESOLVED');
  });

  it('never assigns a solid-surface climate to an unresolved giant deep envelope', () => {
    const r = assess({ ...baseSources, climate: { ...climate,
      stabilityIndex01: null, stabilityRegime: PlanetClimateStabilityRegime.DEEP_ENVELOPE } });
    expect(r.diagnostics?.climateBaseline).toBe('DEEP_ENVELOPE');
    expect(factor(r.assessment).verdict).toBe('UNRESOLVED');
  });

  it('supports present-day orbit proxy but not long-term orbital integration', () => {
    expect(assess().diagnostics?.orbitalBaseline).toBe('STABLE_PROXY');
    expect(assess().diagnostics?.historicalContinuityResolved).toBe(false);
  });

  it('does not mark a target unstable because a different pair is unstable', () => {
    const r = assess({ ...baseSources, orbital: { ...orbit,
      regime: PlanetarySystemStabilityRegime.UNSTABLE,
      pairAssessments: [pair(1, PlanetaryOrbitalPairStabilityRegime.UNSTABLE), pair(2)],
    } });
    expect(r.diagnostics?.orbitalBaseline).toBe('MARGINAL_OR_UNRESOLVED');
    expect(factor(r.assessment).verdict).toBe('UNRESOLVED');
  });

  it('identifies instability of the target adjacent pair as current baseline contradiction', () => {
    const r = assess({ ...baseSources, orbital: { ...orbit,
      regime: PlanetarySystemStabilityRegime.UNSTABLE,
      pairAssessments: [pair(1), pair(2, PlanetaryOrbitalPairStabilityRegime.UNSTABLE)],
    } });
    expect(r.diagnostics?.orbitalBaseline).toBe('TARGET_INSTABILITY');
    expect(factor(r.assessment).verdict).toBe('CONTRADICTS');
    expect(r.assessment.routes[0].status).toBe('CONSTRAINTS_INCOMPATIBLE');
  });

  it('identifies failed circumbinary stability clearance without arbitrary S/P bonuses', () => {
    const binary = { ...base, multiplicity: 'BINARY' as const };
    const r = assess({ ...baseSources,
      stellarHosts: [stellar, { ...stellar, hostKey: 'B' }],
      orbital: { ...orbit, orbitTopology: PlanetarySystemOrbitTopology.CIRCUMBINARY,
        regime: PlanetarySystemStabilityRegime.UNSTABLE, innerBoundaryClearanceAu: -0.05 },
    }, binary);
    expect(factor(r.assessment).verdict).toBe('CONTRADICTS');
  });

  it('keeps marginal 18.5 orbit diagnostics unresolved rather than declaring exclusion', () => {
    const r = assess({ ...baseSources, orbital: { ...orbit,
      regime: PlanetarySystemStabilityRegime.MARGINAL,
      pairAssessments: [pair(1), pair(2, PlanetaryOrbitalPairStabilityRegime.MARGINAL)],
    } });
    expect(factor(r.assessment).verdict).toBe('UNRESOLVED');
  });

  it('does not infer no catastrophes from a missing event catalogue', () => {
    expect(assess().diagnostics?.transientCoverage).toBe('NOT_ASSESSED');
    expect(assess().diagnostics?.currentRelevantEvents).toBe(0);
    expect(factor(assess().assessment).verdict).toBe('SUPPORTS');
  });

  it('regards a resolved current disruptive event as a failure of current stability only', () => {
    const r = assess({ ...baseSources, transients: { ...event, events: [
      { ...event.events[0], effect: 'RESOLVED_ENVIRONMENTAL_DISRUPTION' },
    ] } });
    expect(factor(r.assessment).verdict).toBe('CONTRADICTS');
    expect(r.diagnostics?.currentResolvedDisruption).toBe(true);
    expect(r.diagnostics?.historicalContinuityResolved).toBe(false);
  });

  it('keeps an exposure candidate from phase 29 unresolved rather than sterilizing a planet', () => {
    const r = assess({ ...baseSources, transients: event });
    expect(r.diagnostics?.unresolvedCurrentForcing).toBe(true);
    expect(factor(r.assessment).verdict).toBe('UNRESOLVED');
  });

  it('does not confuse a recorded historical event with current destabilization', () => {
    const r = assess({ ...baseSources, transients: { ...event, events: [
      { ...event.events[0], epoch: 'HISTORICAL',
        effect: 'RESOLVED_ENVIRONMENTAL_DISRUPTION' },
    ] } });
    expect(r.diagnostics?.historicalRelevantEvents).toBe(1);
    expect(r.diagnostics?.currentRelevantEvents).toBe(0);
    expect(factor(r.assessment).verdict).toBe('SUPPORTS');
    expect(r.diagnostics?.historicalContinuityResolved).toBe(false);
  });

  it('distinguishes explicitly complete current-event coverage from unassessed coverage', () => {
    const r = assess({ ...baseSources, transients: {
      coverage: 'COMPLETE_CURRENT_EPOCH', events: [],
    } });
    expect(r.diagnostics?.transientCoverage).toBe('COMPLETE_CURRENT_EPOCH');
    expect(factor(r.assessment).verdict).toBe('SUPPORTS');
  });

  it('rejects transients applied to another body, duplicate IDs and nonexistent kinds', () => {
    expect(() => assess({ ...baseSources, transients: { ...event, events: [
      { ...event.events[0], affectedBodyKey: 'another' },
    ] } })).toThrow();
    expect(() => assess({ ...baseSources, transients: { ...event,
      events: [event.events[0], event.events[0]],
    } })).toThrow();
    expect(() => assess({ ...baseSources, transients: {
      coverage: 'NOT_ASSESSED', events: [event.events[0]],
    } })).toThrow();
  });

  it('rejects mismatched planet ordinals and model-inconsistent climatic classifications', () => {
    expect(() => assess({ ...baseSources, planetOrdinal: 0 })).toThrow();
    expect(() => assess({ ...baseSources, climate: { ...climate, planetOrdinal: 4 } })).toThrow();
    expect(() => assess({ ...baseSources, climate: { ...climate,
      stabilityIndex01: 0.22 } })).toThrow();
  });

  it('rejects forged stellar classifications, duplicate hosts, and excessive host counts', () => {
    expect(() => assess({ ...baseSources, stellarHosts: [
      { ...stellar, rotation: { ...stellar.rotation!, stabilityIndex: 0.12 } },
    ] })).toThrow();
    expect(() => assess({ ...baseSources, stellarHosts: [stellar, stellar] })).toThrow();
    const ctx = { ...base, multiplicity: 'BINARY' as const };
    expect(() => assess({ ...baseSources, stellarHosts: [
      stellar, { ...stellar, hostKey: 'B' }, { ...stellar, hostKey: 'C' },
    ] }, ctx)).toThrow();
  });

  it('rejects incomplete/mismatched 18.5 pair diagnostics instead of greenlighting an orbit', () => {
    expect(() => assess({ ...baseSources, orbital: { ...orbit, pairAssessments: [] } })).toThrow();
    expect(() => assess({ ...baseSources, orbital: { ...orbit, planetCount: 2 } })).toThrow();
    expect(() => assess({ ...baseSources, orbital: { ...orbit,
      pairAssessments: [pair(1), pair(1)] } })).toThrow();
    expect(() => assess({ ...baseSources, orbital: { ...orbit,
      pairAssessments: [pair(1, PlanetaryOrbitalPairStabilityRegime.UNSTABLE), pair(2)] } })).toThrow();
  });

  it('refuses to overwrite a prior dynamical assessment', () => {
    const done = assess().assessment;
    expect(() => assess(baseSources, base, done)).toThrow();
  });

  it('validates body, perspective, architecture and CT-0 for prior assessments', () => {
    const wrong = { ...base, bodyKey: 'wrong' };
    expect(() => assess(baseSources, base, prior(wrong))).toThrow();
    const otherAge = { ...base, time: { ...base.time, systemAgeBillionYears: 0.2 } };
    expect(() => assess(baseSources, base, prior(otherAge))).toThrow();
    const binary = { ...base, multiplicity: 'BINARY' as const };
    expect(() => assess(baseSources, base, prior(binary))).toThrow();
    expect(() => assess(baseSources, base, prior(base, 'MOON'))).toThrow();
  });

  it('does not leak private evidence into OBSERVED_KNOWLEDGE', () => {
    const ctx: HabitabilityEnvironmentContext31_2 = {
      ...base, perspective: 'OBSERVED_KNOWLEDGE', observerAccessibleEvidence: [],
    };
    const r = assess(baseSources, ctx);
    expect(r.diagnostics).toBe(null);
    expect(factor(r.assessment).verdict).toBe('UNRESOLVED');
    expect(r.assessment.routes[0].constraints.find((c) => c.constraint === 'TEMPERATURE')?.verdict)
      .toBe('UNRESOLVED');
  });

  it('requires discovery-layer permission even if a model has resolved a stable baseline', () => {
    const ctx: HabitabilityEnvironmentContext31_2 = { ...base,
      perspective: 'OBSERVED_KNOWLEDGE',
      observerAccessibleEvidence: [{ route: 'SURFACE_AQUEOUS', constraint: 'DYNAMICAL_STABILITY' }],
    };
    const r = assess(baseSources, ctx);
    expect(factor(r.assessment).verdict).toBe('SUPPORTS');
    expect(factor(r.assessment).sourceKey).toBe('stellar.15.5+planet.18.5+planet.20.6.currentBaseline');
    expect(r.diagnostics).toBe(null);
  });

  it('does not fabricate moon orbital stability or ocean-shell continuity from a stellar proxy', () => {
    const moon: MoonStabilitySources31_5 = { hostPlanetOrdinal: 3, moonOrdinal: 1,
      stellarHosts: [stellar] };
    const r = HabitabilityStabilityResolver31_5.assessMoon(base, prior(base, 'MOON'), moon);
    expect(factor(r.assessment).verdict).toBe('UNRESOLVED');
    expect(factor(r.assessment, 'SUBSURFACE_AQUEOUS').verdict).toBe('UNRESOLVED');
    expect(r.diagnostics?.stellarBaseline).toBe('STABLE_PROXY');
    expect(r.diagnostics?.orbitalBaseline).toBe('NOT_RESOLVED');
  });

  it('counts known lunar transients without guessing attenuation by water/ice', () => {
    const lunar: MoonStabilitySources31_5 = { hostPlanetOrdinal: 3, moonOrdinal: 2,
      stellarHosts: [stellar], transients: { ...event, events: [
        { ...event.events[0], effect: 'RESOLVED_ENVIRONMENTAL_DISRUPTION' },
      ] } };
    const r = HabitabilityStabilityResolver31_5.assessMoon(base, prior(base, 'MOON'), lunar);
    expect(r.diagnostics?.currentResolvedDisruption).toBe(true);
    expect(factor(r.assessment, 'SUBSURFACE_AQUEOUS').verdict).toBe('UNRESOLVED');
  });

  it('rejects nonexistent lunar host and moon ordinals, and mismatched prior body kind', () => {
    expect(() => HabitabilityStabilityResolver31_5.assessMoon(base, prior(base, 'MOON'),
      { hostPlanetOrdinal: 0, moonOrdinal: 1 })).toThrow();
    expect(() => HabitabilityStabilityResolver31_5.assessMoon(base, prior(base, 'MOON'),
      { hostPlanetOrdinal: 3, moonOrdinal: 0 })).toThrow();
    expect(() => HabitabilityStabilityResolver31_5.assessMoon(base, prior(),
      { hostPlanetOrdinal: 3, moonOrdinal: 1 })).toThrow();
  });

  it('is deterministic and independent from unrelated body keys, seeds and evaluation order', () => {
    const baseline = JSON.stringify(assess());
    for (let i = 0; i < 50; i++) {
      expect(JSON.stringify(assess())).toBe(baseline);
    }
    const ctx = { ...base, bodyKey: 'G5/S101/O2/B8' };
    const r = assess(baseSources, ctx);
    expect(factor(r.assessment).verdict).toBe(factor(assess().assessment).verdict);
  });
});
