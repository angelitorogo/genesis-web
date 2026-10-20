/**
 * 32.F.2a — Mass-conserving *conditional* H2O phase endmembers.
 * A bulk H2O formation inventory is not a contemporary surface or interior
 * reservoir. These endpoints are explicitly counterfactual model experiments.
 * They do not resolve actual vapor, shell thickness, ocean, or liquid pressure.
 */
export interface MoonWaterPhaseEndpoint32F2a {
  readonly scenario: 'ALL_H2O_EXPOSED_COLD_EQUILIBRIUM' |
    'ALL_H2O_EXPOSED_WARM_CONFINED_EQUILIBRIUM' |
    'ALL_H2O_SEQUESTERED_INTERIOR_PHASE_UNRESOLVED';
  readonly surfaceIceMassKilograms: number;
  readonly surfaceLiquidMassKilograms: number;
  readonly surfaceVaporMassKilograms: number;
  readonly interiorPhaseUnresolvedMassKilograms: number;
  readonly totalMassKilograms: number;
  /** An externally imposed pressure *assumption*, not measured lunar pressure. */
  readonly assumedConfiningPressurePascal: number | null;
}

export interface MoonWaterPhaseInventory32F2a {
  readonly contractVersion: '32.F.2a-conditional-water-endmembers-v1';
  readonly provenance: 'FORMATION_H2O_ENDMEMBER_CONDITIONAL_NOT_OBSERVED';
  readonly hostPlanetOrdinal: number;
  readonly moonOrdinal: number;
  readonly sourceFormationWaterKilograms: number;
  readonly sourceFormationMassKilograms: number;
  readonly sourceSurfaceTemperatureKelvin: number;
  readonly waterSaturationPressurePascal: number | null;
  /** Maximum hypothetical saturated H2O column, NOT real atmospheric mass. */
  readonly saturatedVaporCapacityKilograms: number | null;
  readonly surfaceLiquidRequiresPressureAtLeastPascal: number | null;
  /** Applies only to the conditional density/endmember world, not true water. */
  readonly possibleEndmembers: readonly MoonWaterPhaseEndpoint32F2a[];
  readonly actualSurfaceIceMassKilograms: null;
  readonly actualSurfaceLiquidMassKilograms: null;
  readonly actualSurfaceVaporMassKilograms: null;
  readonly actualInteriorLiquidMassKilograms: null;
  readonly actualInteriorIceMassKilograms: null;
  readonly actualWaterDistributionStatus: 'UNRESOLVED_EXPOSURE_PRESSURE_INTERIOR_GEOMETRY_AND_HISTORY';
  readonly modelLimits: readonly string[];
}
