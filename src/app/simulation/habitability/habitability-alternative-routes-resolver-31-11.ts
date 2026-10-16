import type {
  HabitabilityScenarioAssessment, HabitabilityEvidenceBasis,
} from '../../domain/habitability/habitability-scenario';
import {
  ALTERNATIVE_CRITERIA_31_11, ALTERNATIVE_ROUTES_31_11,
  ALTERNATIVE_ROUTE_DEFINITIONS_31_11,
  type AlternativeAssessment31_11, type AlternativeCriterion31_11,
  type AlternativeCriterionResult31_11, type AlternativeEvidence31_11,
  type AlternativeRoute31_11, type AlternativeRouteAssessment31_11,
} from '../../domain/habitability/habitability-alternative-routes-31-11';

/**
 * 31.11: read-only environmental screening of explicit alternative solvent
 * niches. This stage deliberately DOES NOT infer liquid solvents from bulk
 * atmospheric gas abundances, nor infer metabolizable energy from irradiance.
 *
 * Important integration boundary: the 31.1/31.6 ALTERNATIVE_CHEMISTRY
 * aggregate remains the original unassessed placeholder for old callers;
 * this 31.11 report is the specialized, opt-in subroute diagnostic. Phase 31.12
 * will decide how to display it through observed-knowledge policy.
 */
export class HabitabilityAlternativeRoutesResolver31_11 {
  private constructor() {}

  static assess(
    prior: HabitabilityScenarioAssessment,
    evidence: readonly AlternativeEvidence31_11[],
  ): AlternativeAssessment31_11 {
    validatePrior(prior);
    if (!Array.isArray(evidence)) throw new TypeError('31.11 requires an evidence array.');
    const map = new Map<string, AlternativeEvidence31_11>();
    for (const item of evidence) {
      validateEvidence(item, prior);
      const key = `${item.route}/${item.criterion}`;
      if (map.has(key)) throw new RangeError(`31.11 duplicate alternative evidence: ${key}`);
      map.set(key, item);
    }
    const routes = ALTERNATIVE_ROUTE_DEFINITIONS_31_11.map(
      (definition): AlternativeRouteAssessment31_11 => {
        const constraints = ALTERNATIVE_CRITERIA_31_11.map(
          (criterion): AlternativeCriterionResult31_11 =>
            evaluateCriterion(prior, map.get(`${definition.route}/${criterion}`), criterion),
        );
        const missingCriteria = constraints.filter((entry) =>
          entry.verdict === 'UNRESOLVED').map((entry) => entry.criterion);
        const decisiveContradictions = constraints.filter((entry) =>
          entry.verdict === 'CONTRADICTS').map((entry) => entry.criterion);
        const evaluatedCount = constraints.length - missingCriteria.length;
        const status = decisiveContradictions.length > 0
          ? 'PHYSICAL_CONSTRAINTS_INCOMPATIBLE'
          : missingCriteria.length === 0
            ? 'PHYSICAL_SCENARIO_SUPPORTED'
            : 'INSUFFICIENT_RESOLVED_EVIDENCE';
        return Object.freeze({
          definition, status,
          constraints: Object.freeze(constraints),
          missingCriteria: Object.freeze(missingCriteria),
          decisiveContradictions: Object.freeze(decisiveContradictions),
          evidenceCoverage01: evaluatedCount / ALTERNATIVE_CRITERIA_31_11.length,
          inferredOnly: evaluatedCount > 0 && constraints.every((item) =>
            item.verdict === 'UNRESOLVED' || item.basis === 'INFERRED_MODEL'),
          metabolicFeasibility: 'NOT_ESTABLISHED',
          lifePresence: 'NOT_EVALUATED',
        });
      },
    );
    return Object.freeze({
      contractVersion: '31.11-CT0',
      interpretation: 'ENVIRONMENTAL_CONSTRAINTS_NOT_PROBABILITY_OF_LIFE',
      bodyKind: prior.bodyKind,
      bodyKey: prior.bodyKey,
      multiplicity: prior.multiplicity,
      perspective: prior.perspective,
      time: Object.freeze({ ...prior.time }),
      routes: Object.freeze(routes),
    });
  }
}

