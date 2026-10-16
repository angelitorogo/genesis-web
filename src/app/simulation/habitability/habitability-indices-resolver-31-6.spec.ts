import { describe, expect, it } from 'vitest';
import {
  HABITABILITY_REQUIREMENTS_31_1,
  type HabitabilityConstraint, type HabitabilityEvidence,
  type HabitabilityEvidenceBasis, type HabitabilityEvidenceVerdict,
  type HabitabilityRoute, type HabitabilityScenarioAssessment,
  type HabitabilityScenarioInput,
} from '../../domain/habitability/habitability-scenario';
import { HabitabilityEngine } from './habitability-engine';
import { HabitabilityIndicesResolver31_6 } from './habitability-indices-resolver-31-6';

const SURFACE = 'SURFACE_AQUEOUS' as const;
const UNDERGROUND = 'SUBSURFACE_AQUEOUS' as const;
const CT0 = { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 4.3 } as const;

type Aqueous = Exclude<HabitabilityRoute, 'ALTERNATIVE_CHEMISTRY'>;
function evidence(
  route: Aqueous,
  overrides: Partial<HabitabilityEvidence> = {},
): HabitabilityEvidence[] {
  return HABITABILITY_REQUIREMENTS_31_1[route].map((constraint) => ({
    route, constraint, verdict: 'SUPPORTS', basis: 'PHYSICAL_MODEL',
    accessibleToObserver: true, sourceKey: `modeled.${route}.${constraint}`,
    ...overrides,
  }));
}
function input(
  data: readonly HabitabilityEvidence[] = [],
  overrides: Partial<HabitabilityScenarioInput> = {},
): HabitabilityScenarioInput {
  return {
    bodyKind: 'PLANET', bodyKey: 'model/planet/42',
    multiplicity: 'SINGLE', perspective: 'SIMULATED_REALITY',
    time: CT0, evidence: data, ...overrides,
  };
}
function assess(
  data: readonly HabitabilityEvidence[] = [],
  overrides: Partial<HabitabilityScenarioInput> = {},
) {
  return HabitabilityIndicesResolver31_6.summarize(HabitabilityEngine.evaluate(input(data, overrides)));
}
function route(report: ReturnType<typeof assess>, kind: HabitabilityRoute = SURFACE) {
  const r = report.routes.find((value) => value.route === kind);
  if (!r) throw Error(`Route not found: ${kind}`);
  return r;
}
function modified(
  routeType: Aqueous, constraint: HabitabilityConstraint,
  verdict: HabitabilityEvidenceVerdict, basis: HabitabilityEvidenceBasis = 'PHYSICAL_MODEL',
) {
  return evidence(routeType).map((c) => c.constraint === constraint ? { ...c, verdict, basis } : c);
}
function forged(change: (copy: any) => void): HabitabilityScenarioAssessment {
  const result = structuredClone(HabitabilityEngine.evaluate(input(evidence(SURFACE))));
  change(result);
  return result;
}

