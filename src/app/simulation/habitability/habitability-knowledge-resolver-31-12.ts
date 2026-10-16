import { DiscoveryState } from '../../domain/discovery/discovery-state';
import type { HabitabilityScenarioInput } from '../../domain/habitability/habitability-scenario';
import type {
  HabitabilityInternalAssessment31_12, HabitabilityKnowledgeInput31_12,
  HabitabilityObservationAccess31_12, HabitabilityObservedAssessment31_12,
} from '../../domain/habitability/habitability-knowledge-31-12';
import { HabitabilityEngine } from './habitability-engine';
import { HabitabilityIndicesResolver31_6 } from './habitability-indices-resolver-31-6';
import { HabitabilityAlternativeRoutesResolver31_11 } from './habitability-alternative-routes-resolver-31-11';

/**
 * Phase 31.12 — CT-0 projection boundary.
 *
 * Only `projectObserved` may be used by player-facing consumers. It calculates
 * new OBSERVED_KNOWLEDGE assessments from individually authorized evidence;
 * it does NOT redact an already-aggregated private report (which could leak a
 * hidden contradiction, candidate reservoir, numerical coverage or source).
 *
 * DiscoveryState alone never makes previously hidden evidence accessible.
 * Even CONFIRMED requires the separate fiche permission, and every source
 * still has to be accessibleToObserver. No stochastic generation or physics.
 */
export class HabitabilityKnowledgeResolver31_12 {
  private constructor() {}

  /** Server/internal simulation layer, not a presentation model. */
  static assessInternal(input: HabitabilityKnowledgeInput31_12): HabitabilityInternalAssessment31_12 {
    const scenario = HabitabilityEngine.evaluate(toScenarioInput(input, 'SIMULATED_REALITY'));
    const indices = HabitabilityIndicesResolver31_6.summarize(scenario);
    const alternatives = HabitabilityAlternativeRoutesResolver31_11.assess(
      scenario, input.alternativeEvidence,
    );
    return Object.freeze({
      contractVersion: '31.12-CT0',
      simulatedReality: Object.freeze({
        layer: 'SIMULATED_REALITY',
        bodyKind: scenario.bodyKind, bodyKey: scenario.bodyKey,
        multiplicity: scenario.multiplicity,
        time: Object.freeze({ ...scenario.time }),
        lifePresence: 'NOT_EVALUATED',
      }),
      physicalPotential: Object.freeze({
        layer: 'PHYSICAL_POTENTIAL', aqueousScenario: scenario,
        aqueousIndices: indices, alternativeRoutes: alternatives,
        lifeProbability: 'NOT_DEFINED',
      }),
    });
  }

  /** Only this DTO should reach a player-facing fiche or discovery surface. */
  static projectObserved(
    input: HabitabilityKnowledgeInput31_12,
    access: HabitabilityObservationAccess31_12,
  ): HabitabilityObservedAssessment31_12 {
    if (!access || typeof access.scientificFicheAccessible !== 'boolean' ||
        !access.discoveryState ||
        !Number.isInteger(access.discoveryState.code)) {
      throw new RangeError('31.12 requires explicit discovery state and fiche authorization.');
    }
    const state = DiscoveryState.fromCode(access.discoveryState.code);
    const canOpen = state === DiscoveryState.CONFIRMED && access.scientificFicheAccessible;

    // An inaccessible fiche cannot even reveal body identity or source metadata.
    // Do not evaluate private inputs in the locked branch: no accidental side
    // channel from a hidden incompatible route or an unobserved moon ocean.
    if (!canOpen) {
      return Object.freeze({
        contractVersion: '31.12-CT0', layer: 'OBSERVED_KNOWLEDGE',
        discoveryState: state.name, access: 'SCIENTIFIC_FICHE_LOCKED',
        bodyKind: null, bodyKey: null, multiplicity: null, time: null,
        aqueousIndices: null, alternativeRoutes: null,
        interpretation: 'ENVIRONMENTAL_COMPATIBILITY_NOT_LIFE_DETECTION',
        lifePresence: 'NOT_EVALUATED',
      });
    }

    // Re-run all three resolvers in the OBSERVED_KNOWLEDGE perspective. Source
    // access is enforced by 31.1 and 31.11 *before* any descriptive index is
    // calculated, including coverage and decisive contradictions.
    const scenario = HabitabilityEngine.evaluate(toScenarioInput(input, 'OBSERVED_KNOWLEDGE'));
    const indices = HabitabilityIndicesResolver31_6.summarize(scenario);
    const alternatives = HabitabilityAlternativeRoutesResolver31_11.assess(
      scenario, input.alternativeEvidence,
    );
    return Object.freeze({
      contractVersion: '31.12-CT0', layer: 'OBSERVED_KNOWLEDGE',
      discoveryState: state.name, access: 'SCIENTIFIC_FICHE_AVAILABLE',
      bodyKind: scenario.bodyKind, bodyKey: scenario.bodyKey,
      multiplicity: scenario.multiplicity,
      time: Object.freeze({ ...scenario.time }),
      aqueousIndices: indices, alternativeRoutes: alternatives,
      interpretation: 'ENVIRONMENTAL_COMPATIBILITY_NOT_LIFE_DETECTION',
      lifePresence: 'NOT_EVALUATED',
    });
  }
}

function toScenarioInput(
  input: HabitabilityKnowledgeInput31_12,
  perspective: HabitabilityScenarioInput['perspective'],
): HabitabilityScenarioInput {
  if (!input || !Array.isArray(input.aqueousEvidence) ||
      !Array.isArray(input.alternativeEvidence)) {
    throw new TypeError('31.12 requires both explicit evidence arrays.');
  }
  return {
    bodyKind: input.bodyKind, bodyKey: input.bodyKey,
    multiplicity: input.multiplicity, time: input.time,
    evidence: input.aqueousEvidence, perspective,
  };
}
