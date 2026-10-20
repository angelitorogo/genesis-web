/**
 * 32.F.1c: direct physical constraints from a materialized V2 moon.
 * These are NOT an initial gas inventory, an escape rate, or a resolved
 * atmosphere. No inherited phase-21 index can fill those missing quantities.
 */
export interface MoonAtmosphereAutomaticConstraints32F1c {
  readonly basis: 'V2_MATERIALIZED_GRAVITY_RADIUS_AND_TEMPERATURE';
  /** Escape speed at the lunar surface, calculated from g and R. */
  readonly escapeVelocityMetersPerSecond: number;
  /** Exact hydrostatic conversion for a thin, globally distributed gas column. */
  readonly kilogramsOfGasPerPascal: number;
  /** Vapor saturation at the supplied temperature, only under phase equilibrium.
   * Null outside the supported, unclamped water-vapor curve domain. */
  readonly waterVaporSaturationPascalIfEquilibrated: number | null;
  readonly pressureStatus: 'UNRESOLVED_WITHOUT_INDEPENDENT_GAS_MASS';
  readonly rateStatus: 'UNRESOLVED_WITHOUT_EUV_PARTICLES_PHOTOCHEMISTRY_AND_SOURCE_RATES';
}
