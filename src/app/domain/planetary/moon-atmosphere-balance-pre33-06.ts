import type { AtmosphereGas } from './atmosphere-gas';

/** PRE-33.06: independent-source audit, never a reconstruction from V1 support indices. */
export interface MoonIndependentExobasePRE3306 {
  readonly sourceId: string;
  readonly exobaseAltitudeMeters: number;
  readonly exobaseTemperatureKelvin: number;
  readonly exobaseNumberDensityPerCubicMeter: number;
  readonly collisionCrossSectionSquareMeters: number;
  /** Independently characterized HIGH-ENERGY forcing, not bolometric S⊕. */
  readonly euvEnergyFluxWattsPerSquareMeter: number;
  readonly incidentParticleNumberFluxPerSquareMeterPerSecond: number;
}

export type MoonAtmosphereStatusPRE3306 =
  | 'INDEPENDENT_INTERVAL_MODEL_NOT_OBSERVATION'
  | 'MISSING_INDEPENDENT_GAS_INVENTORY'
  | 'MISSING_INDEPENDENT_SOURCE_SINK_RATES'
  | 'MISSING_INDEPENDENT_EXOBASE_AND_HIGH_ENERGY_FORCING'
  | 'EXOBASE_OUTSIDE_COLLISIONAL_TRANSITION_DOMAIN'
  | 'PHOTOCHEMICAL_PRODUCTS_UNIDENTIFIED';

export interface MoonAtmosphereBalancePRE3306 {
  readonly contractVersion: 'PRE-33.06/V3-INDEPENDENT-LUNAR-ATMOSPHERE/v1';
  readonly provenance: 'V3_MATERIALIZED_GEOMETRY_AND_32F1_ONLY_NO_V1_GAS_INFERENCE';
  readonly hostPlanetOrdinal: number;
  readonly moonOrdinal: number;
  readonly status: MoonAtmosphereStatusPRE3306;
  readonly surfaceAreaSquareMeters: number;
  readonly kilogramsOfGasPerPascal: number;
  /** Legacy model: scenario only; hydrostatic equivalence is NOT measured mass. */
  readonly scenarioPressurePascal: number | null;
  readonly scenarioEquivalentGasMassKilograms: number | null;
  readonly scenarioPartialPressuresPascal: readonly Readonly<{gas: AtmosphereGas; pressurePascal: number}>[];
  readonly independentSourceId: string | null;
  readonly independentExobaseSourceId: string | null;
  readonly initialGasMassKilograms: number | null;
  readonly remainingGasMassKilograms: number | null;
  readonly replenishedMassKilograms: number | null;
  readonly thermalEscapeMassKilograms: number | null;
  readonly particleEscapeMassKilograms: number | null;
  readonly photolysisEscapedMassKilograms: number | null;
  readonly photochemicalProductMassKilograms: number | null;
  readonly condensedMassKilograms: number | null;
  readonly independentExobaseKnudsenNumber: number | null;
  /** Only authorized when independent inventory, fluxes, chemistry AND exobase domain are available. */
  readonly physicalSurfacePressurePascal: number | null;
  readonly physicalPartialPressuresPascal: readonly Readonly<{gas: AtmosphereGas; pressurePascal: number}>[];
  readonly physicalSurfacePressureObserved: false;
  readonly actualAtmospherePresenceCertified: false;
  readonly historicalPersistenceCertified: false;
  readonly scientificLimitations: readonly string[];
}
