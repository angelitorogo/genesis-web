import { describe, expect, it } from 'vitest';
import {
  HABITABILITY_REQUIREMENTS_31_1,
  type HabitabilityConstraint,
  type HabitabilityEvidence,
  type HabitabilityRoute,
  type HabitabilityScenarioInput,
} from '../../domain/habitability/habitability-scenario';
import { HabitabilityEngine } from './habitability-engine';

function scenario(
  overrides: Partial<HabitabilityScenarioInput> = {},
): HabitabilityScenarioInput {
  return {
    bodyKind: 'PLANET',
    bodyKey: 'test-reference-planet',
    multiplicity: 'SINGLE',
    perspective: 'SIMULATED_REALITY',
    time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: null },
    evidence: [],
    ...overrides,
  };
}

function routeEvidence(
  route: Exclude<HabitabilityRoute, 'ALTERNATIVE_CHEMISTRY'>,
  modifications: Partial<HabitabilityEvidence> = {},
): HabitabilityEvidence[] {
  return HABITABILITY_REQUIREMENTS_31_1[route].map((constraint) => ({
    route,
    constraint,
    verdict: 'SUPPORTS' as const,
    basis: 'PHYSICAL_MODEL' as const,
    accessibleToObserver: true,
    sourceKey: `resolved.${constraint}`,
    ...modifications,
  }));
}

function routeResult(
  input: HabitabilityScenarioInput,
  route: HabitabilityRoute = 'SURFACE_AQUEOUS',
) {
  const result = HabitabilityEngine.evaluate(input).routes.find((value) => value.route === route);
  if (!result) throw new Error(`Missing route ${route}`);
  return result;
}

