import { describe, expect, it } from 'vitest';
import {
  ALTERNATIVE_CRITERIA_31_11, ALTERNATIVE_ROUTES_31_11,
  type AlternativeEvidence31_11, type AlternativeRoute31_11,
} from '../../domain/habitability/habitability-alternative-routes-31-11';
import type { HabitabilityScenarioInput } from '../../domain/habitability/habitability-scenario';
import { HabitabilityEngine } from './habitability-engine';
import { HabitabilityIndicesResolver31_6 } from './habitability-indices-resolver-31-6';
import { HabitabilityAlternativeRoutesResolver31_11 } from './habitability-alternative-routes-resolver-31-11';

const BASE: HabitabilityScenarioInput = {
  bodyKind: 'PLANET', bodyKey: 'system-P/planet-3', multiplicity: 'SINGLE',
  perspective: 'SIMULATED_REALITY',
  time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 4.1 }, evidence: [],
};
const HYDROCARBON: AlternativeRoute31_11 = 'SURFACE_LIQUID_HYDROCARBONS';
const BRINE: AlternativeRoute31_11 = 'SUBSURFACE_AMMONIA_WATER_MIXTURE';
const CLOUD: AlternativeRoute31_11 = 'ACIDIC_AEROSOL_DROPLETS';
const SOURCE: AlternativeEvidence31_11['scope'] = 'RESOLVED_CURRENT_BODY';

function datum(
  route: AlternativeRoute31_11, criterion: AlternativeEvidence31_11['criterion'],
  overrides: Partial<AlternativeEvidence31_11> = {},
): AlternativeEvidence31_11 {
  return {
    bodyKind: 'PLANET', bodyKey: BASE.bodyKey, systemAgeBillionYears: BASE.time.systemAgeBillionYears,
    route, criterion, verdict: 'SUPPORTS', basis: 'PHYSICAL_MODEL',
    sourceKey: `resolved.${route}.${criterion}`, accessibleToObserver: true,
    scope: SOURCE, ...overrides,
  };
}
function full(route: AlternativeRoute31_11): AlternativeEvidence31_11[] {
  return ALTERNATIVE_CRITERIA_31_11.map((criterion) => datum(route, criterion));
}
function assess(
  evidence: readonly AlternativeEvidence31_11[] = [],
  ctx: Partial<HabitabilityScenarioInput> = {},
) {
  return HabitabilityAlternativeRoutesResolver31_11.assess(
    HabitabilityEngine.evaluate({ ...BASE, ...ctx }), evidence,
  );
}
function niche(route: AlternativeRoute31_11, evidence: readonly AlternativeEvidence31_11[] = [],
  ctx: Partial<HabitabilityScenarioInput> = {}) {
  const result = assess(evidence, ctx).routes.find((entry) => entry.definition.route === route);
  if (!result) throw new Error('route not found');
  return result;
}

