import { type CompactPlanetBulkKind } from './compact-host-planetary-system';

/**
 * 31.3 — A present-time environmental *projection*, not an observed planet,
 * a formation history, or a replacement for ordinary stellar Planet models.
 * Bulk taxonomy is inherited from 31.2; none of these environmental states is
 * a new planetary class.
 */
export type CompactPlanetEnvironmentalRegime =
  | 'RADIATION_CONDITIONED'
  | 'HOST_EMISSION_UNRESOLVED';

export interface CompactHostRadiationScenario {
  readonly modelVersion: 'COMPACT_HOST_RADIATION_31_3_V1';
  /** Which inputs were assumed rather than measured or present in 31.2. */
  readonly thermalBasis: 'HOST_STATE' | 'FIDUCIAL_NEUTRON_SURFACE' | 'NOT_AVAILABLE';
  readonly energeticBasis: 'HOST_STATE' | 'DIPOLE_REFERENCE_ASSUMPTION' | 'NOT_AVAILABLE';
  readonly fiducialTemperatureK: number | null;
  readonly thermalLuminositySolar: number | null;
  readonly energeticLuminositySolar: number | null;
  /** Accretion is bolometric: no spectral X-ray allocation without a spectrum. */
  readonly accretionBolometricLuminositySolar: number | null;
  readonly dipoleSpinDownPowerSolar: number | null;
  /** A magnetar's magnetic activity is NOT determined by its dipole spin-down. */
  readonly magneticActivityEmissionUnresolved: boolean;
  /** Absence of modeled radiation must not be confused with a measured zero. */
  readonly bolometricCompleteness: 'PARTIAL_SCENARIO' | 'NO_HOST_EMISSION_MODEL';
}

export interface CompactHostPlanetEnvironment {
  readonly modelVersion: 'COMPACT_PLANET_ENVIRONMENT_31_3_V1';
  readonly planetOrdinal: number;
  readonly bulkKind: CompactPlanetBulkKind;
  readonly regime: CompactPlanetEnvironmentalRegime;
  /** Intrinsic escape velocity, independent of the unknown exobase state. */
  readonly escapeVelocityKmS: number;
  /** Orbit-averaged flux for assumed channels, not measured irradiance. */
  readonly modeledThermalFluxWm2: number | null;
  readonly modeledEnergeticFluxWm2: number | null;
  readonly modeledAccretionBolometricFluxWm2: number | null;
  /** Sum of channels included in this reference model; NOT total actual flux. */
  readonly modeledIncludedFluxWm2: number | null;
  /** Grayscale equilibrium reference using fixed assumed energy coupling. */
  readonly referenceRadiativeTemperatureK: number | null;
  /** Absorb-all ceiling for INCLUDED channels only, never a global upper bound. */
  readonly includedFluxBlackbodyEquivalentK: number | null;
  /** Neither internal heat nor radiative transfer is constrained in 31.2. */
  readonly actualSurfaceTemperatureK: null;
  readonly greenhouseWarmingK: null;
  readonly intrinsicHeatFluxWm2: null;
  readonly surfacePressurePa: null;
  readonly atmosphericComposition: null;
  readonly intrinsicSurface: 'SOLID_ROCKY_REFERENCE';
  readonly waterInventory: 'UNRESOLVED';
  readonly liquidSurfaceWater: 'UNRESOLVED_PRESSURE_INVENTORY_AND_HEATING';
  readonly atmosphericSurvival: 'UNRESOLVED_COMPOSITION_EXOBASE_AND_SHIELDING';
  /** Equilibrium-vapor caps for *hypothetical* reservoirs, not actual partial pressures. */
  readonly referenceCondensableCapsPa: Readonly<{
    nitrogen: number | null;
    carbonDioxide: number | null;
    argon: number | null;
    carbonMonoxide: number | null;
  }> | null;
  readonly waterPhaseAtReference: 'ICE_IF_PRESENT' | 'PRESSURE_AND_INVENTORY_REQUIRED' | 'UNRESOLVED';
  readonly particleEnvironment: 'PULSAR_WIND_UNQUANTIFIED' | 'MAGNETAR_PARTICLES_UNQUANTIFIED' | 'UNRESOLVED';
  readonly planetaryMagneticShielding: 'UNRESOLVED_PLANET_FIELD_AND_COUPLING';
  readonly energeticExposureAssessment: 'MODELED_ENERGETIC_CHANNEL' | 'UNRESOLVED';
  /** Classify scientific condition, not planetary species/type. */
  readonly newPlanetaryTaxon: false;
}
