/**
 * PRE-33.01 — Contrato INTERNO y de solo lectura de condiciones físico-ambientales.
 * No es una ficha observada, probabilidad de vida, ni entrada automática de abiogénesis.
 * CT-0 es una instantánea; su extrapolación histórica está expresamente prohibida.
 */
export const ENVIRONMENTAL_CONTRACT_PRE33_01 = 'PRE-33.01/CT0/v1' as const;

export type EnvironmentalEvidenceSourcePRE3301 =
  | 'BULK_19_21'
  | 'CLIMATE_20'
  | 'ATMOSPHERE_20_3'
  | 'ATMOSPHERE_V3_FORMATION_CT0'
  | 'WATER_20_7'
  | 'LUNAR_ENVIRONMENT_21_5'
  | 'LUNAR_ATMOSPHERE_32_F_1'
  | 'LUNAR_ATMOSPHERE_SCENARIO_21_5'
  | 'LUNAR_OCEAN_32_F_2C'
  | 'LUNAR_RADIATION_32_F_3'
  | 'LUNAR_GEOCHEMISTRY_32_F_4'
  | 'GEOCHEMISTRY_PRE33_07'
  | 'RADIATION_PRE33_08'
  | 'NO_DATED_PHYSICAL_SOURCE'
  | 'NOT_MATERIALIZED'
  | 'NO_QUANTIFIED_SOURCE';

export type EnvironmentalEvidencePRE3301<T extends number | string> = Readonly<
  | {
    state: 'MODELLED_CT0'; value: T; source: EnvironmentalEvidenceSourcePRE3301;
    basis: 'BULK_PHYSICAL' | 'CT0_CONSTITUTIVE' | 'INDEPENDENT_INTERVAL_MODEL';
    note: string;
  }
  | {
    state: 'CONDITIONAL_SCENARIO'; value: T; source: EnvironmentalEvidenceSourcePRE3301;
    basis: 'LEGACY_ESTIMATE' | 'HYPOTHETICAL_COLUMN' | 'THERMAL_REFERENCE';
    note: string;
  }
  | {
    state: 'UNRESOLVED'; value: null; source: EnvironmentalEvidenceSourcePRE3301;
    reason: string;
  }
  | {
    state: 'NOT_APPLICABLE'; value: null; source: EnvironmentalEvidenceSourcePRE3301;
    reason: string;
  }
>;