describe('GENESIS 31.11 — alternate solvent, metabolic hypotheses and niches', () => {
  it('publishes exactly three physically distinct, non-life alternative scenarios', () => {
    expect(assess().routes.map((r) => r.definition.route)).toEqual(ALTERNATIVE_ROUTES_31_11);
    expect(assess().contractVersion).toBe('31.11-CT0');
    expect(assess().interpretation).toBe('ENVIRONMENTAL_CONSTRAINTS_NOT_PROBABILITY_OF_LIFE');
    expect(assess().routes.every((r) => r.lifePresence === 'NOT_EVALUATED')).toBe(true);
  });
  it('begins unresolved: atmospheric methane, ammonia and sulfur are never liquid reservoirs by default', () => {
    const routes = assess().routes;
    expect(routes.every((r) => r.status === 'INSUFFICIENT_RESOLVED_EVIDENCE')).toBe(true);
    expect(routes.every((r) => r.evidenceCoverage01 === 0)).toBe(true);
    expect(routes.every((r) => r.missingCriteria.length === ALTERNATIVE_CRITERIA_31_11.length)).toBe(true);
    expect(routes.flatMap((r) => r.constraints).every((c) => c.sourceKey === null)).toBe(true);
  });
  it('treats biological methane/ethane metabolism as highly speculative even with fully characterized liquid lakes', () => {
    const result = niche(HYDROCARBON, full(HYDROCARBON));
    expect(result.status).toBe('PHYSICAL_SCENARIO_SUPPORTED');
    expect(result.evidenceCoverage01).toBe(1);
    expect(result.definition.solventFamily).toBe('METHANE_ETHANE');
    expect(result.definition.metabolismSpeculation).toBe('HIGHLY_SPECULATIVE_BIOCHEMISTRY');
    expect(result.definition.biologicalPathwayDemonstrated).toBe(false);
    expect(result.metabolicFeasibility).toBe('NOT_ESTABLISHED');
    expect(result.lifePresence).toBe('NOT_EVALUATED');
  });
  it('does not misclassify ammonia-water as nonaqueous or a confirmed biological solvent', () => {
    const result = niche(BRINE, full(BRINE));
    expect(result.definition.solventFamily).toBe('AMMONIA_WATER');
    expect(result.definition.niche).toBe('SUBSURFACE_BRINE');
    expect(result.definition.solventChemistry).toBe('CONDITIONAL_PHYSICAL_EXTRAPOLATION');
    expect(result.definition.metabolismSpeculation).toBe('SPECULATIVE_BIOCHEMISTRY');
    expect(result.metabolicFeasibility).toBe('NOT_ESTABLISHED');
  });
  it('does not promote known acidic atmospheric chemistry to life in droplets', () => {
    const result = niche(CLOUD, full(CLOUD));
    expect(result.definition.solventFamily).toBe('AQUEOUS_SULFURIC_ACID');
    expect(result.definition.niche).toBe('ATMOSPHERIC_DROPLET');
    expect(result.definition.metabolismSpeculation).toBe('HIGHLY_SPECULATIVE_BIOCHEMISTRY');
    expect(result.lifePresence).toBe('NOT_EVALUATED');
  });
  it('does not infer the other two niches from evidence supporting only one', () => {
    const result = assess(full(HYDROCARBON));
    expect(result.routes[0].status).toBe('PHYSICAL_SCENARIO_SUPPORTED');
    expect(result.routes[1].status).toBe('INSUFFICIENT_RESOLVED_EVIDENCE');
    expect(result.routes[2].status).toBe('INSUFFICIENT_RESOLVED_EVIDENCE');
  });
  it('retains a decisive physical contradiction despite five supporting criteria', () => {
    const e = full(HYDROCARBON).map((item) => item.criterion === 'LOCAL_LIQUID_SOLVENT_PHASE'
      ? { ...item, verdict: 'CONTRADICTS' as const } : item);
    const r = niche(HYDROCARBON, e);
    expect(r.status).toBe('PHYSICAL_CONSTRAINTS_INCOMPATIBLE');
    expect(r.evidenceCoverage01).toBe(1);
    expect(r.decisiveContradictions).toEqual(['LOCAL_LIQUID_SOLVENT_PHASE']);
  });
  it('refuses to treat conditional lunar ice scenarios as resolved ammonia brines', () => {
    const conditional = datum(BRINE, 'EXISTING_RESERVOIR', {
      basis: 'INFERRED_MODEL', scope: 'CONDITIONAL_SCENARIO',
      sourceKey: 'moon.C.conditionalIceOcean',
    });
    const r = niche(BRINE, [{ ...conditional, bodyKind: 'MOON' }], { bodyKind: 'MOON' });
    expect(r.status).toBe('INSUFFICIENT_RESOLVED_EVIDENCE');
    expect(r.constraints[1].verdict).toBe('UNRESOLVED');
    expect(r.constraints[1].conditionalCandidate).toBe(true);
    expect(r.evidenceCoverage01).toBe(0);
  });
  it('never treats conditional negative evidence as a resolved exclusion', () => {
    const item = datum(CLOUD, 'PRESSURE_AND_NICHE_CONFINEMENT', {
      verdict: 'CONTRADICTS', basis: 'INFERRED_MODEL', scope: 'CONDITIONAL_SCENARIO',
    });
    const r = niche(CLOUD, [item]);
    expect(r.status).toBe('INSUFFICIENT_RESOLVED_EVIDENCE');
    expect(r.decisiveContradictions).toEqual([]);
  });
  it('reports explicit partial environmental evidence without extrapolating unknown chemistry', () => {
    const r = niche(HYDROCARBON, [datum(HYDROCARBON, 'LOCAL_LIQUID_SOLVENT_PHASE')]);
    expect(r.status).toBe('INSUFFICIENT_RESOLVED_EVIDENCE');
    expect(r.evidenceCoverage01).toBe(1 / 6);
    expect(r.missingCriteria.length).toBe(5);
  });
  it('does not leak any hidden physical evidence or hidden source key to OBSERVED_KNOWLEDGE', () => {
    const hidden = datum(BRINE, 'EXISTING_RESERVOIR', {
      accessibleToObserver: false, sourceKey: 'secret.buriedOcean',
    });
    const visible = niche(BRINE, [hidden], { perspective: 'OBSERVED_KNOWLEDGE' });
    expect(visible.constraints[1]).toEqual({
      criterion: 'EXISTING_RESERVOIR', verdict: 'UNRESOLVED',
      basis: 'UNRESOLVED', sourceKey: null, conditionalCandidate: false,
    });
    expect(JSON.stringify(visible)).not.toMatch(/secret|buriedOcean/);
    const reality = niche(BRINE, [hidden]);
    expect(reality.constraints[1].sourceKey).toBe('secret.buriedOcean');
  });
  it('a conditional candidate cannot leak its presence or source to a viewer lacking access', () => {
    const hidden = datum(BRINE, 'EXISTING_RESERVOIR', {
      verdict: 'SUPPORTS', basis: 'INFERRED_MODEL',
      accessibleToObserver: false, scope: 'CONDITIONAL_SCENARIO',
      sourceKey: 'moon.private.iceShell',
    });
    const r = niche(BRINE, [hidden], { perspective: 'OBSERVED_KNOWLEDGE' });
    expect(r.constraints[1].conditionalCandidate).toBe(false);
    expect(r.constraints[1].sourceKey).toBe(null);
  });
  it('a conditional candidate can be disclosed only by the discovery layer', () => {
    const item = datum(BRINE, 'EXISTING_RESERVOIR', {
      verdict: 'SUPPORTS', basis: 'INFERRED_MODEL',
      scope: 'CONDITIONAL_SCENARIO', sourceKey: 'moon.C.conditionalScenario',
    });
    const visible = niche(BRINE, [item], { perspective: 'OBSERVED_KNOWLEDGE' });
    expect(visible.constraints[1].conditionalCandidate).toBe(true);
    expect(visible.constraints[1].verdict).toBe('UNRESOLVED');
  });
  it('never changes the prior 31.1 routes, the original alternative placeholder or the physical evidence', () => {
    const prior = HabitabilityEngine.evaluate(BASE);
    const data = Object.freeze(full(HYDROCARBON).map((item) => Object.freeze(item)));
    const before = JSON.stringify(prior);
    const output = HabitabilityAlternativeRoutesResolver31_11.assess(prior, data);
    expect(prior.routes[2].status).toBe('MODEL_NOT_IMPLEMENTED');
    expect(JSON.stringify(prior)).toBe(before);
    expect(output.routes[0].status).toBe('PHYSICAL_SCENARIO_SUPPORTED');
    expect(Object.isFrozen(output)).toBe(true);
    expect(Object.isFrozen(output.routes)).toBe(true);
    expect(Object.isFrozen(output.routes[0].constraints[0])).toBe(true);
  });
  it.each(['SINGLE', 'BINARY', 'TRIPLE', 'UNKNOWN'] as const)(
    'does not change chemical physics with %s host multiplicity', (multiplicity) => {
      const r = niche(HYDROCARBON, full(HYDROCARBON), { multiplicity });
      expect(r.status).toBe('PHYSICAL_SCENARIO_SUPPORTED');
      expect(r.evidenceCoverage01).toBe(1);
    },
  );
  it('is independent of planet name, ordinal, seed and order of evidence', () => {
    const a = assess([...full(BRINE), datum(CLOUD, 'LOCAL_LIQUID_SOLVENT_PHASE')]);
    const b = assess([datum(CLOUD, 'LOCAL_LIQUID_SOLVENT_PHASE'), ...full(BRINE)].reverse()
      .map((x) => ({ ...x, bodyKey: 'other-world-seed-938487' })),
      { bodyKey: 'other-world-seed-938487' });
    expect(a.routes).toEqual(b.routes);
    expect(assess(full(BRINE)).routes).toEqual(assess(full(BRINE)).routes);
  });
  it('refuses evidence from a different body or CT-0 time, including planet/moon confusion', () => {
    expect(() => assess([datum(HYDROCARBON, 'EXISTING_RESERVOIR', { bodyKey: 'other-body' })]))
      .toThrow(/identity/);
    expect(() => assess([datum(HYDROCARBON, 'EXISTING_RESERVOIR', { bodyKind: 'MOON' })]))
      .toThrow(/identity/);
    expect(() => assess([datum(HYDROCARBON, 'EXISTING_RESERVOIR', {
      systemAgeBillionYears: 1.5,
    })])).toThrow(/epoch/);
  });
  it('rejects duplicate route/criterion evidence instead of silently choosing one', () => {
    const e = datum(BRINE, 'EXISTING_RESERVOIR');
    expect(() => assess([e, e])).toThrow(/duplicate/);
  });
  it('rejects a source key without provenance', () => {
    expect(() => assess([datum(CLOUD, 'EXISTING_RESERVOIR', { sourceKey: ' ' })]))
      .toThrow(/provenance/);
  });
  it('rejects unsupported route or invented criterion keys', () => {
    expect(() => assess([datum('HYDROGEN_OCEAN' as AlternativeRoute31_11, 'EXISTING_RESERVOIR')]))
      .toThrow(/invalid/);
    expect(() => assess([datum(CLOUD, 'ALIEN_METABOLISM' as AlternativeEvidence31_11['criterion'])]))
      .toThrow(/invalid/);
  });
  it('refuses forged direct observations hidden from the observer', () => {
    expect(() => assess([datum(CLOUD, 'LOCAL_LIQUID_SOLVENT_PHASE', {
      basis: 'DIRECT_OBSERVATION', accessibleToObserver: false,
    })])).toThrow(/direct observations/);
  });
  it('refuses direct measurements labelled only conditional', () => {
    expect(() => assess([datum(CLOUD, 'EXISTING_RESERVOIR', {
      basis: 'DIRECT_OBSERVATION', scope: 'CONDITIONAL_SCENARIO',
    })])).toThrow(/direct observations/);
  });
  it('rejects unpaired unresolved verdicts and evidence basis', () => {
    expect(() => assess([datum(BRINE, 'LOCAL_LIQUID_SOLVENT_PHASE', {
      verdict: 'UNRESOLVED', basis: 'PHYSICAL_MODEL',
    })])).toThrow(/agree/);
    expect(() => assess([datum(BRINE, 'LOCAL_LIQUID_SOLVENT_PHASE', {
      verdict: 'SUPPORTS', basis: 'UNRESOLVED',
    })])).toThrow(/agree/);
  });
  it('rejects promoting unresolved lunar subsurface water to a confirmed actual reservoir', () => {
    expect(() => assess([datum(BRINE, 'EXISTING_RESERVOIR', {
      basis: 'INFERRED_MODEL', scope: 'RESOLVED_CURRENT_BODY',
    })])).toThrow(/actual liquid reservoir/);
  });
  it('rejects physically conditional results disguised as directly resolved physical measurements', () => {
    expect(() => assess([datum(CLOUD, 'EXISTING_RESERVOIR', {
      basis: 'PHYSICAL_MODEL', scope: 'CONDITIONAL_SCENARIO',
    })])).toThrow(/conditional supporting/);
  });
  it('rejects forged CT-0 prior snapshot and historic times', () => {
    const prior = HabitabilityEngine.evaluate(BASE);
    expect(() => HabitabilityAlternativeRoutesResolver31_11.assess({
      ...prior, time: { kind: 'HISTORICAL', systemAgeBillionYears: 3.1 } as never,
    }, [])).toThrow(/CT-0/);
    expect(() => HabitabilityAlternativeRoutesResolver31_11.assess({
      ...prior, contractVersion: '31.2' as never,
    }, [])).toThrow(/CT-0/);
  });
  it('keeps observer projection monotonic: no hidden source can become visible by ordering', () => {
    const input = [...full(HYDROCARBON)].map((x, i) => ({
      ...x, accessibleToObserver: i % 2 === 0,
    }));
    const reality = niche(HYDROCARBON, input);
    const obs = niche(HYDROCARBON, input, { perspective: 'OBSERVED_KNOWLEDGE' });
    expect(reality.status).toBe('PHYSICAL_SCENARIO_SUPPORTED');
    expect(obs.status).toBe('INSUFFICIENT_RESOLVED_EVIDENCE');
    expect(obs.evidenceCoverage01).toBe(3 / 6);
    expect(obs.constraints.filter((x) => x.sourceKey === null).length).toBe(3);
  });
  it('preserves the existing 31.6 aqueous summary without polluting it with speculative routes', () => {
    const original = HabitabilityEngine.evaluate(BASE);
    const before = HabitabilityIndicesResolver31_6.summarize(original);
    const candidate = HabitabilityAlternativeRoutesResolver31_11.assess(original, full(HYDROCARBON));
    const after = HabitabilityIndicesResolver31_6.summarize(original);
    expect(after).toEqual(before);
    expect(before.routes[2].status).toBe('MODEL_NOT_IMPLEMENTED');
    expect(candidate.routes[0].status).toBe('PHYSICAL_SCENARIO_SUPPORTED');
  });
  it('handles 512 immutable repeat projections without accumulation or changing outputs', () => {
    const prior = HabitabilityEngine.evaluate({ ...BASE, bodyKind: 'MOON', multiplicity: 'TRIPLE' });
    const inputs = full(BRINE).map((x) => ({ ...x, bodyKind: 'MOON' as const }));
    const reference = JSON.stringify(HabitabilityAlternativeRoutesResolver31_11.assess(prior, inputs));
    for (let i = 0; i < 512; i++) {
      const result = HabitabilityAlternativeRoutesResolver31_11.assess(prior, inputs);
      expect(JSON.stringify(result)).toBe(reference);
    }
  });
  it('does not emit life probability, confirmed biosignatures or abiogenesis', () => {
    const json = JSON.stringify(assess(full(HYDROCARBON)));
    expect(json).not.toMatch(/abiogenesis|biosignature|lifeProbability|lifeConfirmed|metabolismConfirmed|organism/i);
  });
});
