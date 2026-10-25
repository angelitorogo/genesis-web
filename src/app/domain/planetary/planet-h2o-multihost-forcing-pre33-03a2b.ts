/** PRE-33.03a.2b: internally modeled orbital-phase-averaged irradiance.
 * No orbital phase, mutual inclination, joint formation age, mass-loss orbital
 * trajectory, or historical XUV spectrum is stored by the frozen V2 model.
 */
import type { PlanetH2OStellarInputPRE3303A2A } from './planet-h2o-stellar-evolution-pre33-03a2a';
import type { H2ODatedHistoryPRE3303A1, H2OEvolutionResultPRE3303A1 } from './planet-h2o-evolution-contract-pre33-03a1';
export const PRE3303A2B_MULTIPLE_FORCING='PRE-33.03a.2b/multihost-orbital-forcing/v1' as const;
export type HostLabelPRE3303A2B='A'|'B'|'C'|'AB';
export interface KeplerOrbitPRE3303A2B {
 readonly semiMajorAxisAu:number;
 readonly eccentricity:number;
}
export interface MultipleStellarGeometryPRE3303A2B {
 readonly systemSourceKey:string; // G#/S#/O# from planet's public parent locator
 readonly multiplicity:'BINARY'|'TRIPLE';
 readonly hosts:readonly Readonly<{label:'A'|'B'|'C'; source:PlanetH2OStellarInputPRE3303A2A}>[];
 readonly innerOrbit:KeplerOrbitPRE3303A2B;
 readonly outerOrbit:KeplerOrbitPRE3303A2B|null;
 readonly planetHost:HostLabelPRE3303A2B;
 readonly planetOrbit:KeplerOrbitPRE3303A2B;
 /** Frozen source orbits: no historical phase or plane; approximate coplanar angular averages. */
 readonly orbitalModel:'FROZEN_16_KEPLERIAN_REFERENCE_NO_PHASE';
 /** Explicit versioned scientific lineage. Omitted for all frozen V2 callers. */
 readonly scientificChronologyRevision?:'PRE-33.03a.2b.2/coeval-scientific-physical-revision/v1';
}
export type MultipleH2OStatusPRE3303A2B =
 |'MODELED_DATED_CONDITIONAL_MULTIPLE_S'
 |'MODELED_DATED_CONDITIONAL_MULTIPLE_P'
 |'UNRESOLVED_COMPONENT_AGE_ALIGNMENT'
 |'UNRESOLVED_COMPONENT_STELLAR_RADIATION'
 |'UNRESOLVED_COMPONENT_EVOLUTION_BOUNDARIES'
 |'UNRESOLVED_ORBITAL_SEPARATION'
 |'UNRESOLVED_SURFACE_DOMAIN';
export interface MultipleH2OResultPRE3303A2B {
 readonly contractVersion:typeof PRE3303A2B_MULTIPLE_FORCING;
 readonly perspective:'INTERNAL_SIMULATED_REALITY';
 readonly status:MultipleH2OStatusPRE3303A2B;
 readonly bodyKey:string;
 readonly systemSourceKey:string;
 readonly planetHost:HostLabelPRE3303A2B;
 readonly componentSourceKeys:readonly string[];
 readonly history:H2ODatedHistoryPRE3303A1|null;
 readonly evolution:H2OEvolutionResultPRE3303A1|null;
 readonly geometryMethod:'COPLANAR_KEPLER_PHASE_AVERAGE_HYPOTHESIS'|'NONE';
 /** Current-epoch conditional orbital phase mean, never a dated shared XUV history. */
 readonly ct0PhaseAverageXuvWattsPerSquareMeter:number|null;
 readonly ct0FluxProvenance:'INDIVIDUAL_FROZEN_STELLAR_AGES_XUV_HYPOTHESES'|'VERSIONED_COEVAL_STELLAR_AGES_XUV_HYPOTHESES'|'UNRESOLVED';
 readonly samplesPerEpoch:number;
 readonly ageAlignment:'WITHIN_50_MYR_COEVAL_MODEL_ASSUMPTION'|'UNRESOLVED';
 readonly orbitalEvolution:'FROZEN_ORBIT_NO_MASS_LOSS_RECONSTRUCTION';
 readonly ct0Certified:false;
 readonly observedEvidenceGranted:false;
 readonly lifeEvaluated:false;
}
