/**
 * PRE-33.03a.2b.3b — CT-0 provenance of the coeval multihost physical source.
 * A point-15.1 reference mass/luminosity is NOT a current stellar solution.
 * Versioning this distinction prevents an invalid V3 public release.
 */
export type StellarV3MassProvenance =
  | 'COMPACT_REMNANT_27_1_OR_27_4'
  | 'REFERENCE_PROGENITOR_NOT_CURRENT'
  | 'UNRESOLVED_EVOLVED_MASS';
export interface StellarV3EpochComponent {
  readonly label: 'A' | 'B' | 'C';
  readonly evolutionState: string;
  readonly formationAgeGyr: number;
  readonly progenitorInitialMassSolar: number;
  /** Only present if derived from a physical remnant mass, never copied from 15.1. */
  readonly resolvedCurrentGravityMassSolar: number | null;
  readonly gravityMassProvenance: StellarV3MassProvenance;
  readonly terminalEventAgeGyr: number | null;
  readonly massLossAtTerminalSolar: number | null;
  readonly currentBolometricLuminositySolar: null;
  readonly radiationStatus: 'EVOLVED_CT0_SPECTRUM_NOT_SOURCE_BACKED';
}
export interface StellarV3OrbitEpoch {
  readonly branch: 'INNER_AB' | 'OUTER_AB_C';
  readonly referenceSemimajorAxisAu: number;
  readonly referenceEccentricity: number;
  readonly referenceMassSolar: number;
  /** Do not use a reference Keplerian orbit to claim a post-collapse orbit. */
  readonly resolvedCurrentSemimajorAxisAu: null;
  readonly resolvedCurrentEccentricity: null;
  readonly status: 'DATED_ORBITAL_MASS_LOSS_AND_IMPULSE_NOT_RECONSTRUCTED';
}
export interface StellarV3PhysicalEpoch {
  readonly contract: 'PRE-33.03a.2b.3b/V3_PHYSICAL_EPOCH/v1';
  readonly components: readonly StellarV3EpochComponent[];
  readonly orbits: readonly StellarV3OrbitEpoch[];
  readonly presentDayHistoryCompleteness: 'NOT_ESTABLISHED';
  readonly publishable: false;
  readonly unresolved: readonly string[];
}
