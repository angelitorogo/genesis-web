import {
  HABITABILITY_REQUIREMENTS_31_1, HABITABILITY_ROUTES_31_1,
  type HabitabilityConstraint, type HabitabilityConstraintResult,
  type HabitabilityEvidenceBasis, type HabitabilityRoute,
  type HabitabilityRouteScenario, type HabitabilityScenarioAssessment,
} from '../../domain/habitability/habitability-scenario';
import type {
  HabitabilityCriterionTally31_6, HabitabilityDecisiveBasis31_6,
  HabitabilityEvidenceBasisTally31_6, HabitabilityFactorBreakdown31_6,
  HabitabilityFactorGroup31_6, HabitabilityIndexReport31_6,
  HabitabilityRouteIndex31_6,
} from '../../domain/habitability/habitability-indices-31-6';

/**
 * Phase 31.6: pure and seed-free readout of 31.1–31.5 evidence. Does NOT add
 * any physical threshold, probability, tolerance, abiogenesis or life state.
 * A large support fraction is NOT a positive habitability claim when there is
 * even one contradiction; unresolved criteria are never counted as supports.
 * Call after the last resolver, with its `assessment` (the 31.1 privacy filter
 * has already projected OBSERVED_KNOWLEDGE).
 */
const GROUP_CRITERIA: Readonly<Record<HabitabilityFactorGroup31_6, readonly HabitabilityConstraint[]>> =
  Object.freeze({
    THERMAL_RESERVOIR_AND_CONFINEMENT: Object.freeze([
      'TEMPERATURE', 'LIQUID_RESERVOIR', 'PRESSURE_OR_CONFINEMENT', 'RESERVOIR_GEOMETRY',
    ] as const),
    CHEMISTRY_AND_ENERGY: Object.freeze(['CHEMICAL_FEASIBILITY', 'ENERGY_GRADIENT'] as const),
    RADIATION_AND_SHIELDING: Object.freeze(['RADIATION_EXPOSURE'] as const),
    DYNAMICAL_STABILITY: Object.freeze(['DYNAMICAL_STABILITY'] as const),
    GRAVITY_AND_RETENTION: Object.freeze(['GRAVITY_AND_RETENTION'] as const),
  } as const);
const GROUPS = Object.freeze(Object.keys(GROUP_CRITERIA) as HabitabilityFactorGroup31_6[]);
const BASES = Object.freeze([
  'PHYSICAL_MODEL', 'INFERRED_MODEL', 'DIRECT_OBSERVATION', 'UNRESOLVED',
]);
const VERDICTS = Object.freeze(['SUPPORTS', 'CONTRADICTS', 'UNRESOLVED']);

export class HabitabilityIndicesResolver31_6 {
  private constructor() {}

  static summarize(assessment: HabitabilityScenarioAssessment): HabitabilityIndexReport31_6 {
    validateAssessment(assessment);
    const routes = HABITABILITY_ROUTES_31_1.map((route) => {
      const scenario = assessment.routes.find((r) => r.route === route)!;
      return summarizeRoute(route, scenario);
    });
    return Object.freeze({
      contractVersion: '31.6-CT0',
      interpretation: 'DESCRIPTIVE_CONSTRAINT_COVERAGE_NOT_LIFE_PROBABILITY',
      bodyKind: assessment.bodyKind, bodyKey: assessment.bodyKey,
      multiplicity: assessment.multiplicity, perspective: assessment.perspective,
      time: Object.freeze({ ...assessment.time }), routes: Object.freeze(routes),
    });
  }
}

