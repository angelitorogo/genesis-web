/** PRE-33.03a.2b.3b: isolated historical dependency integration for fresh coeval systems.
 * Deliberately NOT a public GeneratorVersion or a saved-universe schema.
 */
export const MULTIHOST_HISTORICAL_BRIDGE_PRE3303A2B3B =
  'PRE-33.03a.2b.3b/COEVAL_HISTORY_BRIDGE/v2' as const;

export type HistoricalReleaseDependencyPRE3303A2B3B =
  | 'REVISED_STAR_AND_LIFETIME_14_15'
  | 'REGENERATED_KEPLER_ORBITS_16'
  | 'REBUILT_PLANETS_ATMOSPHERES_MOONS_18_21'
  | 'COMPACT_REMNANT_CT0_27_31'
  | 'EVOLVED_STELLAR_RADIATION_AND_MASS_15'
  | 'HISTORICAL_ORBIT_MASS_LOSS_16'
  | 'TRANSIENT_EVENTS_EXPOSURES_RESPONSES_29_31_32_9'
  | 'SOURCE_BACKED_32_7_32_12_EVENTS'
  | 'PUBLIC_GENERATOR_VERSION_AND_PERSISTENCE';
export type HistoricalReleaseStatusPRE3303A2B3B =
  'MATERIALIZED' | 'VALIDATED_SOURCE_INTERFACE_HISTORY_NOT_COMPLETE' |
  'UNRESOLVED_RELEASE_BLOCKER';
export interface HistoricalDependencyPRE3303A2B3B {
  readonly key: HistoricalReleaseDependencyPRE3303A2B3B;
  readonly status: HistoricalReleaseStatusPRE3303A2B3B;
  readonly detail: string;
}
export interface HistoricalRemnantPRE3303A2B3B {
  readonly component: 'A' | 'B' | 'C';
  readonly state: string;
  readonly sourceFormationAgeGyr: number | null;
  readonly remnantType: 'NEUTRON_STAR' | 'STELLAR_BLACK_HOLE' | 'WHITE_DWARF' | 'NONE';
  readonly remnantMassSolar: number | null;
  readonly status: 'PROJECTED_CT0_FROM_REVISED_SOURCE' | 'NOT_APPLICABLE' |
    'WHITE_DWARF_MASS_MODEL_NOT_RESOLVED';
  /** Does not assert a dated explosion, orbit recoil or planetary exposure. */
  readonly datedTransientReconstructed: false;
}
export interface HistoricalBridgeManifestPRE3303A2B3B {
  readonly contract: typeof MULTIHOST_HISTORICAL_BRIDGE_PRE3303A2B3B;
  readonly physicalNamespace: string;
  readonly originGenerator: 'V2_REFERENCE_ONLY';
  readonly sharedSystemAgeGyr: number;
  readonly revisedComponentAgesGyr: readonly number[];
  readonly remnantProfiles: readonly HistoricalRemnantPRE3303A2B3B[];
  readonly planetCount: number;
  readonly history32_12WindowsValidated: number;
  /** Dated 27.1/27.4 terminal-state episodes, NOT 29/32.9 effects. */
  readonly compactFormationEpisodes32_12: number;
  /** Mature phase-18 outputs whose formation completion is in the future. */
  readonly planetsWithUnfinishedFormation: number;
  readonly missingDatedPhysicalEpisodeSources: number;
  readonly dependencies: readonly HistoricalDependencyPRE3303A2B3B[];
  readonly legacyDigestBefore: string;
  readonly legacyDigestAfter: string;
  readonly legacyMutated: false;
  readonly gamePublicationAllowed: false;
  readonly canonicalMigrationPerformed: false;
  readonly waterCT0Certified: false;
  readonly status: 'REBUILT_CT0_AND_HISTORY_INTERFACE_PUBLICATION_BLOCKED';
}
