import { describe, expect, it } from 'vitest';
import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import {
  HABITABILITY_REQUIREMENTS_31_1,
  type HabitabilityEvidence, type HabitabilityScenarioInput,
} from '../../domain/habitability/habitability-scenario';
import {
  ALTERNATIVE_CRITERIA_31_11,
  type AlternativeEvidence31_11,
} from '../../domain/habitability/habitability-alternative-routes-31-11';
import type {
  HabitabilityKnowledgeInput31_12,
} from '../../domain/habitability/habitability-knowledge-31-12';
import { HabitabilityKnowledgeResolver31_12 as Resolver } from './habitability-knowledge-resolver-31-12';

const BASE: HabitabilityKnowledgeInput31_12 = {
  bodyKind: 'PLANET', bodyKey: 'system-31/planet-2', multiplicity: 'BINARY',
  time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 3.7 },
  aqueousEvidence: [], alternativeEvidence: [],
};
const HYDRO = 'SURFACE_LIQUID_HYDROCARBONS' as const;
function water(
  constraint: HabitabilityEvidence['constraint'],
  options: Partial<HabitabilityEvidence> = {},
): HabitabilityEvidence {
  return {
    route: 'SURFACE_AQUEOUS', constraint, verdict: 'SUPPORTS',
    basis: 'PHYSICAL_MODEL', accessibleToObserver: true,
    sourceKey: `model.${constraint}`, ...options,
  };
}
function hydro(
  criterion: AlternativeEvidence31_11['criterion'],
  options: Partial<AlternativeEvidence31_11> = {},
): AlternativeEvidence31_11 {
  return {
    route: HYDRO, criterion, bodyKind: BASE.bodyKind, bodyKey: BASE.bodyKey,
    systemAgeBillionYears: BASE.time.systemAgeBillionYears,
    verdict: 'SUPPORTS', basis: 'PHYSICAL_MODEL',
    sourceKey: `model.hydro.${criterion}`, accessibleToObserver: true,
    scope: 'RESOLVED_CURRENT_BODY', ...options,
  };
}
function allWater(): HabitabilityEvidence[] {
  return HABITABILITY_REQUIREMENTS_31_1.SURFACE_AQUEOUS.map((c) => water(c));
}
function allHydro(): AlternativeEvidence31_11[] {
  return ALTERNATIVE_CRITERIA_31_11.map((c) => hydro(c));
}
function observed(
  input: HabitabilityKnowledgeInput31_12 = BASE,
  state: DiscoveryStateValue = DiscoveryState.CONFIRMED,
  scientificFicheAccessible = true,
) {
  return Resolver.projectObserved(input, { discoveryState: state, scientificFicheAccessible });
}
function aqueous(input: HabitabilityKnowledgeInput31_12 = BASE) {
  return observed(input).aqueousIndices?.routes[0];
}
function alternate(input: HabitabilityKnowledgeInput31_12 = BASE) {
  return observed(input).alternativeRoutes?.routes[0];
}

