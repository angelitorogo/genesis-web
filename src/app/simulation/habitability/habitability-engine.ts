import {
  HABITABILITY_REQUIREMENTS_31_1,
  HABITABILITY_ROUTES_31_1,
  type HabitabilityConstraint,
  type HabitabilityConstraintResult,
  type HabitabilityEvidence,
  type HabitabilityEvidenceBasis,
  type HabitabilityEvidenceVerdict,
  type HabitabilityRoute,
  type HabitabilityRouteScenario,
  type HabitabilityScenarioAssessment,
  type HabitabilityScenarioInput,
  type HabitabilitySupportResolution,
} from '../../domain/habitability/habitability-scenario';

const VALID_BODY_KINDS = ['PLANET', 'MOON'] as const;
const VALID_MULTIPLICITIES = ['SINGLE', 'BINARY', 'TRIPLE', 'UNKNOWN'] as const;
const VALID_PERSPECTIVES = ['SIMULATED_REALITY', 'OBSERVED_KNOWLEDGE'] as const;
const VALID_VERDICTS = ['SUPPORTS', 'CONTRADICTS', 'UNRESOLVED'] as const;
const VALID_BASES = [
  'PHYSICAL_MODEL', 'INFERRED_MODEL', 'DIRECT_OBSERVATION', 'UNRESOLVED',
] as const;

/**
 * Phase 31.1: a pure, deterministic consolidation of independently resolved
 * physical evidence. It MUST NOT derive life, invent measurements, calculate
 * environmental thresholds, reroll seeds, or promote historical habitability.
 *
 * 31.2–31.5/31.10 supply physical evidence; 31.6 supplies *descriptive*
 * route indices; 31.11 implements explicit non-aqueous routes.
 */
export class HabitabilityEngine {
  private constructor() {}

  static evaluate(input: HabitabilityScenarioInput): HabitabilityScenarioAssessment {
    validateInput(input);

    const evidenceMap = new Map<string, HabitabilityEvidence>();
    for (const evidence of input.evidence) {
      const key = `${evidence.route}/${evidence.constraint}`;
      if (evidenceMap.has(key)) {
        throw new RangeError(`Duplicate habitability evidence for ${key}.`);
      }
      evidenceMap.set(key, evidence);
    }

    const routes = HABITABILITY_ROUTES_31_1.map((route): HabitabilityRouteScenario => {
      if (route === 'ALTERNATIVE_CHEMISTRY') {
        return Object.freeze({
          route,
          status: 'MODEL_NOT_IMPLEMENTED',
          resolution: 'NOT_DETERMINED',
          constraints: Object.freeze([]),
          missingConstraints: Object.freeze([]),
        });
      }

      const constraints = HABITABILITY_REQUIREMENTS_31_1[route].map(
        (constraint): HabitabilityConstraintResult => {
          const evidence = evidenceMap.get(`${route}/${constraint}`);
          const accessible = evidence !== undefined && (
            input.perspective === 'SIMULATED_REALITY' ||
            evidence.accessibleToObserver
          );
          if (!accessible || evidence === undefined) {
            return Object.freeze({
              constraint, verdict: 'UNRESOLVED', basis: 'UNRESOLVED', sourceKey: null,
            });
          }
          return Object.freeze({
            constraint,
            verdict: evidence.verdict,
            basis: evidence.basis,
            sourceKey: evidence.sourceKey,
          });
        },
      );

      const missingConstraints = constraints
        .filter((factor) => factor.verdict === 'UNRESOLVED')
        .map((factor) => factor.constraint);
      const incompatible = constraints.some((factor) => factor.verdict === 'CONTRADICTS');
      const complete = missingConstraints.length === 0;
      const status = incompatible
        ? 'CONSTRAINTS_INCOMPATIBLE'
        : complete
          ? 'CONSTRAINTS_COMPATIBLE'
          : 'INSUFFICIENT_EVIDENCE';
      const decisive = incompatible
        ? constraints.filter((factor) => factor.verdict === 'CONTRADICTS')
        : complete ? constraints : [];
      const resolution: HabitabilitySupportResolution = decisive.length === 0
        ? 'NOT_DETERMINED'
        : decisive.some((factor) => factor.basis === 'INFERRED_MODEL')
          ? 'INFERRED_EVIDENCE'
          : 'RESOLVED_EVIDENCE';

      return Object.freeze({
        route,
        status,
        resolution,
        constraints: Object.freeze(constraints),
        missingConstraints: Object.freeze(missingConstraints),
      });
    });

    return Object.freeze({
      bodyKind: input.bodyKind,
      bodyKey: input.bodyKey,
      multiplicity: input.multiplicity,
      perspective: input.perspective,
      time: Object.freeze({ ...input.time }),
      routes: Object.freeze(routes),
      contractVersion: '31.1-CT0',
    });
  }
}