// Checks do not equate percentages with a probability of organisms, future
// evolution, suitability for humans, or evidence of biosignatures.
describe('Habitability 31.6 — descriptive route indices and epistemic certainty', () => {
  it('returns explicit CT-0 descriptive semantics and all three routes', () => {
    const result = assess();
    expect(result.contractVersion).toBe('31.6-CT0');
    expect(result.interpretation).toBe('DESCRIPTIVE_CONSTRAINT_COVERAGE_NOT_LIFE_PROBABILITY');
    expect(result.routes.map((r) => r.route)).toEqual([
      SURFACE, UNDERGROUND, 'ALTERNATIVE_CHEMISTRY',
    ]);
  });
  it('does not turn an empty route into a 0% habitability claim', () => {
    const r = route(assess());
    expect(r.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(r.coverage).toBe('NONE');
    expect(r.tally).toEqual({ required: 8, supporting: 0, contradicting: 0, unresolved: 8 });
    expect(r.evidenceCoverageIndex01).toBe(0);
    expect(r.supportingCriteriaIndex01).toBeNull();
    expect(r.contradictingCriteriaIndex01).toBeNull();
    expect(r.decisiveBasis).toBe('NOT_DETERMINED');
  });
  it('counts fully supported surface aqueous criteria without inferring life', () => {
    const r = route(assess(evidence(SURFACE)));
    expect(r.status).toBe('CONSTRAINTS_COMPATIBLE');
    expect(r.tally).toEqual({ required: 8, supporting: 8, contradicting: 0, unresolved: 0 });
    expect(r.evidenceCoverageIndex01).toBe(1);
    expect(r.supportingCriteriaIndex01).toBe(1);
    expect(r.contradictingCriteriaIndex01).toBe(0);
    expect(r.coverage).toBe('COMPLETE');
    expect(JSON.stringify(r)).not.toMatch(/lifePresent|biosignature|lifeProbability|abiogenesis|organism/i);
  });
  it('exposes contradictions decisively even if seven of eight criteria support', () => {
    const data = modified(SURFACE, 'LIQUID_RESERVOIR', 'CONTRADICTS');
    const r = route(assess(data));
    expect(r.status).toBe('CONSTRAINTS_INCOMPATIBLE');
    expect(r.supportingCriteriaIndex01).toBe(7 / 8);
    expect(r.contradictingCriteriaIndex01).toBe(1 / 8);
    expect(r.decisiveContradictions).toEqual(['LIQUID_RESERVOIR']);
    expect(r.decisiveBasis).toBe('PHYSICAL_MODEL');
  });
  it('keeps partial resolved support separate from unknown criteria', () => {
    const data = [evidence(SURFACE)[0], evidence(SURFACE)[1]];
    const r = route(assess(data));
    expect(r.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(r.coverage).toBe('PARTIAL');
    expect(r.evidenceCoverageIndex01).toBe(2 / 8);
    expect(r.supportingCriteriaIndex01).toBe(2 / 8);
    expect(r.missingConstraints.length).toBe(6);
    expect(r.decisiveBasis).toBe('NOT_DETERMINED');
  });
  it('keeps partial contradiction decisive despite unresolved factors', () => {
    const data = [{ ...evidence(SURFACE)[0], verdict: 'CONTRADICTS' as const }];
    const r = route(assess(data));
    expect(r.status).toBe('CONSTRAINTS_INCOMPATIBLE');
    expect(r.coverage).toBe('PARTIAL');
    expect(r.contradictingCriteriaIndex01).toBe(1 / 8);
    expect(r.missingConstraints.length).toBe(7);
    expect(r.decisiveBasis).toBe('PHYSICAL_MODEL');
  });
  it('preserves the difference between explicitly unresolved evidence and absent evidence', () => {
    const one = { ...evidence(SURFACE)[0], verdict: 'UNRESOLVED' as const,
      basis: 'UNRESOLVED' as const };
    const r = route(assess([one]));
    expect(r.coverage).toBe('NONE');
    expect(r.criteria[0].sourceKey).toBe(one.sourceKey);
    expect(r.criteria[1].sourceKey).toBeNull();
  });
  it('does not promote a model-inferred result to a direct observation', () => {
    const data = evidence(SURFACE).map((v, i) => i === 1 ? {
      ...v, basis: 'INFERRED_MODEL' as const,
    } : v);
    const r = route(assess(data));
    expect(r.resolution).toBe('INFERRED_EVIDENCE');
    expect(r.decisiveBasis).toBe('INFERRED_MODEL');
    expect(r.evidenceBases.inferredModels).toBe(1);
    expect(r.evidenceBases.directObservations).toBe(0);
  });
  it('does not treat any single direct observation as complete direct certainty', () => {
    const data = evidence(SURFACE).map((v, i) => i === 1 ? {
      ...v, basis: 'DIRECT_OBSERVATION' as const,
    } : v);
    const r = route(assess(data));
    expect(r.decisiveBasis).toBe('PHYSICAL_MODEL');
    expect(r.evidenceBases.directObservations).toBe(1);
    expect(r.evidenceBases.physicalModels).toBe(7);
  });
  it('labels fully directly observed evidence distinctly from physical models', () => {
    const r = route(assess(evidence(SURFACE, { basis: 'DIRECT_OBSERVATION' })));
    expect(r.decisiveBasis).toBe('DIRECT_OBSERVATION');
    expect(r.evidenceBases.directObservations).toBe(8);
  });
  it('evaluates basis of decisive contradictions rather than unrelated inferred supports', () => {
    const data = evidence(SURFACE).map((v, i) => i === 0 ? {
      ...v, verdict: 'CONTRADICTS' as const,
      basis: 'DIRECT_OBSERVATION' as const,
    } : { ...v, basis: 'INFERRED_MODEL' as const });
    const r = route(assess(data));
    expect(r.status).toBe('CONSTRAINTS_INCOMPATIBLE');
    expect(r.decisiveBasis).toBe('DIRECT_OBSERVATION');
    expect(r.evidenceBases.inferredModels).toBe(7);
  });
  it('does not collapse subsurface and surface environmental routes', () => {
    const result = assess(evidence(UNDERGROUND), { bodyKind: 'MOON' });
    expect(route(result, SURFACE).status).toBe('INSUFFICIENT_EVIDENCE');
    expect(route(result, UNDERGROUND).status).toBe('CONSTRAINTS_COMPATIBLE');
    expect(route(result, UNDERGROUND).tally.required).toBe(8);
    expect(route(result, UNDERGROUND).criteria.some((c) => c.constraint === 'RESERVOIR_GEOMETRY')).toBe(true);
    expect(route(result, UNDERGROUND).criteria.some((c) => c.constraint === 'GRAVITY_AND_RETENTION')).toBe(false);
  });
  it('does not manufacture alternatives before phase 31.11', () => {
    const r = route(assess([...evidence(SURFACE), ...evidence(UNDERGROUND)]), 'ALTERNATIVE_CHEMISTRY');
    expect(r.status).toBe('MODEL_NOT_IMPLEMENTED');
    expect(r.coverage).toBe('NOT_APPLICABLE');
    expect(r.evidenceCoverageIndex01).toBeNull();
    expect(r.supportingCriteriaIndex01).toBeNull();
    expect(r.tally.required).toBe(0);
    expect(r.factorBreakdown).toEqual([]);
  });
  it('has independent transparent group counts, never terrestrial weights', () => {
    const r = route(assess(evidence(SURFACE)));
    expect(r.factorBreakdown.map((g) => [g.group, g.tally.required])).toEqual([
      ['THERMAL_RESERVOIR_AND_CONFINEMENT', 3],
      ['CHEMISTRY_AND_ENERGY', 2],
      ['RADIATION_AND_SHIELDING', 1],
      ['DYNAMICAL_STABILITY', 1],
      ['GRAVITY_AND_RETENTION', 1],
    ]);
    expect(r.factorBreakdown.reduce((n, g) => n + g.tally.required, 0)).toBe(8);
  });
  it('does not leak a hidden physical factor into observer coverage or provenance', () => {
    const data = evidence(SURFACE).map((c, i) => i === 0 ? {
      ...c, accessibleToObserver: false, sourceKey: 'secret-ground-truth',
    } : c);
    const internal = assess(data);
    const publicReport = assess(data, { perspective: 'OBSERVED_KNOWLEDGE' });
    expect(route(internal).status).toBe('CONSTRAINTS_COMPATIBLE');
    expect(route(publicReport).status).toBe('INSUFFICIENT_EVIDENCE');
    expect(route(publicReport).evidenceCoverageIndex01).toBe(7 / 8);
    expect(route(publicReport).missingConstraints).toContain('TEMPERATURE');
    expect(route(publicReport).criteria[0].sourceKey).toBeNull();
    expect(JSON.stringify(publicReport)).not.toContain('secret-ground-truth');
  });
  it('keeps partially observed moon shell hypotheses non-confirmed', () => {
    const r = route(assess([evidence(UNDERGROUND, { basis: 'INFERRED_MODEL' })[0]], {
      bodyKind: 'MOON', perspective: 'OBSERVED_KNOWLEDGE',
    }), UNDERGROUND);
    expect(r.coverage).toBe('PARTIAL');
    expect(r.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(r.decisiveBasis).toBe('NOT_DETERMINED');
  });
  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)(
    'keeps the same environmental evidence ratios for %s', (multiplicity) => {
      const r = route(assess(evidence(SURFACE), { multiplicity }));
      expect(r.supportingCriteriaIndex01).toBe(1);
      expect(r.status).toBe('CONSTRAINTS_COMPATIBLE');
    },
  );
  it('is order-independent with deterministic evidence, seeds and planet names', () => {
    const a = route(assess([...evidence(SURFACE)].reverse()));
    const b = route(assess(evidence(SURFACE), { bodyKey: 'another-seed/planet' }));
    expect(a).toEqual(b);
  });
  it('never mutates physical evidence, models or source assessment', () => {
    const inp = Object.freeze(input(Object.freeze(evidence(SURFACE).map((e) => Object.freeze(e)))));
    const original = HabitabilityEngine.evaluate(inp);
    const first = HabitabilityIndicesResolver31_6.summarize(original);
    const second = HabitabilityIndicesResolver31_6.summarize(original);
    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.routes[0].factorBreakdown[0].tally)).toBe(true);
    expect(Object.isFrozen(first.routes[0].criteria[0])).toBe(true);
    expect(Object.isFrozen(original.routes[0].constraints[0])).toBe(true);
  });
  it('refuses tampered contracts and duplicate route identities', () => {
    expect(() => HabitabilityIndicesResolver31_6.summarize(forged((x) => {
      x.contractVersion = '29.5';
    }))).toThrow();
    expect(() => HabitabilityIndicesResolver31_6.summarize(forged((x) => {
      x.routes[1].route = SURFACE;
    }))).toThrow();
  });
  it('refuses stale route status or decisive certainty inconsistent with evidence', () => {
    expect(() => HabitabilityIndicesResolver31_6.summarize(forged((x) => {
      x.routes[0].status = 'INSUFFICIENT_EVIDENCE';
    }))).toThrow();
    expect(() => HabitabilityIndicesResolver31_6.summarize(forged((x) => {
      x.routes[0].resolution = 'INFERRED_EVIDENCE';
    }))).toThrow();
  });
  it('refuses invented criteria, duplicated criteria or contradictory missing lists', () => {
    expect(() => HabitabilityIndicesResolver31_6.summarize(forged((x) => {
      x.routes[0].constraints[0].constraint = 'FAKE';
    }))).toThrow();
    expect(() => HabitabilityIndicesResolver31_6.summarize(forged((x) => {
      x.routes[0].constraints[0].constraint = x.routes[0].constraints[1].constraint;
    }))).toThrow();
    expect(() => HabitabilityIndicesResolver31_6.summarize(forged((x) => {
      x.routes[0].missingConstraints.push('TEMPERATURE');
    }))).toThrow();
  });
  it('refuses forged absent provenance and a false direct-observation status', () => {
    expect(() => HabitabilityIndicesResolver31_6.summarize(forged((x) => {
      x.routes[0].constraints[0].sourceKey = null;
    }))).toThrow();
    expect(() => HabitabilityIndicesResolver31_6.summarize(forged((x) => {
      x.routes[0].constraints[0].basis = 'UNRESOLVED';
    }))).toThrow();
  });
  it('rejects a speculative route falsely promoted before 31.11', () => {
    expect(() => HabitabilityIndicesResolver31_6.summarize(forged((x) => {
      x.routes[2].status = 'CONSTRAINTS_COMPATIBLE';
    }))).toThrow();
  });
  it('refuses historical ages and stale epochs instead of creating a timeline', () => {
    expect(() => HabitabilityIndicesResolver31_6.summarize(forged((x) => {
      x.time.kind = 'HISTORICAL_EPOCH';
    }))).toThrow();
    expect(() => HabitabilityIndicesResolver31_6.summarize(forged((x) => {
      x.time.systemAgeBillionYears = -1;
    }))).toThrow();
  });
  it('remains fast and deterministic across thousands of read-only evaluations', () => {
    const assessed = HabitabilityEngine.evaluate(input([...evidence(SURFACE), ...evidence(UNDERGROUND)]));
    const before = HabitabilityIndicesResolver31_6.summarize(assessed);
    for (let i = 0; i < 1024; i++) {
      expect(HabitabilityIndicesResolver31_6.summarize(assessed)).toEqual(before);
    }
  });
});
