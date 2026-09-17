import {
  type MultihostOrbitalHostId,
  type MultihostOrbitFamily,
} from './multihost-planetary-catalog';

/**
 * V2.1 model: one orbital host per body, never one topology for the entire
 * system. This is a non-persisted scientific *diagnostic* while V1 identities
 * and the frozen generator remain unchanged.
 */
export interface MultihostOrbitalHostV21 {
  readonly id: MultihostOrbitalHostId;
  readonly family: MultihostOrbitFamily;
  readonly components: readonly ('A' | 'B' | 'C')[];
  readonly gravitatingMassSolar: number;
}

export type MultihostAssignmentOriginV21 =
  | 'V1_FROZEN'
  | 'V2_TEST_PARTICLE';

export interface MultihostPlanetHostAssignmentV21 {
  readonly bodyId: string;
  readonly label: string;
  readonly hostId: MultihostOrbitalHostId;
  readonly family: MultihostOrbitFamily;
  readonly gravitatingMassSolar: number;
  readonly origin: MultihostAssignmentOriginV21;
  /** V1 must NOT silently inherit V2 test-particle stability verdicts. */
  readonly stability: 'NOT_REASSESSED_V1' | 'TEST_PARTICLE_ONLY';
}

export type MultihostDomainStateV21 =
  | 'OPEN_BOUNDED'
  | 'OPEN_SAMPLING_LIMITED'
  | 'UNSAMPLED'
  | 'CLOSED';

export interface MultihostHostDomainV21 {
  readonly host: MultihostOrbitalHostV21;
  readonly state: MultihostDomainStateV21;
  readonly innerStableAu: number;
  /** null = dynamically unbounded in this approximation, NOT infinite stability. */
  readonly outerStableAu: number | null;
  /** Display/sampling cutoff, NEVER an astrophysical stability boundary. */
  readonly samplingOuterAu: number;
  readonly candidateCount: number;
  readonly startPercent: number;
  readonly widthPercent: number;
  readonly limitation: string;
}

export type MultihostOrbitalVerdictV21 =
  | 'WITHIN_APPROXIMATE_WINDOW'
  | 'INNER_BOUNDARY_CROSSED'
  | 'OUTER_BOUNDARY_CROSSED'
  | 'BOTH_BOUNDARIES_CROSSED'
  | 'CLOSED_HOST_DOMAIN'
  | 'NO_USABLE_SAMPLE';

export interface MultihostOrbitalAssessmentV21 {
  readonly bodyId: string;
  readonly hostId: MultihostOrbitalHostId;
  readonly periapsisAu: number;
  readonly apoapsisAu: number;
  readonly innerClearanceAu: number;
  /** null = no dynamical outer limit established. */
  readonly outerClearanceAu: number | null;
  readonly verdict: MultihostOrbitalVerdictV21;
  readonly startPercent: number;
  readonly widthPercent: number;
}

export interface MultihostOrbitalDiagnosticsV21 {
  readonly version: 'V2_1_QA';
  readonly domains: readonly MultihostHostDomainV21[];
  readonly assignments: readonly MultihostPlanetHostAssignmentV21[];
  readonly assessments: readonly MultihostOrbitalAssessmentV21[];
  readonly displayMinimumAu: number;
  readonly displayMaximumAu: number;
  readonly limitations: readonly string[];
}