describe('HabitabilityEngine 31.1 — pure environmental scenario contracts', () => {
  it('does not infer life, scores, certainty or compatible environments from missing data', () => {
    const assessed = HabitabilityEngine.evaluate(scenario());
    expect(assessed.contractVersion).toBe('31.1-CT0');
    expect(assessed.routes.map((r) => r.status)).toEqual([
      'INSUFFICIENT_EVIDENCE', 'INSUFFICIENT_EVIDENCE', 'MODEL_NOT_IMPLEMENTED',
    ]);
    expect(assessed.routes[0].missingConstraints.length).toBeGreaterThan(0);
    expect(JSON.stringify(assessed)).not.toMatch(/probability|lifePresent|biosignature|organism|score01|habitableIndex/i);
  });

  it('consolidates only fully resolved surface aqueous constraints', () => {
    const evidence = routeEvidence('SURFACE_AQUEOUS');
    const resolved = routeResult(scenario({ evidence }));
    expect(resolved.status).toBe('CONSTRAINTS_COMPATIBLE');
    expect(resolved.resolution).toBe('RESOLVED_EVIDENCE');
    expect(resolved.missingConstraints).toEqual([]);
    expect(resolved.constraints.every((c) => c.sourceKey?.startsWith('resolved.'))).toBe(true);
    expect(routeResult(scenario({ evidence }), 'SUBSURFACE_AQUEOUS').status)
      .toBe('INSUFFICIENT_EVIDENCE');
  });

  it('keeps confirmed contradiction decisive while other constraints remain unknown', () => {
    const contradiction = routeEvidence('SURFACE_AQUEOUS')[0];
    const route = routeResult(scenario({
      evidence: [{ ...contradiction, verdict: 'CONTRADICTS' }],
    }));
    expect(route.status).toBe('CONSTRAINTS_INCOMPATIBLE');
    expect(route.resolution).toBe('RESOLVED_EVIDENCE');
    expect(route.missingConstraints.length).toBeGreaterThan(0);
  });

  it('distinguishes model inference from resolved evidence without calling either life', () => {
    const evidence = routeEvidence('SURFACE_AQUEOUS').map((item, index) =>
      index === 0 ? { ...item, basis: 'INFERRED_MODEL' as const } : item,
    );
    expect(routeResult(scenario({ evidence })).resolution).toBe('INFERRED_EVIDENCE');
  });

  it('never promotes hidden simulated reality into observed knowledge', () => {
    const evidence = routeEvidence('SURFACE_AQUEOUS').map((item, index) => ({
      ...item,
      accessibleToObserver: index !== 0,
    }));
    expect(routeResult(scenario({ evidence })).status).toBe('CONSTRAINTS_COMPATIBLE');
    const visible = routeResult(scenario({ evidence, perspective: 'OBSERVED_KNOWLEDGE' }));
    expect(visible.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(visible.missingConstraints).toContain('TEMPERATURE');
    expect(visible.constraints.find((c) => c.constraint === 'TEMPERATURE')?.sourceKey).toBe(null);
    expect(visible.constraints.find((c) => c.constraint === 'TEMPERATURE')?.basis).toBe('UNRESOLVED');
  });

  it('maintains independent surface and subsurface paths for moons without Earth gravity criteria', () => {
    const moon = scenario({
      bodyKind: 'MOON',
      multiplicity: 'TRIPLE',
      evidence: routeEvidence('SUBSURFACE_AQUEOUS'),
    });
    expect(routeResult(moon, 'SUBSURFACE_AQUEOUS').status).toBe('CONSTRAINTS_COMPATIBLE');
    expect(routeResult(moon).status).toBe('INSUFFICIENT_EVIDENCE');
    expect(HABITABILITY_REQUIREMENTS_31_1.SUBSURFACE_AQUEOUS).not.toContain('GRAVITY_AND_RETENTION');
  });

  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)(
    'produces identical physical assessments under %s without random seeds',
    (multiplicity) => {
      const evidence = routeEvidence('SURFACE_AQUEOUS');
      const a = routeResult(scenario({ multiplicity, bodyKey: 'A', evidence }));
      const b = routeResult(scenario({ multiplicity, bodyKey: 'B', evidence }));
      expect(a).toEqual(b);
    },
  );

  it('does not modify frozen physical inputs and returns immutable route projections', () => {
    const evidence = Object.freeze(routeEvidence('SURFACE_AQUEOUS').map((e) => Object.freeze(e)));
    const input = Object.freeze(scenario({ evidence, time: Object.freeze({
      kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: 4.1,
    }) }));
    const first = HabitabilityEngine.evaluate(input);
    const second = HabitabilityEngine.evaluate(input);
    expect(first).toEqual(second);
    expect(Object.isFrozen(first.routes)).toBe(true);
    expect(Object.isFrozen(first.routes[0].constraints[0])).toBe(true);
    expect(first.time.systemAgeBillionYears).toBe(4.1);
  });

  it('rejects historic ages and invalid CT-0 epochs rather than inventing time series', () => {
    expect(() => HabitabilityEngine.evaluate(scenario({
      time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: -1 },
    }))).toThrow(/CT-0/);
    expect(() => HabitabilityEngine.evaluate(scenario({
      time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: Number.NaN },
    }))).toThrow(/CT-0/);
    expect(() => HabitabilityEngine.evaluate(scenario({
      time: { kind: 'HISTORICAL_EPOCH', systemAgeBillionYears: 2 } as never,
    }))).toThrow(/CT-0/);
  });

  it('does not implement exotic solvents before 31.11, even if evidence is injected', () => {
    expect(routeResult(scenario(), 'ALTERNATIVE_CHEMISTRY').status).toBe('MODEL_NOT_IMPLEMENTED');
    const illegal = routeEvidence('SURFACE_AQUEOUS')[0];
    expect(() => HabitabilityEngine.evaluate(scenario({ evidence: [
      { ...illegal, route: 'ALTERNATIVE_CHEMISTRY' },
    ] }))).toThrow(/31.11/);
  });

  it('rejects duplicate and physically inconsistent evidence contracts', () => {
    const same = routeEvidence('SURFACE_AQUEOUS')[0];
    expect(() => HabitabilityEngine.evaluate(scenario({ evidence: [same, same] })))
      .toThrow(/Duplicate/);
    expect(() => HabitabilityEngine.evaluate(scenario({ evidence: [
      { ...same, verdict: 'UNRESOLVED' },
    ] }))).toThrow(/must agree/);
    expect(() => HabitabilityEngine.evaluate(scenario({ evidence: [
      { ...same, basis: 'UNRESOLVED' },
    ] }))).toThrow(/must agree/);
    expect(() => HabitabilityEngine.evaluate(scenario({ evidence: [
      { ...same, basis: 'DIRECT_OBSERVATION', accessibleToObserver: false },
    ] }))).toThrow(/hidden/);
  });

  it('cannot substitute an unrelated legacy index or a physical factor from the wrong route', () => {
    const sample = routeEvidence('SURFACE_AQUEOUS')[0];
    expect(() => HabitabilityEngine.evaluate(scenario({ evidence: [
      { ...sample, constraint: 'overallHabitabilityIndex01' as HabitabilityConstraint },
    ] }))).toThrow(/Unsupported evidence.constraint/);
    expect(() => HabitabilityEngine.evaluate(scenario({ evidence: [
      { ...sample, route: 'SUBSURFACE_AQUEOUS', constraint: 'GRAVITY_AND_RETENTION' },
    ] }))).toThrow(/Unsupported evidence.constraint/);
  });

  it('requires explicit science provenance, never derives it from a body seed or name', () => {
    const sample = routeEvidence('SURFACE_AQUEOUS')[0];
    expect(() => HabitabilityEngine.evaluate(scenario({ evidence: [
      { ...sample, sourceKey: '' },
    ] }))).toThrow(/sourceKey/);
    expect(() => HabitabilityEngine.evaluate(scenario({ evidence: [
      { ...sample, accessibleToObserver: undefined as never },
    ] }))).toThrow(/explicit boolean/);
  });
});
