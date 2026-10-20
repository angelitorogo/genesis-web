/** 32.F.5 — chronology on the common system-formation axis, never browser time.
 * CT-0 truth is distinct from dated, independently supported physical intervals.
 * A missing interval is UNKNOWN and not an interval of zero heating or no ocean.
 */
export interface LunarHistoricalRange32F5 {
  readonly min: number;
  readonly max: number;
}
export interface LunarDatedPhysicalInterval32F5 {
  readonly startYear: number;
  readonly endYear: number;
  readonly sourceRecordKey: string;
  readonly sourceModel: string;
  readonly temporalSupport: 'CONTINUOUS_DATED_PHYSICAL_MODEL';
  readonly heatFluxWattsPerSquareMeter?: LunarHistoricalRange32F5;
  readonly surfaceTemperatureKelvin?: LunarHistoricalRange32F5;
  readonly surfacePressurePascal?: LunarHistoricalRange32F5;
  readonly liquidH2OMassKilograms?: LunarHistoricalRange32F5;
}
export type LunarHistoricalEffectKind32F5 = 'HEAT_FLUX_CHANGE' |
  'WATER_MASS_CHANGE' | 'SURFACE_PRESSURE_CHANGE' | 'IRRADIANCE_CHANGE';
export interface LunarDatedEnvironmentalEvent32F5 {
  readonly episodeKey: string;
  readonly bodyKey: string;
  readonly startYear: number;
  readonly endYear: number;
  readonly kind: 'REALIZED_IMPACT' | 'RESOLVED_TRANSIENT_EFFECT' |
    'STELLAR_ENVIRONMENT_CHANGE' | 'VOLCANIC_EPISODE' |
    'WATER_RESERVOIR_TRANSITION' | 'GLACIATION_TRANSITION' |
    'CLIMATE_GEOCHEMISTRY_TRANSITION' | 'ATMOSPHERE_TRANSITION';
  readonly sourceRecordKey: string;
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly evidenceKind: 'RESOLVED_PHYSICAL_EVENT' | 'INFERRED_PHYSICAL_EPISODE';
  /** Signed, independently resolved physical change over the event's dated span.
   * Without it the effect is unknown, NEVER zero or inferred from event kind.
   */
  readonly resolvedEffect?: {
    readonly kind: LunarHistoricalEffectKind32F5;
    readonly delta: LunarHistoricalRange32F5;
    readonly sourceRecordKey: string;
    readonly temporalSupport: 'DATED_PHYSICAL_EVENT_CONSEQUENCE';
  };
}
export interface LunarEnvironmentalDatedSlice32F5 {
  readonly startYear: number;
  readonly endYear: number;
  readonly irradianceWattsPerSquareMeter: LunarHistoricalRange32F5 | null;
  /** 32.F.5a: idealized blackbody equilibrium from dated stellar bolometric flux,
   * zero albedo and global redistribution. NOT actual surface temperature. */
  readonly idealRadiativeEquilibriumKelvin32F5a?: LunarHistoricalRange32F5 | null;
  readonly heatFluxWattsPerSquareMeter: LunarHistoricalRange32F5 | null;
  readonly surfaceTemperatureKelvin: LunarHistoricalRange32F5 | null;
  readonly surfacePressurePascal: LunarHistoricalRange32F5 | null;
  readonly liquidH2OMassKilograms: LunarHistoricalRange32F5 | null;
  readonly oceanState: 'PRESENT_IN_DATED_MODEL' | 'ABSENT_IN_DATED_MODEL' | 'UNKNOWN';
  readonly irradianceProvenanceKeys: readonly string[];
  readonly environmentalProvenanceKey: string | null;
  readonly overlappingEventKeys: readonly string[];
  readonly radiativeModelInterrupted: boolean;
}
export interface LunarEnvironmentalEventAssessment32F5 {
  readonly episodeKey: string;
  readonly startYear: number;
  readonly endYear: number;
  readonly kind: LunarDatedEnvironmentalEvent32F5['kind'];
  readonly effectKind: LunarHistoricalEffectKind32F5 | null;
  readonly effectDelta: LunarHistoricalRange32F5 | null;
  readonly sourceRecordKey: string;
  readonly consequenceSourceKey: string | null;
  readonly environmentalConsequence: 'DATED_DELTA_ONLY_NO_STATE_EXTRAPOLATION' |
    'UNKNOWN_NOT_ZERO';
}
export interface MoonEnvironmentalHistory32F5 {
  readonly contractVersion: '32.F.5-dated-lunar-environment-v1';
  readonly provenance: 'RETAINED_V2_DATED_IRRADIANCE_AND_INDEPENDENT_LUNAR_SOURCES';
  readonly bodyKey: string;
  readonly hostPlanetOrdinal: number;
  readonly moonOrdinal: number;
  readonly ageYearsCT0: number | null;
  readonly sourceRevision: string | null;
  readonly conditionalIrradianceStatus32F5a?: 'MODELLED_MS_CONDITIONAL' |
    'UNSUPPORTED_ORBIT_GEOMETRY' | 'HOST_NOT_MAIN_SEQUENCE' |
    'HOST_OUTSIDE_MS_LUMINOSITY_DOMAIN' | 'TOO_YOUNG_OR_FORMING' |
    'EVENT_INVALIDATED_ORBITAL_MODEL' | 'SOURCE_NOT_MATERIALIZED';
  readonly timeScale: 'YEARS_SINCE_SYSTEM_FORMATION';
  readonly intervals: readonly LunarEnvironmentalDatedSlice32F5[];
  readonly events: readonly LunarEnvironmentalEventAssessment32F5[];
  readonly datedModelInterruptions: readonly {
    readonly startYear: number; readonly endYear: number;
    readonly reason: 'PRE_MAIN_SEQUENCE_OR_FORMATION' | 'NOT_MODELLED_STELLAR_ORBITAL_EVOLUTION' |
      'UNRESOLVED_EVENT' | 'UNRESOLVED_ORBIT_GEOMETRY';
  }[];
  readonly currentOceanStateCT0: 'PRESENT' | 'ABSENT' | 'UNRESOLVED';
  readonly currentHeatFluxCT0WattsPerSquareMeter: number | null;
  readonly datedOceanTransitionCount: number;
  readonly datedIrradianceIntervalCount: number;
  readonly historicalOceanContinuity: 'UNKNOWN' | 'RESOLVED_WITH_DATED_INTERVALS';
  readonly sustainedTidalHeating: 'UNKNOWN';
  readonly historicalHabitability: 'UNKNOWN';
  readonly lifePresence: 'NOT_EVALUATED';
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly scientificLimits: readonly string[];
}