export interface EnvironmentalPhysicalContractPRE3301 {
  readonly contractVersion: typeof ENVIRONMENTAL_CONTRACT_PRE33_01;
  /** Ground Truth ONLY; never serialize directly to Archive / IndexedDB / observed fiches. */
  readonly perspective: 'INTERNAL_SIMULATED_REALITY';
  readonly epoch: 'CT0';
  readonly bodyKind: 'PLANET' | 'MOON';
  readonly bodyKey: string;
  readonly hostPlanetKey: string | null;
  readonly materialization: 'PHYSICALLY_MATERIALIZED' | 'IDENTITY_ONLY';
  readonly bulk: Readonly<{
    massEarth: EnvironmentalEvidencePRE3301<number>;
    radiusEarth: EnvironmentalEvidencePRE3301<number>;
    gravityMetersPerSecondSquared: EnvironmentalEvidencePRE3301<number>;
  }>;
  readonly thermal: Readonly<{
    referenceEquilibriumKelvin: EnvironmentalEvidencePRE3301<number>;
    surfaceTemperatureKelvin: EnvironmentalEvidencePRE3301<number>;
  }>;
  readonly atmosphere: Readonly<{
    /** 20.3 retained column (NOT the 20.7 water effective column). */
    retainedSurfacePressurePascal: EnvironmentalEvidencePRE3301<number>;
    /** 20.7 effective pressure, independent semantics, NEVER fused with 20.3. */
    waterAssessmentPressurePascal: EnvironmentalEvidencePRE3301<number>;
    /** Independently forced 32.F.1 balance only; NOT a measurement. */
    physicallySupportedSurfacePressurePascal: EnvironmentalEvidencePRE3301<number>;
    columnRelation: 'ALIGNED' | 'DIVERGENT' | 'NOT_COMPARABLE';
  }>;
  readonly water: Readonly<{
    /** Phase 20.7 surface coverage is an estimate, not confirmed liquid water. */
    surfaceLiquidCoverage01: EnvironmentalEvidencePRE3301<number>;
    /** 32.F.2c CT-0 world state, NOT a V1 ocean potential. */
    subsurfaceOceanState: EnvironmentalEvidencePRE3301<'PRESENT' | 'ABSENT'>;
    liquidOceanMassKilograms: EnvironmentalEvidencePRE3301<number>;
  }>;
  readonly energy: Readonly<{
    /** Heat is NOT chemically extractable power. */
    interiorHeatFluxWattsPerSquareMeter: EnvironmentalEvidencePRE3301<number>;
    extractableChemicalPowerWatts: EnvironmentalEvidencePRE3301<number>;
    chemicalDisequilibriumJoulesPerMole: EnvironmentalEvidencePRE3301<number>;
    /** PRE-33.07b mineral kinetics endmember; conditional only, never energy evidence. */
    chemicalPowerUpperScenarioWatts?: EnvironmentalEvidencePRE3301<number>;
  }>;
  readonly radiation: Readonly<{
    /** Total bolometric flux is NOT ionizing flux or radiation dose. */
    bolometricFluxWattsPerSquareMeter: EnvironmentalEvidencePRE3301<number>;
    surfaceIonizingDoseGrayPerYear: EnvironmentalEvidencePRE3301<number>;
    subsurfaceIonizingDoseGrayPerYear: EnvironmentalEvidencePRE3301<number>;
  }>;
  readonly history: Readonly<{
    continuousCompatibleYears: EnvironmentalEvidencePRE3301<number>;
  }>;
  /** Must remain false for PRE-33, regardless of indices or favorable physics. */
  readonly lifeEvaluated: false;
}

export function environmentalModelledPRE3301<T extends number | string>(
  value: T, source: EnvironmentalEvidenceSourcePRE3301,
  basis: 'BULK_PHYSICAL' | 'CT0_CONSTITUTIVE' | 'INDEPENDENT_INTERVAL_MODEL', note: string,
): EnvironmentalEvidencePRE3301<T> {
  validValue(value); nonempty(note);
  return Object.freeze({state: 'MODELLED_CT0' as const, value, source, basis, note});
}

export function environmentalConditionalPRE3301<T extends number | string>(
  value: T, source: EnvironmentalEvidenceSourcePRE3301,
  basis: 'LEGACY_ESTIMATE' | 'HYPOTHETICAL_COLUMN' | 'THERMAL_REFERENCE', note: string,
): EnvironmentalEvidencePRE3301<T> {
  validValue(value); nonempty(note);
  return Object.freeze({state: 'CONDITIONAL_SCENARIO' as const, value, source, basis, note});
}

export function environmentalUnknownPRE3301<T extends number | string>(
  reason: string, source: EnvironmentalEvidenceSourcePRE3301 = 'NO_QUANTIFIED_SOURCE',
): EnvironmentalEvidencePRE3301<T> {
  nonempty(reason);
  return Object.freeze({state: 'UNRESOLVED' as const, value: null, source, reason});
}

export function environmentalNotApplicablePRE3301<T extends number | string>(
  reason: string, source: EnvironmentalEvidenceSourcePRE3301 = 'NO_QUANTIFIED_SOURCE',
): EnvironmentalEvidencePRE3301<T> {
  nonempty(reason);
  return Object.freeze({state: 'NOT_APPLICABLE' as const, value: null, source, reason});
}

/** Conservative guard for consumers: a conditional quantity is never physical proof. */
export function environmentalIsPhysicalPRE3301<T extends number | string>(
  evidence: EnvironmentalEvidencePRE3301<T>,
): evidence is Extract<EnvironmentalEvidencePRE3301<T>, { state: 'MODELLED_CT0' }> {
  return evidence.state === 'MODELLED_CT0';
}