function summarizeRoute(
  route: HabitabilityRoute, scenario: HabitabilityRouteScenario,
): HabitabilityRouteIndex31_6 {
  if (route === 'ALTERNATIVE_CHEMISTRY') {
    return Object.freeze({
      route, status: 'MODEL_NOT_IMPLEMENTED', resolution: 'NOT_DETERMINED',
      tally: tally([]), factorBreakdown: Object.freeze([]), evidenceBases: basisTally([]),
      coverage: 'NOT_APPLICABLE', evidenceCoverageIndex01: null,
      supportingCriteriaIndex01: null, contradictingCriteriaIndex01: null,
      decisiveBasis: 'NOT_DETERMINED', criteria: Object.freeze([]),
      missingConstraints: Object.freeze([]), decisiveContradictions: Object.freeze([]),
    });
  }
  const constraints = scenario.constraints;
  const counts = tally(constraints);
  const evaluated = counts.supporting + counts.contradicting;
  const contradictions = constraints.filter((c) => c.verdict === 'CONTRADICTS');
  const decisive = contradictions.length > 0 ? contradictions :
    counts.unresolved === 0 ? constraints : [];
  const criteria = constraints.map((c) => Object.freeze({
    constraint: c.constraint, verdict: c.verdict, basis: c.basis, sourceKey: c.sourceKey,
  }));
  const factorBreakdown = GROUPS.map((group): HabitabilityFactorBreakdown31_6 | null => {
    const applicable = constraints.filter((c) => GROUP_CRITERIA[group].includes(c.constraint));
    if (applicable.length === 0) return null;
    return Object.freeze({
      group,
      tally: tally(applicable),
      criteria: Object.freeze(applicable.map((c) => c.constraint)),
    });
  }).filter((b): b is HabitabilityFactorBreakdown31_6 => b !== null);

  return Object.freeze({
    route, status: scenario.status, resolution: scenario.resolution,
    tally: counts, factorBreakdown: Object.freeze(factorBreakdown),
    evidenceBases: basisTally(constraints),
    coverage: evaluated === 0 ? 'NONE' : evaluated === counts.required ? 'COMPLETE' : 'PARTIAL',
    evidenceCoverageIndex01: fraction(evaluated, counts.required),
    supportingCriteriaIndex01: evaluated === 0 ? null : fraction(counts.supporting, counts.required),
    contradictingCriteriaIndex01: evaluated === 0 ? null : fraction(counts.contradicting, counts.required),
    decisiveBasis: decisiveBasis(decisive),
    criteria: Object.freeze(criteria),
    missingConstraints: Object.freeze([...scenario.missingConstraints]),
    decisiveContradictions: Object.freeze(contradictions.map((c) => c.constraint)),
  });
}

function tally(entries: readonly HabitabilityConstraintResult[]): HabitabilityCriterionTally31_6 {
  const supporting = entries.filter((c) => c.verdict === 'SUPPORTS').length;
  const contradicting = entries.filter((c) => c.verdict === 'CONTRADICTS').length;
  return Object.freeze({
    required: entries.length, supporting, contradicting,
    unresolved: entries.length - supporting - contradicting,
  });
}

function basisTally(entries: readonly HabitabilityConstraintResult[]): HabitabilityEvidenceBasisTally31_6 {
  return Object.freeze({
    directObservations: entries.filter((c) => c.basis === 'DIRECT_OBSERVATION').length,
    physicalModels: entries.filter((c) => c.basis === 'PHYSICAL_MODEL').length,
    inferredModels: entries.filter((c) => c.basis === 'INFERRED_MODEL').length,
    unresolved: entries.filter((c) => c.basis === 'UNRESOLVED').length,
  });
}

function fraction(part: number, total: number): number | null {
  return total === 0 ? null : part / total;
}

function decisiveBasis(entries: readonly HabitabilityConstraintResult[]): HabitabilityDecisiveBasis31_6 {
  if (entries.length === 0) return 'NOT_DETERMINED';
  if (entries.some((c) => c.basis === 'INFERRED_MODEL')) return 'INFERRED_MODEL';
  if (entries.some((c) => c.basis === 'PHYSICAL_MODEL')) return 'PHYSICAL_MODEL';
  if (entries.every((c) => c.basis === 'DIRECT_OBSERVATION')) return 'DIRECT_OBSERVATION';
  return 'NOT_DETERMINED';
}

