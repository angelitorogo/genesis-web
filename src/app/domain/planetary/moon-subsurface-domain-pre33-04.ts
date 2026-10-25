/** PRE-33.04: extended *conditional* H2O subsurface phase domain on public V3 moons.
 * It is not an observational identification of an ocean or measured salinity. */
export type LunarPressureDomainPRE3304 =
  | 'NO_FORMATION_H2O'
  | 'LEGACY_BELOW_2_GPA'
  | 'EXTENDED_2_TO_10_GPA'
  | 'BEYOND_10_GPA_UNRESOLVED'
  | 'GEOMETRY_OR_THERMAL_UNRESOLVED';
export type LunarThermalCasePRE3304 = 'LOW_TIDAL' | 'NOMINAL_CT0' | 'HIGH_TIDAL';
export interface LunarOceanScenarioPRE3304 {
  readonly thermalCase: LunarThermalCasePRE3304;
  readonly heatFluxWattsPerSquareMeter: number;
  readonly iceCoverKilometers: number;
  readonly liquidLayerKilometers: number;
  readonly highPressureIceKilometers: number;
  readonly liquidMassKilograms: number;
  readonly solidMassKilograms: number;
  readonly classification: 'CONDITIONAL_ICE_ONLY' | 'CONDITIONAL_LIQUID_BENEATH_ICE' |
    'CONDITIONAL_LIQUID_AND_HIGH_PRESSURE_ICE' | 'UNRESOLVED_TRANSPORT';
}
export interface MoonSubsurfaceDomainPRE3304 {
  readonly contractVersion: 'PRE-33.04/V3-LUNAR-SUBSURFACE-DOMAIN/v1';
  readonly provenance: 'V3_PUBLIC_PROJECTION_FROM_MATERIALIZED_32F_LUNAR_SOURCES';
  readonly hostPlanetOrdinal: number;
  readonly moonOrdinal: number;
  readonly domain: LunarPressureDomainPRE3304;
  readonly waterMassKilograms: number;
  readonly shellThicknessKilometers: number;
  readonly basalPressurePascal: number | null;
  readonly depthAt2GPaKilometers: number | null;
  readonly depthAt10GPaKilometers: number | null;
  readonly pressureProfile: readonly Readonly<{ depthKilometers: number; pressurePascal: number }>[];
  readonly thermalEvaluation: 'DRY' | 'THREE_CONDITIONAL_CASES' | 'MISSING_THERMAL_INPUTS' | 'OUTSIDE_PRESSURE_DOMAIN';
  readonly thermalScenarios: readonly LunarOceanScenarioPRE3304[];
  readonly actualPhaseCertified: false;
  readonly actualSalinityResolved: false;
  readonly lunarHistoryWaterBudgetResolved: false;
  readonly observationalOceanConfirmed: false;
  readonly scientificLimits: readonly string[];
}
