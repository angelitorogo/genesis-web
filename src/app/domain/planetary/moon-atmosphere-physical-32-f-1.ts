import type { AtmosphereGas } from './atmosphere-gas';

/**
 * 32.F.1: a quantified gas-column interval model. Real independent forcing
 * and the 32.F.1e explicitly conditional sensitivity endmember are DIFFERENT
 * provenance classes and must never be conflated. None of the phase-21 normalized volatile/tidal indices
 * can be used as a substitute for these masses or mass-flow rates.
 *
 * Constant rates and isothermal hydrostatic columns are explicit
 * modelling assumptions. Independent sources must justify their interval;
 * this contract alone is NOT observational evidence or historical certification.
 */
export interface MoonAtmosphereGasForcing32F1 {
  readonly gas: AtmosphereGas;
  readonly initialGasMassKilograms: number;
  readonly replenishmentKilogramsPerSecond: number;
  readonly thermalEscapeKilogramsPerSecond: number;
  readonly particleEscapeKilogramsPerSecond: number;
  /** Independently supplied dissociation frequency; never estimated from S⊕. */
  readonly photolysisRatePerSecond: number;
  /** Fraction of photodissociated mass that actually escapes. The remainder
   * enters an unspecified photoproduct reservoir and makes pressure unresolved. */
  readonly photolysisEscapingFraction01: number;
}

export interface MoonAtmospherePhysicalForcing32F1 {
  /** Conditional endmembers are *never* observed/independent atmospheres. */
  readonly sourceKind: 'INDEPENDENT_MASS_AND_FLUXES' | 'CONDITIONAL_FORMATION_ENDMEMBER';
  readonly sourceId: string;
  readonly durationSeconds: number;
  /** Collision cross-section needed to assess surface collisionality / exosphere. */
  readonly collisionCrossSectionSquareMeters: number;
  readonly gasForcings: readonly MoonAtmosphereGasForcing32F1[];
}

export type MoonAtmospherePhysicalRegime32F1 =
  | 'STABLE_OVER_EVALUATED_INTERVAL'
  | 'TRANSIENT'
  | 'EXOSPHERE'
  | 'ABSENT_IN_EVALUATED_MODEL'
  | 'UNRESOLVED_PHOTOCHEMISTRY';

export interface MoonAtmosphereGasResult32F1 {
  readonly gas: AtmosphereGas;
  readonly gasMassKilograms: number;
  readonly partialPressurePascal: number;
}

export interface MoonAtmospherePhysicalBalance32F1 {
  /** Conditional endmembers are *never* observed/independent atmospheres. */
  readonly sourceKind: 'INDEPENDENT_MASS_AND_FLUXES' | 'CONDITIONAL_FORMATION_ENDMEMBER';
  readonly sourceId: string;
  readonly regime: MoonAtmospherePhysicalRegime32F1;
  readonly durationSeconds: number;
  readonly initialGasMassKilograms: number;
  readonly remainingGasMassKilograms: number;
  /** Null when photochemistry leaves unidentified gas/condensed products. */
  readonly surfacePressurePascal: number | null;
  readonly gasResults: readonly MoonAtmosphereGasResult32F1[];
  readonly replenishedMassKilograms: number;
  readonly thermalEscapedMassKilograms: number;
  readonly particleEscapedMassKilograms: number;
  readonly photolysisEscapedMassKilograms: number;
  readonly photochemicalProductMassKilograms: number;
  readonly condensedMassKilograms: number;
  readonly surfaceKnudsenNumber: number | null;
  readonly interpretation: 'PHYSICAL_INTERVAL_MODEL_NOT_OBSERVATION' | 'CONDITIONAL_ENDMEMBER_NOT_ATMOSPHERIC_EVIDENCE';
}
