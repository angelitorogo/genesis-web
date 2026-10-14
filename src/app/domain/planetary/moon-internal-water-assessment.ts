/**
 * C — Independently bounded cryosphere assessment, not a detection.
 * All results assume synchronous eccentricity tides, uniform conductive ice,
 * k2/Q in [1e-6, 1e-3] and no measured radiogenic heat, ocean salinity,
 * rheology or shell thickness. No seed or additional PRNG calls.
 */
export type MoonIceShellThermalRegime =
  | 'NOT_EVALUABLE_HIGH_ECCENTRICITY'
  | 'NOT_EVALUABLE_NON_SYNCHRONOUS'
  | 'NO_STABLE_SURFACE_ICE'
  | 'ICE_INVENTORY_LIMITED'
  | 'TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO'
  | 'CONDITIONAL_ICE_OCEAN'
  | 'HIGH_TIDAL_FLUX_SCENARIO';

export type MoonCryovolcanismAssessment =
  | 'CONDITIONAL'
  | 'NOT_SUPPORTED_BY_SCENARIO'
  | 'NOT_EVALUABLE';

export interface MoonInternalWaterAssessment {
  readonly basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO';
  readonly tidalHeatFluxMinimumWattsPerSquareMeter: number | null;
  readonly tidalHeatFluxMaximumWattsPerSquareMeter: number | null;
  readonly conductiveShellThicknessMinimumKilometers: number | null;
  readonly conductiveShellThicknessMaximumKilometers: number | null;
  readonly iceShellThermalRegime: MoonIceShellThermalRegime;
  readonly cryovolcanism: MoonCryovolcanismAssessment;
  readonly radiogenicHeatResolved: false;
  readonly oceanConfirmed: false;
}