function validateInput(input: HabitabilityScenarioInput): void {
  if (input === null || typeof input !== 'object') {
    throw new TypeError('A habitability scenario input is required.');
  }
  assertMember(input.bodyKind, VALID_BODY_KINDS, 'bodyKind');
  assertMember(input.multiplicity, VALID_MULTIPLICITIES, 'multiplicity');
  assertMember(input.perspective, VALID_PERSPECTIVES, 'perspective');
  if (typeof input.bodyKey !== 'string' || input.bodyKey.trim().length === 0) {
    throw new RangeError('bodyKey must be a non-empty stable reference.');
  }
  if (
    input.time === null || typeof input.time !== 'object' ||
    input.time.kind !== 'CURRENT_SNAPSHOT' ||
    (input.time.systemAgeBillionYears !== null && (
      !Number.isFinite(input.time.systemAgeBillionYears) ||
      input.time.systemAgeBillionYears < 0
    ))
  ) {
    throw new RangeError('CT-0 requires CURRENT_SNAPSHOT and a non-negative finite age or null.');
  }
  if (!Array.isArray(input.evidence)) {
    throw new TypeError('evidence must be an array.');
  }
  for (const evidence of input.evidence) {
    validateEvidence(evidence);
  }
}

function validateEvidence(evidence: HabitabilityEvidence): void {
  if (evidence === null || typeof evidence !== 'object') {
    throw new TypeError('Evidence entries must be objects.');
  }
  assertMember(evidence.route, HABITABILITY_ROUTES_31_1, 'evidence.route');
  if (evidence.route === 'ALTERNATIVE_CHEMISTRY') {
    throw new RangeError('Alternative-chemistry evidence is not resolvable before 31.11.');
  }
  const required: readonly HabitabilityConstraint[] =
    HABITABILITY_REQUIREMENTS_31_1[evidence.route];
  assertMember(evidence.constraint, required, 'evidence.constraint');
  assertMember(evidence.verdict, VALID_VERDICTS, 'evidence.verdict');
  assertMember(evidence.basis, VALID_BASES, 'evidence.basis');
  if (typeof evidence.accessibleToObserver !== 'boolean') {
    throw new TypeError('accessibleToObserver must be an explicit boolean.');
  }
  if (typeof evidence.sourceKey !== 'string' || evidence.sourceKey.trim().length === 0) {
    throw new RangeError('Evidence requires a non-empty scientific sourceKey.');
  }
  if ((evidence.verdict === 'UNRESOLVED') !== (evidence.basis === 'UNRESOLVED')) {
    throw new RangeError('Unresolved verdict and unresolved evidence basis must agree.');
  }
  if (evidence.basis === 'DIRECT_OBSERVATION' && !evidence.accessibleToObserver) {
    throw new RangeError('Direct observations cannot be marked hidden.');
  }
}

function assertMember<T extends string>(
  value: unknown,
  values: readonly T[],
  label: string,
): asserts value is T {
  if (!values.includes(value as T)) {
    throw new RangeError(`Unsupported ${label}: ${String(value)}.`);
  }
}