function evaluateCriterion(
  prior: HabitabilityScenarioAssessment,
  evidence: AlternativeEvidence31_11 | undefined,
  criterion: AlternativeCriterion31_11,
): AlternativeCriterionResult31_11 {
  if (!evidence || (prior.perspective === 'OBSERVED_KNOWLEDGE' &&
      !evidence.accessibleToObserver)) {
    // No private source ID, verdict or even conditional-candidate presence leaks.
    return Object.freeze({
      criterion, verdict: 'UNRESOLVED', basis: 'UNRESOLVED',
      sourceKey: null, conditionalCandidate: false,
    });
  }
  // Conditional phase/reservoir/geometrical claims are scenarios, not established
  // positive OR negative body-local evidence. Preserve only the fact that a
  // conditional option exists for authorized observers.
  if (evidence.scope === 'CONDITIONAL_SCENARIO' || evidence.verdict === 'UNRESOLVED') {
    return Object.freeze({
      criterion, verdict: 'UNRESOLVED', basis: 'UNRESOLVED',
      sourceKey: evidence.sourceKey, conditionalCandidate: evidence.scope === 'CONDITIONAL_SCENARIO',
    });
  }
  return Object.freeze({
    criterion, verdict: evidence.verdict, basis: evidence.basis,
    sourceKey: evidence.sourceKey, conditionalCandidate: false,
  });
}

function validatePrior(prior: HabitabilityScenarioAssessment): void {
  if (!prior || prior.contractVersion !== '31.1-CT0' ||
      !['PLANET', 'MOON'].includes(prior.bodyKind) ||
      !['SINGLE', 'BINARY', 'TRIPLE', 'UNKNOWN'].includes(prior.multiplicity) ||
      !['SIMULATED_REALITY', 'OBSERVED_KNOWLEDGE'].includes(prior.perspective) ||
      typeof prior.bodyKey !== 'string' || !prior.bodyKey.trim() ||
      !prior.time || prior.time.kind !== 'CURRENT_SNAPSHOT' ||
      (prior.time.systemAgeBillionYears !== null &&
        (!Number.isFinite(prior.time.systemAgeBillionYears) ||
         prior.time.systemAgeBillionYears < 0)) ||
      !Array.isArray(prior.routes) || prior.routes.length !== 3 ||
      !prior.routes.some((route) => route.route === 'ALTERNATIVE_CHEMISTRY')) {
    throw new RangeError('31.11 requires a valid prior 31.1 CT-0 assessment.');
  }
}

const VALID_VERDICTS = ['SUPPORTS', 'CONTRADICTS', 'UNRESOLVED'] as const;
const VALID_BASES: readonly HabitabilityEvidenceBasis[] = [
  'DIRECT_OBSERVATION', 'PHYSICAL_MODEL', 'INFERRED_MODEL', 'UNRESOLVED',
];

function validateEvidence(
  item: AlternativeEvidence31_11, prior: HabitabilityScenarioAssessment,
): void {
  if (!item || !ALTERNATIVE_ROUTES_31_11.includes(item.route as AlternativeRoute31_11) ||
      !ALTERNATIVE_CRITERIA_31_11.includes(item.criterion) ||
      !VALID_VERDICTS.includes(item.verdict) || !VALID_BASES.includes(item.basis) ||
      !['RESOLVED_CURRENT_BODY', 'CONDITIONAL_SCENARIO'].includes(item.scope) ||
      typeof item.sourceKey !== 'string' || !item.sourceKey.trim() ||
      typeof item.accessibleToObserver !== 'boolean') {
    throw new RangeError('31.11 invalid alternate-niche evidence or missing provenance.');
  }
  if (item.bodyKey !== prior.bodyKey || item.bodyKind !== prior.bodyKind ||
      item.systemAgeBillionYears !== prior.time.systemAgeBillionYears) {
    throw new RangeError('31.11 evidence must match the CT-0 body identity and epoch.');
  }
  if ((item.verdict === 'UNRESOLVED') !== (item.basis === 'UNRESOLVED')) {
    throw new RangeError('31.11 verdict and source basis must agree.');
  }
  if (item.basis === 'DIRECT_OBSERVATION' &&
      (!item.accessibleToObserver || item.scope !== 'RESOLVED_CURRENT_BODY')) {
    throw new RangeError('31.11 direct observations cannot be hidden or conditional.');
  }
  if (item.criterion === 'EXISTING_RESERVOIR' &&
      item.scope === 'RESOLVED_CURRENT_BODY' &&
      item.verdict === 'SUPPORTS' && item.basis === 'INFERRED_MODEL') {
    throw new RangeError('31.11 an inferred candidate cannot establish an actual liquid reservoir.');
  }
  if (item.scope === 'CONDITIONAL_SCENARIO' &&
      item.basis === 'PHYSICAL_MODEL' && item.verdict === 'SUPPORTS') {
    // A physically calculated conditional branch must not masquerade as an
    // actual body-resolved reservoir/solvent/chemistry measurement.
    // INFERRED_MODEL is the correct basis for a positive scenario opportunity.
    throw new RangeError('31.11 conditional supporting cases require inferred evidence.');
  }
}
