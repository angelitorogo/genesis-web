/**
 * Experimental V2 candidate architecture. Deliberately separate from frozen
 * GeneratorVersion.V1 planet identities, physical planets and persisted Ground
 * Truth: an admissible test-particle window is not proof a disk made planets.
 */
export type MultihostOrbitalHostId = 'A' | 'B' | 'C' | 'AB' | 'ABC';
export type MultihostOrbitFamily = 'S_TYPE' | 'P_TYPE';

export interface MultihostStableWindow {
  readonly hostId: MultihostOrbitalHostId;
  readonly family: MultihostOrbitFamily;
  readonly gravitatingMassSolar: number;
  readonly innerStableAu: number;
  /** null means no *dynamical* outer cutoff is known. */
  readonly outerStableAu: number | null;
  readonly referenceOuterAu: number;
  readonly usable: boolean;
  readonly limitation: string;
}

export interface MultihostCandidateOrbit {
  readonly id: string;
  readonly hostId: MultihostOrbitalHostId;
  readonly family: MultihostOrbitFamily;
  readonly ordinal: number;
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly periapsisAu: number;
  readonly apoapsisAu: number;
  readonly periodDays: number;
  readonly inclinationDegrees: number;
  readonly rotationDegrees: number;
  readonly epochMeanAnomalyDegrees: number;
  /** A laboratory candidate, NOT a frozen planet or a persistable BodyLocator. */
  readonly experimental: true;
}

export interface MultihostPlanetaryCatalog {
  readonly version: 'V2_EXPERIMENTAL';
  readonly sourceSystemSeed: string;
  readonly windows: readonly MultihostStableWindow[];
  readonly candidates: readonly MultihostCandidateOrbit[];
  readonly limitations: readonly string[];
}