/** Reject malformed or stale contracts instead of manufacturing an index. */
function validateAssessment(a: HabitabilityScenarioAssessment): void {
  if (!a || a.contractVersion !== '31.1-CT0' || !Array.isArray(a.routes) ||
      a.routes.length !== HABITABILITY_ROUTES_31_1.length ||
      !['PLANET', 'MOON'].includes(a.bodyKind) ||
      !['SINGLE', 'BINARY', 'TRIPLE', 'UNKNOWN'].includes(a.multiplicity) ||
      !['SIMULATED_REALITY', 'OBSERVED_KNOWLEDGE'].includes(a.perspective) ||
      typeof a.bodyKey !== 'string' || a.bodyKey.trim() === '' ||
      !a.time || a.time.kind !== 'CURRENT_SNAPSHOT' ||
      (a.time.systemAgeBillionYears !== null &&
       (!Number.isFinite(a.time.systemAgeBillionYears) || a.time.systemAgeBillionYears < 0))) {
    throw new RangeError('31.6 requires a valid 31.1 CT-0 assessment.');
  }
  const seen = new Set<HabitabilityRoute>();
  for (const r of a.routes as readonly HabitabilityRouteScenario[]) {
    if (!r || !HABITABILITY_ROUTES_31_1.includes(r.route) || seen.has(r.route) ||
        !Array.isArray(r.constraints) || !Array.isArray(r.missingConstraints)) {
      throw new RangeError('31.6: invalid or duplicate environmental route.');
    }
    seen.add(r.route);
    if (r.route === 'ALTERNATIVE_CHEMISTRY') {
      if (r.status !== 'MODEL_NOT_IMPLEMENTED' || r.resolution !== 'NOT_DETERMINED' ||
          r.constraints.length !== 0 || r.missingConstraints.length !== 0) {
        throw new RangeError('31.6: alternative chemistry is reserved for phase 31.11.');
      }
      continue;
    }
    const required = HABITABILITY_REQUIREMENTS_31_1[r.route];
    if (r.constraints.length !== required.length ||
        new Set(r.constraints.map((c) => c.constraint)).size !== required.length ||
        r.constraints.some((c) => !required.includes(c.constraint))) {
      throw new RangeError('31.6: route criteria must match 31.1 requirements exactly.');
    }
    for (const c of r.constraints) {
      if (!VERDICTS.includes(c.verdict) || !BASES.includes(c.basis) ||
          (c.verdict === 'UNRESOLVED') !== (c.basis === 'UNRESOLVED') ||
          (c.sourceKey !== null && (typeof c.sourceKey !== 'string' || c.sourceKey.trim() === '')) ||
          (c.verdict !== 'UNRESOLVED' && c.sourceKey === null)) {
        throw new RangeError('31.6: inconsistent evidence source or basis.');
      }
    }
    const unknown = r.constraints.filter((c) => c.verdict === 'UNRESOLVED').map((c) => c.constraint);
    const contradictions = r.constraints.filter((c) => c.verdict === 'CONTRADICTS');
    const expectedStatus = contradictions.length > 0 ? 'CONSTRAINTS_INCOMPATIBLE' :
      unknown.length === 0 ? 'CONSTRAINTS_COMPATIBLE' : 'INSUFFICIENT_EVIDENCE';
    const decisive = contradictions.length > 0 ? contradictions : unknown.length === 0 ? r.constraints : [];
    const expectedResolution = decisive.length === 0 ? 'NOT_DETERMINED' :
      decisive.some((c) => c.basis === 'INFERRED_MODEL') ? 'INFERRED_EVIDENCE' : 'RESOLVED_EVIDENCE';
    if (r.status !== expectedStatus || r.resolution !== expectedResolution ||
        new Set(r.missingConstraints).size !== unknown.length ||
        unknown.some((c) => !r.missingConstraints.includes(c))) {
      throw new RangeError('31.6: scenario state conflicts with its evidence.');
    }
  }
}