/** Checks schema invariants; never interprets results as life or discovery. */
export function validateEnvironmentalContractPRE3301(
  contract: EnvironmentalPhysicalContractPRE3301,
): readonly string[] {
  const errors: string[] = [];
  if (contract.contractVersion !== ENVIRONMENTAL_CONTRACT_PRE33_01 ||
      contract.perspective !== 'INTERNAL_SIMULATED_REALITY' || contract.epoch !== 'CT0' ||
      contract.lifeEvaluated !== false || !contract.bodyKey) errors.push('INVALID_INTERNAL_IDENTITY');
  if (contract.bodyKind === 'PLANET' && contract.hostPlanetKey !== null ||
      contract.bodyKind === 'MOON' && !contract.hostPlanetKey) errors.push('INVALID_HOST_IDENTITY');
  const values = [
    ...Object.values(contract.bulk), ...Object.values(contract.thermal),
    contract.atmosphere.retainedSurfacePressurePascal, contract.atmosphere.waterAssessmentPressurePascal,
    contract.atmosphere.physicallySupportedSurfacePressurePascal,
    ...Object.values(contract.water), ...Object.values(contract.energy),
    ...Object.values(contract.radiation), ...Object.values(contract.history),
  ];
  for (const e of values) {
    if (e.state === 'MODELLED_CT0' || e.state === 'CONDITIONAL_SCENARIO') {
      if (typeof e.value === 'number' && !Number.isFinite(e.value) ||
          typeof e.value === 'string' && !e.value.length || !e.note.trim()) errors.push('INVALID_EVIDENCE_VALUE');
    } else if (e.value !== null || !e.reason.trim()) errors.push('INVALID_UNRESOLVED_VALUE');
  }
  if (contract.materialization === 'IDENTITY_ONLY' && values.some(e =>
    e.state === 'MODELLED_CT0' || e.state === 'CONDITIONAL_SCENARIO')) errors.push('IDENTITY_ONLY_WITH_PHYSICS');
  if (contract.atmosphere.columnRelation === 'ALIGNED' || contract.atmosphere.columnRelation === 'DIVERGENT') {
    const a = contract.atmosphere.retainedSurfacePressurePascal;
    const b = contract.atmosphere.waterAssessmentPressurePascal;
    if (a.value === null || b.value === null) errors.push('PRESSURE_RELATION_MISSING_VALUES');
  }
  // Hard boundaries against accidental use of heat/irradiance as chemistry/dose.
  if (contract.energy.extractableChemicalPowerWatts.source === 'LUNAR_OCEAN_32_F_2C' ||
      contract.energy.extractableChemicalPowerWatts.source === 'LUNAR_GEOCHEMISTRY_32_F_4' &&
        contract.energy.extractableChemicalPowerWatts.state === 'CONDITIONAL_SCENARIO')
    errors.push('HEAT_OR_HYPOTHESIS_AS_CHEMICAL_POWER');
  for (const d of [contract.radiation.surfaceIonizingDoseGrayPerYear,
      contract.radiation.subsurfaceIonizingDoseGrayPerYear]) {
    if (d.state === 'MODELLED_CT0' && (d.source !== 'RADIATION_PRE33_08' ||
      d.value === null || d.value < 0)) errors.push('UNSOURCED_IONIZING_DOSE');
    if (d.source === 'LUNAR_RADIATION_32_F_3' && d.state !== 'UNRESOLVED')
      errors.push('REFERENCE_PHOTONS_AS_ACTUAL_DOSE');
  }
  return Object.freeze(errors);
}

function validValue(value: number | string): void {
  if (typeof value === 'number' ? !Number.isFinite(value) : !value.trim())
    throw new RangeError('PRE-33.01 requires a finite number or non-empty string.');
}
function nonempty(value: string): void {
  if (!value.trim()) throw new RangeError('PRE-33.01 requires explicit source/limitation text.');
}