describe('GENESIS 31.12 — simulated reality, physical potential and observed knowledge', () => {
  it('keeps three epistemic layers distinct and never evaluates biological presence', () => {
    const actual = Resolver.assessInternal(BASE);
    expect(actual.simulatedReality.layer).toBe('SIMULATED_REALITY');
    expect(actual.physicalPotential.layer).toBe('PHYSICAL_POTENTIAL');
    expect(actual.simulatedReality.lifePresence).toBe('NOT_EVALUATED');
    expect(actual.physicalPotential.lifeProbability).toBe('NOT_DEFINED');
    expect(observed().layer).toBe('OBSERVED_KNOWLEDGE');
    expect(observed().lifePresence).toBe('NOT_EVALUATED');
  });
  it('does not conflate old alternative placeholder with the three specialized 31.11 routes', () => {
    const result = Resolver.assessInternal({ ...BASE, alternativeEvidence: allHydro() });
    expect(result.physicalPotential.aqueousIndices.routes[2].status).toBe('MODEL_NOT_IMPLEMENTED');
    expect(result.physicalPotential.alternativeRoutes.routes[0].status).toBe('PHYSICAL_SCENARIO_SUPPORTED');
    expect(result.physicalPotential.alternativeRoutes.routes[0].metabolicFeasibility).toBe('NOT_ESTABLISHED');
  });
  it.each([
    DiscoveryState.UNKNOWN, DiscoveryState.DETECTED, DiscoveryState.DISCOVERED,
    DiscoveryState.VISITED, DiscoveryState.CATALOGUED,
  ])('locks detailed scientific data before CONFIRMED (%s)', (state) => {
    const hidden = {
      ...BASE, bodyKey: 'raw.secret.98765',
      aqueousEvidence: [water('TEMPERATURE', { sourceKey: 'classified.highTemperature' })],
    };
    const report = observed(hidden, state);
    expect(report.access).toBe('SCIENTIFIC_FICHE_LOCKED');
    expect(report.bodyKey).toBe(null);
    expect(report.bodyKind).toBe(null);
    expect(report.time).toBe(null);
    expect(report.aqueousIndices).toBe(null);
    expect(report.alternativeRoutes).toBe(null);
    expect(JSON.stringify(report)).not.toMatch(/98765|classified|highTemperature/);
  });
  it('keeps CONFIRMED locked when the scientific fiche is not authorized', () => {
    const result = observed(BASE, DiscoveryState.CONFIRMED, false);
    expect(result.access).toBe('SCIENTIFIC_FICHE_LOCKED');
    expect(result.aqueousIndices).toBe(null);
  });
  it('unlocks the observer-safe projection only for CONFIRMED with explicit fiche permission', () => {
    const report = observed();
    expect(report.access).toBe('SCIENTIFIC_FICHE_AVAILABLE');
    expect(report.bodyKey).toBe(BASE.bodyKey);
    expect(report.discoveryState).toBe('CONFIRMED');
    expect(report.aqueousIndices?.perspective).toBe('OBSERVED_KNOWLEDGE');
    expect(report.alternativeRoutes?.perspective).toBe('OBSERVED_KNOWLEDGE');
    expect((report as unknown as Record<string, unknown>)['simulatedReality']).toBe(undefined);
    expect((report as unknown as Record<string, unknown>)['physicalPotential']).toBe(undefined);
  });
  it('CONFIRMED does not auto-authorize private aqueous evidence or hidden contradictions', () => {
    const hidden = {
      ...BASE,
      aqueousEvidence: allWater().map((e) => e.constraint === 'TEMPERATURE'
        ? water('TEMPERATURE', {
          verdict: 'CONTRADICTS', accessibleToObserver: false, basis: 'INFERRED_MODEL',
          sourceKey: 'secret.freezing',
        }) : e),
    };
    const reality = Resolver.assessInternal(hidden);
    expect(reality.physicalPotential.aqueousIndices.routes[0].status).toBe('CONSTRAINTS_INCOMPATIBLE');
    const publicView = observed(hidden);
    expect(publicView.aqueousIndices?.routes[0].status).toBe('INSUFFICIENT_EVIDENCE');
    expect(publicView.aqueousIndices?.routes[0].evidenceCoverageIndex01).toBe(7 / 8);
    expect(publicView.aqueousIndices?.routes[0].decisiveContradictions).toEqual([]);
    expect(JSON.stringify(publicView)).not.toMatch(/secret|freezing/);
  });
  it('authorized physical contradictions remain decisive despite many favorable criteria', () => {
    const input = {
      ...BASE,
      aqueousEvidence: allWater().map((e) => e.constraint === 'TEMPERATURE'
        ? water('TEMPERATURE', { verdict: 'CONTRADICTS' }) : e),
    };
    const r = aqueous(input);
    expect(r?.status).toBe('CONSTRAINTS_INCOMPATIBLE');
    expect(r?.tally.supporting).toBe(7);
    expect(r?.tally.contradicting).toBe(1);
    expect(r?.decisiveContradictions).toEqual(['TEMPERATURE']);
  });
  it('observed confidence preserves inferred provenance, never upgrades it to a measurement', () => {
    const input = { ...BASE, aqueousEvidence: [water('TEMPERATURE', {
      basis: 'INFERRED_MODEL', sourceKey: 'climate.inference',
    })] };
    expect(aqueous(input)?.evidenceBases.inferredModels).toBe(1);
    expect(aqueous(input)?.evidenceBases.directObservations).toBe(0);
  });
  it('CONFIRMED does not leak hidden hydrocarbon lakes or their coverage', () => {
    const input = {
      ...BASE,
      alternativeEvidence: allHydro().map((e) => ({
        ...e, accessibleToObserver: false,
        sourceKey: `private.${e.criterion}`,
      })),
    };
    expect(Resolver.assessInternal(input).physicalPotential.alternativeRoutes.routes[0].status)
      .toBe('PHYSICAL_SCENARIO_SUPPORTED');
    const view = observed(input);
    expect(view.alternativeRoutes?.routes[0].status).toBe('INSUFFICIENT_RESOLVED_EVIDENCE');
    expect(view.alternativeRoutes?.routes[0].evidenceCoverage01).toBe(0);
    expect(JSON.stringify(view)).not.toMatch(/private\./);
  });
  it('authorized conditional lunar scenarios remain unresolved, not actual oceans', () => {
    const input: HabitabilityKnowledgeInput31_12 = {
      ...BASE, bodyKind: 'MOON',
      alternativeEvidence: [hydro('EXISTING_RESERVOIR', {
        bodyKind: 'MOON', basis: 'INFERRED_MODEL', scope: 'CONDITIONAL_SCENARIO',
      })],
    };
    const r = alternate(input);
    expect(r?.constraints[1].verdict).toBe('UNRESOLVED');
    expect(r?.constraints[1].conditionalCandidate).toBe(true);
    expect(r?.status).toBe('INSUFFICIENT_RESOLVED_EVIDENCE');
  });
  it('an unseen conditional scenario does not leak its existence or its source', () => {
    const input = { ...BASE, alternativeEvidence: [hydro('EXISTING_RESERVOIR', {
      basis: 'INFERRED_MODEL', scope: 'CONDITIONAL_SCENARIO',
      accessibleToObserver: false, sourceKey: 'secret.conditionalLake',
    })] };
    expect(alternate(input)?.constraints[1].conditionalCandidate).toBe(false);
    expect(JSON.stringify(observed(input))).not.toMatch(/secret|conditionalLake/);
  });
  it('physical chemistry of one alternative solvent cannot authorize other routes', () => {
    const view = observed({ ...BASE, alternativeEvidence: allHydro() });
    expect(view.alternativeRoutes?.routes[0].status).toBe('PHYSICAL_SCENARIO_SUPPORTED');
    expect(view.alternativeRoutes?.routes[1].status).toBe('INSUFFICIENT_RESOLVED_EVIDENCE');
    expect(view.alternativeRoutes?.routes[2].status).toBe('INSUFFICIENT_RESOLVED_EVIDENCE');
    expect(view.alternativeRoutes?.routes[0].lifePresence).toBe('NOT_EVALUATED');
  });
  it('does not derive alternate solvent reservoirs when no evidence is provided', () => {
    const view = observed();
    expect(view.alternativeRoutes?.routes.every((r) => r.evidenceCoverage01 === 0)).toBe(true);
    expect(view.aqueousIndices?.routes[0].status).toBe('INSUFFICIENT_EVIDENCE');
  });
  it('rejects evidence for another body before publishing an unlocked diagnostic', () => {
    const input = { ...BASE, alternativeEvidence: [hydro('EXISTING_RESERVOIR', {
      bodyKey: 'other-planet',
    })] };
    expect(() => Resolver.assessInternal(input)).toThrow(/body identity/);
    expect(() => observed(input)).toThrow(/body identity/);
  });
  it('rejects evidence from another CT-0 epoch', () => {
    const input = { ...BASE, alternativeEvidence: [hydro('EXISTING_RESERVOIR', {
      systemAgeBillionYears: 1.1,
    })] };
    expect(() => observed(input)).toThrow(/epoch/);
  });
  it('does not accept duplicate or forged route evidence', () => {
    expect(() => observed({ ...BASE, aqueousEvidence: [water('TEMPERATURE'), water('TEMPERATURE')] }))
      .toThrow(/Duplicate habitability evidence/);
    expect(() => observed({ ...BASE, alternativeEvidence: [hydro('EXISTING_RESERVOIR'), hydro('EXISTING_RESERVOIR')] }))
      .toThrow(/duplicate alternative evidence/);
  });
  it('rejects direct observations incorrectly marked as not observable', () => {
    const input = { ...BASE, aqueousEvidence: [water('TEMPERATURE', {
      basis: 'DIRECT_OBSERVATION', accessibleToObserver: false,
    })] };
    expect(() => observed(input)).toThrow(/Direct observations cannot be marked hidden/);
  });
  it('never promotes potentially habitable environments into biology or probability', () => {
    const input = { ...BASE, aqueousEvidence: allWater(), alternativeEvidence: allHydro() };
    const view = observed(input);
    expect(view.aqueousIndices?.routes[0].status).toBe('CONSTRAINTS_COMPATIBLE');
    expect(view.lifePresence).toBe('NOT_EVALUATED');
    expect(JSON.stringify(view)).not.toMatch(/abiogenesisProbability|biosignatureConfirmed|lifeDetected/);
  });
  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)('does not reinterpret physics for %s', (multiplicity) => {
    const input = { ...BASE, multiplicity, aqueousEvidence: allWater() };
    expect(aqueous(input)?.status).toBe('CONSTRAINTS_COMPATIBLE');
  });
  it('accepts an unknown present epoch without inventing an age', () => {
    const input = { ...BASE, time: { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: null } };
    expect(observed(input).time?.systemAgeBillionYears).toBe(null);
    expect(Resolver.assessInternal(input).simulatedReality.time.systemAgeBillionYears).toBe(null);
  });
  it('rejects invalid CT-0 time rather than silently projecting a fictitious history', () => {
    const input = { ...BASE, time: { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: -2 } };
    expect(() => Resolver.assessInternal(input)).toThrow(/non-negative/);
  });
  it('requires explicit fiche authorization rather than a truthy non-boolean shortcut', () => {
    expect(() => Resolver.projectObserved(BASE, {
      discoveryState: DiscoveryState.CONFIRMED, scientificFicheAccessible: 'yes' as unknown as boolean,
    })).toThrow(/explicit discovery/);
  });
  it('rejects unknown discovery state codes', () => {
    expect(() => Resolver.projectObserved(BASE, {
      discoveryState: { name: 'CONFIRMED', code: 99 } as unknown as DiscoveryStateValue,
      scientificFicheAccessible: true,
    })).toThrow(/Unknown DiscoveryState code/);
  });
  it('produces stable reports regardless of evidence ordering, without RNG or input mutation', () => {
    const original = { ...BASE, aqueousEvidence: allWater(), alternativeEvidence: allHydro() };
    const reordered = {
      ...original,
      aqueousEvidence: [...original.aqueousEvidence].reverse(),
      alternativeEvidence: [...original.alternativeEvidence].reverse(),
    };
    expect(observed(original)).toEqual(observed(reordered));
    expect(Resolver.assessInternal(original)).toEqual(Resolver.assessInternal(reordered));
    expect(original.aqueousEvidence[0].constraint).toBe('TEMPERATURE');
  });
  it('freezes the top-level observer output and its shared validated reports', () => {
    const result = observed({ ...BASE, aqueousEvidence: allWater() });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.aqueousIndices)).toBe(true);
    expect(Object.isFrozen(result.alternativeRoutes)).toBe(true);
    expect(Object.isFrozen(result.time)).toBe(true);
  });
  it('does not retain state across 512 repeated projections or change access when called after private evaluation', () => {
    const input = { ...BASE, aqueousEvidence: allWater(), alternativeEvidence: allHydro() };
    const expected = JSON.stringify(observed(input));
    for (let n = 0; n < 512; n++) {
      Resolver.assessInternal(input);
      expect(JSON.stringify(observed(input))).toBe(expected);
      expect(observed(input, DiscoveryState.CATALOGUED).aqueousIndices).toBe(null);
    }
  });
});
