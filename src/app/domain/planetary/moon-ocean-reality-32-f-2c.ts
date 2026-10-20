/**
 * 32.F.2c — an explicit state OF THE PROCEDURALLY SIMULATED WORLD at CT-0.
 * This is not a direct observation, independent reconstruction, or proof that
 * this unique interior follows from bulk density. A confirmed system reveals
 * modelled objects/results even if there is no separate moon-discovery action.
 */
export type MoonSimulatedOceanState32F2c =
  | 'PRESENT_IN_SIMULATED_MODEL'
  | 'ABSENT_IN_SIMULATED_MODEL'
  | 'UNRESOLVED_IN_SIMULATED_MODEL';

export type MoonWaterPhase32F2c = 'ICE_IH' | 'LIQUID_H2O' |
  'HIGH_PRESSURE_ICE_APPROX' | 'UNRESOLVED';

export interface MoonOceanRadialLayer32F2c {
  readonly phase: MoonWaterPhase32F2c;
  /** Depth increases toward the lunar centre. */
  readonly topDepthKilometers: number;
  readonly bottomDepthKilometers: number;
  readonly massKilograms: number;
  readonly pressureTopPascal: number;
  readonly pressureBottomPascal: number;
  readonly temperatureTopKelvin: number;
  readonly temperatureBottomKelvin: number;
}

export interface MoonOceanReality32F2c {
  readonly contractVersion: '32.F.2c-seeded-interior-ocean-model-v1';
  readonly provenance: 'SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION';
  readonly hostPlanetOrdinal: number;
  readonly moonOrdinal: number;
  readonly state: MoonSimulatedOceanState32F2c;
  readonly reason: 'NO_FORMATION_H2O' | 'ICE_STABLE_IN_GENERATED_MODEL' |
    'SUBSURFACE_LIQUID_IN_GENERATED_MODEL' | 'TEMPERATE_SURFACE_WITH_UNRESOLVED_CONFINEMENT' |
    'MISSING_TIDAL_HEAT' | 'HIGH_PRESSURE_PHASE_OUTSIDE_DOMAIN' |
    'THERMAL_TRANSPORT_OUTSIDE_DOMAIN' | 'UNRESOLVED_INTERFACE';
  /** Properties of the adopted *procedural constitutive scenario*, not measured physical constants. */
  readonly generatedTidalFluxWattsPerSquareMeter: number | null;
  readonly generatedRadiogenicSpecificPowerWattsPerKilogramRock: number | null;
  readonly generatedRadiogenicFluxWattsPerSquareMeter: number | null;
  readonly generatedTotalSurfaceHeatFluxWattsPerSquareMeter: number | null;
  readonly assumedIceConductivityWattsPerMeterKelvin: 2.5;
  readonly assumedOceanAdiabaticTemperatureGradientKelvinPerPascal: 1.2e-8;
  readonly meltingDiagram: 'APPROX_PURE_H2O_IH_III_V_VI_0_TO_2_GPA';
  readonly surfaceTemperatureKelvin: number;
  readonly waterInventoryKilograms: number;
  /** Gauge P relative to the unspecified surface atmospheric pressure. */
  readonly pressureAtWaterShellBasePascal: number;
  readonly waterShellThicknessKilometers: number;
  readonly iceCoverThicknessKilometers: number | null;
  readonly liquidLayerThicknessKilometers: number | null;
  readonly highPressureIceThicknessKilometers: number | null;
  readonly simulatedLiquidWaterMassKilograms: number | null;
  readonly simulatedSolidWaterMassKilograms: number | null;
  readonly radialLayers: readonly MoonOceanRadialLayer32F2c[];
  readonly scientificLimits: readonly string[];
}
