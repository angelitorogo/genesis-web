/** PRE-33.03a.2b.3a — generation for NEW GAME candidate, not a released V3. */
export const MULTIHOST_FRESH_COEVAL_CANDIDATE_PRE3303A2B3A =
  'PRE-33.03a.2b.3a/FRESH_COEVAL_CANDIDATE/v2' as const;

export type FreshMultihostPhysicalDependencyPRE3303A2B3A =
  | 'STELLAR_EVOLUTION_14_15'
  | 'STELLAR_EVOLVED_CURRENT_PROPERTIES_15'
  | 'ORBITAL_HISTORY_MASS_LOSS_16'
  | 'ORBITAL_ARCHITECTURE_16'
  | 'PLANETS_18_19'
  | 'ATMOSPHERES_20'
  | 'MOONS_21'
  | 'REMNANT_TRANSIENT_HISTORY_29_31'
  | 'INTERVAL_RECONSTRUCTION_32_7_32_12'
  | 'PUBLIC_VERSION_AND_PERSISTENCE';

export interface FreshMultihostDependencyStatusPRE3303A2B3A {
  readonly dependency: FreshMultihostPhysicalDependencyPRE3303A2B3A;
  readonly status: 'REGENERATED_IN_FRESH_CANDIDATE' | 'NOT_REGENERATED_RELEASE_BLOCKER';
  readonly detail: string;
}

export interface FreshMultihostManifestPRE3303A2B3A {
  readonly contractVersion: typeof MULTIHOST_FRESH_COEVAL_CANDIDATE_PRE3303A2B3A;
  readonly sourceGeneratorVersion: 'V2';
  /** This is NOT a valid persisted public generator key. */
  readonly candidateNamespace: string;
  readonly parentSystemKey: string;
  readonly primaryFormationAgeBillionYears: number;
  readonly revisedAgesBillionYears: readonly number[];
  readonly originalAgesBillionYears: readonly number[];
  readonly stellarPhasesChanged: readonly ('A' | 'B' | 'C')[];
  readonly oldSnapshotDigest: string;
  readonly candidateSnapshotDigest: string;
  readonly originalPlanetCount: number;
  readonly regeneratedPlanetCount: number;
  readonly regeneratedAtmospheres: number;
  readonly regeneratedMoonSystems: number;
  readonly regeneratedOrbitHierarchy: boolean;
  readonly planetaryMaterialMassValidated: number;
  readonly moonPopulationValidated: number;
  readonly privateObjectReferenceReuse: false;
  readonly dependencies: readonly FreshMultihostDependencyStatusPRE3303A2B3A[];
  readonly newlyGeneratedGameIsPublic: false;
  readonly persistable: false;
  readonly savedUniverseMutated: false;
  readonly ct0WaterCertified: false;
  readonly readiness: 'FRESH_PHYSICS_STAGED_CANONICAL_RELEASE_BLOCKED';
}
