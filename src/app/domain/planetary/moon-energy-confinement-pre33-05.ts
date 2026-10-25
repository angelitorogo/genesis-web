/** PRE-33.05: CT-0, model-bounded lunar energy and confinement; NOT observations. */
export interface MoonEnergyConfinementPRE3305 {
  readonly contractVersion: 'PRE-33.05/V3-LUNAR-ENERGY-CONFINEMENT/v1';
  readonly provenance: 'V3_MATERIALIZED_ORBIT_INTERIOR_AND_CT0_RADIOGENIC_PRIOR';
  readonly hostPlanetOrdinal: number;
  readonly moonOrdinal: number;
  readonly tidalRegime: 'BOUNDED_SYNCHRONOUS_LOW_E' | 'UNRESOLVED_SPIN_OR_HIGH_E';
  readonly tidalResponseK2OverQMinimum: number | null;
  readonly tidalResponseK2OverQMaximum: number | null;
  readonly tidalPowerMinimumWatts: number | null;
  readonly tidalPowerMaximumWatts: number | null;
  readonly tidalFluxMinimumWattsPerSquareMeter: number | null;
  readonly tidalFluxMaximumWattsPerSquareMeter: number | null;
  readonly eccentricityDampingYearsMinimum: number | null;
  readonly eccentricityDampingYearsMaximum: number | null;
  /** Identical to source 32.F.2c: never summed twice with source tidal power. */
  readonly radiogenicFluxWattsPerSquareMeter: number | null;
  readonly totalFluxMinimumWattsPerSquareMeter: number | null;
  readonly totalFluxNominalWattsPerSquareMeter: number | null;
  readonly totalFluxMaximumWattsPerSquareMeter: number | null;
  readonly referenceConductiveBasalMeltingFluxWattsPerSquareMeter: number | null;
  readonly confinementPressurePascal: number | null;
  readonly thermalConfinement: 'DRY_NO_WATER' | 'OUTSIDE_10_GPA' | 'UNRESOLVED_HEAT_OR_STRUCTURE' |
    'ENERGY_BELOW_REFERENCE' | 'ENERGY_SPANS_REFERENCE' | 'ENERGY_ABOVE_REFERENCE' |
    'SURFACE_ICE_NOT_STABLE';
  readonly pressureDomain: 'NO_H2O' | 'BELOW_2_GPA' | 'FROM_2_TO_10_GPA' | 'BEYOND_10_GPA';
  readonly oceanConfirmed: false;
  readonly independentThermalHistoryResolved: false;
  readonly tidalResonanceSustained: false;
  readonly scientificLimits: readonly string[];
}
