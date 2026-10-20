/**
 * 32.F.2b — conditional, differentiated interior of the formation endmember.
 * These quantities are NOT recovered historical layers, current ocean masses,
 * radiogenic measurements, or observable knowledge of the moon.
 */
export type MoonInteriorLayerKind32F2b =
  | 'METALLIC_CORE' | 'SILICATE_MANTLE' | 'OTHER_CONDENSABLES_UNIDENTIFIED' | 'H2O_OUTER_SHELL';

export interface MoonInteriorLayer32F2b {
  readonly kind: MoonInteriorLayerKind32F2b;
  readonly massKilograms: number;
  readonly innerRadiusKilometers: number;
  readonly outerRadiusKilometers: number;
  readonly thicknessKilometers: number;
  /** Effective scenario density. Unknown chemistry and porosity are assumed. */
  readonly effectiveDensityKilogramsPerCubicMeter: number;
  readonly pressureAtInnerBoundaryPascal: number;
  readonly pressureAtOuterBoundaryPascal: number;
}

export interface MoonInteriorProfilePoint32F2b {
  readonly depthKilometers: number;
  readonly pressurePascal: number;
}

export type MoonThermalScenarioRegime32F2b =
  | 'NO_FORMATION_WATER' | 'NO_RESOLVED_TIDAL_HEAT_INPUT'
  | 'NO_STABLE_SURFACE_ICE_IN_ASSUMED_STRATIGRAPHY'
  | 'ICE_ONLY_IN_THIS_CONDITIONAL_MODEL'
  | 'POTENTIAL_LIQUID_BELOW_ICE_CONDITIONAL'
  | 'UNRESOLVED_HIGH_PRESSURE_ICE_PHASES'
  | 'UNRESOLVED_CONDUCTION_OUTSIDE_DOMAIN';

export interface MoonInteriorThermalPoint32F2b {
  readonly depthKilometers: number;
  readonly lithostaticPressurePascal: number;
  /** Null if the simplified conductive profile is outside its domain. */
  readonly conditionalTemperatureKelvin: number | null;
}

export interface MoonInteriorThermalScenario32F2b {
  readonly case: 'LOW_TIDAL_NO_RADIOGENIC' | 'HIGH_TIDAL_WITH_ASSUMED_RADIOGENIC_UPPER';
  readonly tidalFluxWattsPerSquareMeter: number | null;
  /** Upper-case value is an explicit assumed power-per-rock-mass, not an observation. */
  readonly assumedRadiogenicFluxWattsPerSquareMeter: number | null;
  readonly assumedBasalFluxWattsPerSquareMeter: number | null;
  readonly baseOfH2OShellTemperatureKelvin: number | null;
  readonly modelledIceThicknessKilometers: number | null;
  /** Phase allocations are a sensitivity experiment only, never true current mass. */
  readonly conditionalIceMassKilograms: number | null;
  readonly conditionalLiquidMassKilograms: number | null;
  readonly phaseRegime: MoonThermalScenarioRegime32F2b;
  readonly temperatureProfile: readonly MoonInteriorThermalPoint32F2b[];
}

export interface MoonInteriorStructure32F2b {
  readonly contractVersion: '32.F.2b-differentiated-conditional-profile-v1';
  readonly provenance: 'CONDITIONAL_DIFFERENTIATED_FORMATION_ENDMEMBER_NOT_OBSERVED';
  readonly hostPlanetOrdinal: number;
  readonly moonOrdinal: number;
  readonly totalMassKilograms: number;
  readonly waterMassKilograms: number;
  readonly surfaceRadiusKilometers: number;
  readonly layers: readonly MoonInteriorLayer32F2b[];
  readonly pressureProfile: readonly MoonInteriorProfilePoint32F2b[];
  readonly centralLithostaticPressurePascal: number;
  readonly assumedWaterConductivityWattsPerMeterKelvin: 2.5;
  readonly pressureDependentMeltModel: 'PURE_H2O_ICE_IH_ONLY_BELOW_200_MPA';
  readonly assumedRadiogenicSpecificPowerUpperWattsPerKilogramRock: 1e-11;
  readonly actualRadiogenicHeatFluxWattsPerSquareMeter: null;
  readonly actualSalinity: null;
  readonly actualOceanPresence: 'UNKNOWN';
  readonly actualInteriorLiquidMassKilograms: null;
  readonly actualIceShellThicknessKilometers: null;
  readonly thermalScenarios: readonly MoonInteriorThermalScenario32F2b[];
  readonly modelLimits: readonly string[];
}
