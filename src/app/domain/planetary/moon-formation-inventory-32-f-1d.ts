/**
 * 32.F.1d — one *conditional* formation-composition realization attached to an
 * already-materialized moon. This is not a measured or uniquely inferred
 * primordial composition: bulk density alone does not identify mineralogy,
 * porosity, chemical species, or an atmosphere.
 */
export type MoonFormationPathway32F1d =
  | 'CIRCUMPLANETARY_ACCRETION_CANDIDATE'
  | 'CO_ACCRETION_CANDIDATE'
  | 'IMPACT_DEBRIS_CANDIDATE'
  | 'DYNAMICAL_CAPTURE_CANDIDATE';

export interface MoonFormationInventory32F1d {
  readonly contractVersion: '32.F.1d-density-endmember-scenario-v1';
  readonly provenance: 'DETERMINISTIC_CONDITIONAL_FORMATION_MODEL_NOT_OBSERVATION';
  readonly hostPlanetOrdinal: number;
  readonly moonOrdinal: number;
  readonly formationCandidates: readonly MoonFormationPathway32F1d[];
  /** No event/origin is asserted as historical fact. */
  readonly selectedFormationPathway: 'UNRESOLVED' | 'CIRCUMPLANETARY_ACCRETION_CANDIDATE';
  readonly totalMassKilograms: number;
  readonly metallicMassKilograms: number;
  readonly silicateMassKilograms: number;
  /** Scenario condensed H2O inventory, NOT liquid water or a confirmed ocean. */
  readonly waterIceMassKilograms: number;
  /** Undifferentiated condensable inventory; not an identified gas species. */
  readonly otherCondensableMassKilograms: number;
  readonly rockMassKilograms: number;
  readonly totalCondensableMassKilograms: number;
  /** Conditional mass upper ceiling; outgassing efficiency is not known. */
  readonly maximumPotentialVolatileSupplyKilograms: number;
  readonly waterIceSpeciation: 'H2O_ENDMEMBER_ASSUMPTION_NOT_IDENTIFIED';
  readonly otherVolatileSpeciation: 'UNRESOLVED';
  readonly modelPorosityFraction01: number;
  readonly allowedPorosityRange01: readonly [number, number];
  readonly modelBulkDensityGramsPerCubicCentimeter: number;
  readonly sourceBulkDensityGramsPerCubicCentimeter: number;
  readonly densityAssumptions: 'VOLUME_ADDITIVE_ICE_SILICATE_METAL_ENDMEMBERS';
  /** The preexisting V2 moon mass and radius have NOT been modified. */
  readonly initialAtmosphericGasMassKilograms: null;
  readonly atmosphericLossAndReplenishmentRates: null;
  readonly historyResolution: 'INITIAL_SCENARIO_ONLY_NO_DATED_EVOLUTION';
  readonly uncertainty: 'NON_IDENTIFIABLE_COMPOSITION_AND_FORMATION_PATHWAY';
}
