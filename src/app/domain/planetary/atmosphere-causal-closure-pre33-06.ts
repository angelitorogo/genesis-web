import type { AtmosphereGas } from './atmosphere-gas';

/**
 * PRE-33.06 CT-0, common planetary/lunar atmospheric provenance contract.
 * MODEL ≠ MEASUREMENT; a hydrostatic equivalent from 20.x / 21.x is not an
 * independent primordial gas inventory, and condensed H2O is not a gas.
 */
export type AtmosphereClosureStatusPRE3306 =
  | 'NO_SOLID_SURFACE_REFERENCE'
  | 'MISSING_PRIMORDIAL_GAS_INVENTORY_AND_FLUXES'
  | 'MISSING_EXOBASE_AND_STELLAR_FORCING'
  | 'UNIDENTIFIED_PHOTOCHEMICAL_PRODUCTS'
  | 'EXOBASE_OUTSIDE_KINETIC_DOMAIN'
  | 'CONDITIONAL_FORWARD_SCENARIO'
  | 'CAUSAL_INTERVAL_MODEL_RESOLVED';

export interface AtmosphereGasFluxPRE3306 {
  readonly gas: AtmosphereGas;
  readonly initialGasKilograms: number;
  readonly replenishmentKilogramsPerSecond: number;
  readonly thermalEscapeKilogramsPerSecond: number;
  readonly particleEscapeKilogramsPerSecond: number;
  readonly photolysisPerSecond: number;
  readonly photolysisEscapingFraction01: number;
  /** Explicit mass-conserving products of the retained photofragments.
   * Any missing fraction is kept in UNIDENTIFIED, not silently destroyed. */
  readonly photolysisProducts?: readonly Readonly<{ gas: AtmosphereGas; retainedMassFraction01: number }>[];
}
export interface AtmosphereForcingPRE3306 {
  /** Never use a value from legacy pressure as initialGasKilograms. */
  readonly kind: 'INDEPENDENT_PROCEDURAL_FORMATION_AND_RATE_MODEL' | 'CONDITIONAL_ENDMEMBER';
  readonly initialInventorySourceId: string;
  readonly massRateSourceId: string;
  readonly intervalSeconds: number;
  readonly surfaceTemperatureKelvin: number;
  readonly species: readonly AtmosphereGasFluxPRE3306[];
}
export interface AtmosphereExobasePRE3306 {
  readonly sourceId: string;
  readonly altitudeMeters: number;
  readonly temperatureKelvin: number;
  readonly numberDensityPerCubicMeter: number;
  readonly collisionCrossSectionSquareMeters: number;
  readonly euvWattsPerSquareMeter: number;
  readonly particleNumberFluxPerSquareMeterPerSecond: number;
}
export interface AtmosphereClosureInputPRE3306 {
  readonly bodyKind: 'PLANET' | 'MOON';
  readonly radiusEarth: number;
  readonly surfaceGravityEarth: number;
  readonly hasDefinedSolidSurface: boolean;
  /** Phase-20/21 column, only a presentation scenario. */
  readonly legacyScenarioPressurePascal: number | null;
  readonly legacyScenarioMoleFractions: readonly Readonly<{ gas: AtmosphereGas; moleFraction01: number }>[];
  /** Reservoir upper bound, not necessarily gas (nor a verified source rate). */
  readonly conditionalVolatileReservoirCeilingKilograms: number | null;
  readonly reservoirSourceId: string | null;
  /** H2O CT-0 is only water, not an upper bound for all atmospheric gases. */
  readonly referenceH2OCT0Kilograms?: number | null;
  readonly forcing?: AtmosphereForcingPRE3306 | null;
  readonly exobase?: AtmosphereExobasePRE3306 | null;
}
export interface AtmosphereClosurePRE3306 {
  readonly contract: 'PRE-33.06/V3-CROSS-BODY-ATMOSPHERIC-CLOSURE/v1';
  readonly bodyKind: 'PLANET' | 'MOON';
  readonly status: AtmosphereClosureStatusPRE3306;
  readonly hasDefinedSolidSurface: boolean;
  readonly areaSquareMeters: number;
  readonly gasKilogramsPerPascal: number;
  readonly scenarioPressurePascal: number | null;
  readonly scenarioEquivalentGasMassKilograms: number | null;
  readonly scenarioPartialsPascal: readonly Readonly<{gas: AtmosphereGas; pressurePascal: number}>[];
  readonly conditionalVolatileReservoirCeilingKilograms: number | null;
  readonly reservoirSourceId: string | null;
  readonly referenceH2OCT0Kilograms: number | null;
  readonly inventorySourceId: string | null;
  readonly ratesSourceId: string | null;
  readonly exobaseSourceId: string | null;
  readonly intervalSeconds: number | null;
  readonly initialGasKilograms: number | null;
  readonly suppliedKilograms: number | null;
  readonly thermalEscapedKilograms: number | null;
  readonly particleEscapedKilograms: number | null;
  readonly photolysisEscapedKilograms: number | null;
  readonly unidentifiedPhotochemicalKilograms: number | null;
  readonly condensedKilograms: number | null;
  readonly remainingGasKilograms: number | null;
  readonly relativeMassResidual01: number | null;
  readonly exobaseKnudsenNumber: number | null;
  readonly candidateForwardPressurePascal: number | null;
  readonly candidateForwardPartialsPascal?: readonly Readonly<{gas: AtmosphereGas;pressurePascal:number}>[];
  readonly causalModelPressurePascal: number | null;
  readonly causalModelPartialsPascal: readonly Readonly<{gas: AtmosphereGas; pressurePascal: number}>[];
  readonly observedPressure: false;
  readonly atmospherePresenceObserved: false;
  readonly biologyAuthorized: false;
  readonly historyEpochs?: readonly Readonly<{fromYears:number;toYears:number;sourceId:string;
    xuvWattsPerSquareMeter:number;replenishedKilograms:number;escapedKilograms:number;
    condensedKilograms:number;gasKilograms:number;pressurePascal:number}>[];
  readonly formationReservoirKilograms?: number | null;
  readonly assumedChemistry?: 'SOLAR_SCALED_FORMATION_MODEL' | 'UNIDENTIFIED_LUNAR_VOLATILE_ENDMEMBER' | null;
  readonly limitations: readonly string[];
}
