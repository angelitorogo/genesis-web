/**
 * PRE-33.03a.1 — typed, INTERNAL model for H2O evolution. Source masses from
 * PRE-33.03a are conditional CT-0 carrier chemistry, NOT measured formation
 * masses. Back-projecting them to a starting inventory is a SCENARIO ONLY.
 * No quantity in this contract may enter observed knowledge or assert biology.
 */
export const PLANET_H2O_EVOLUTION_PRE3303A1 = 'PRE-33.03a.1/water-evolution/v1' as const;

export type H2OPoolPRE3303A1 =
  | 'ICE_UNLOCATED' | 'INTERIOR_UNSPECIFIED' | 'MINERAL_BOUND'
  | 'ATMOSPHERIC_VAPOR' | 'SURFACE_ICE' | 'SURFACE_LIQUID'
  | 'SUBSURFACE_LIQUID' | 'DEEP_ENVELOPE_UNRESOLVED';
export type H2OTransferPRE3303A1 = 'OUTGASS' | 'CONDENSE_ICE' | 'CONDENSE_LIQUID' |
  'FREEZE' | 'MELT' | 'SUBDUCT' | 'EXHUME' | 'HYDRATE' | 'DEHYDRATE' |
  'INTERIOR_TRANSPORT' | 'EXTERNAL_DELIVERY';

export interface H2ODatedTransferPRE3303A1 {
  readonly process: H2OTransferPRE3303A1;
  readonly from: H2OPoolPRE3303A1 | 'EXTERNAL';
  readonly to: H2OPoolPRE3303A1;
  /** Integrated mass from independent physical model/realized event, never a 20.7 index. */
  readonly massKilograms: number;
  readonly sourceRecordKey: string;
}
export interface H2OXuvEscapePRE3303A1 {
  /** Independently dated incident stellar XUV energy flux (not optical L/r²). */
  readonly incidentXuvWattsPerSquareMeter: number;
  /** Model parameter, bounded [0,1], with explicit provenance below. */
  readonly heatingEfficiency01: number;
  /** Radius where XUV is absorbed (planetary physical model, not a seed draw). */
  readonly absorptionRadiusMeters: number;
  /** Roche potential correction (0,1]. */
  readonly rocheFactor01: number;
  /** Explicit H2O mass fraction of escaped gas; NOT 20.3 mole fraction. */
  readonly escapingH2OMassFraction01: number;
  readonly sourceRecordKey: string;
}
export interface H2ODatedSegmentPRE3303A1 {
  readonly startYear: number;
  readonly endYear: number;
  readonly sourceRecordKey: string;
  /** Thermodynamic support for allocating a surface LIQUID or ICE mass. */
  readonly surfaceTemperatureKelvin: number | null;
  readonly surfacePressurePascal: number | null;
  readonly transfers: readonly H2ODatedTransferPRE3303A1[];
  readonly xuvEscape: H2OXuvEscapePRE3303A1 | null;
}
export interface H2ODatedHistoryPRE3303A1 {
  readonly bodyKey: string;
  readonly ageYearsCT0: number;
  /** Must refer to an independently modeled DATED H2O history, not point 20.3. */
  readonly provenance: 'DATED_PHYSICAL_H2O_MODEL';
  readonly sourceRecordKey: string;
  readonly segments: readonly H2ODatedSegmentPRE3303A1[];
  /** Optional bridge for identity/age check against materialized Fase 32 / 31.F.i.3. */
  readonly phase32Chronology?: Readonly<{bodyKey: string; ageYearsCT0: number}>;
  /** Optional 31.F.i.3 / Fase-32 materialized history. Its waterHistory is UNKNOWN:
   * dated optical irradiance NEVER supplies XUV or H2O mass loss by itself. */
  readonly materializedPhase32?: Readonly<{
    contractVersion: '31.F.i.3-v1';
    ageYearsCT0: number;
    planet: Readonly<{bodyKey: string; waterHistory: 'UNKNOWN'}>;
  }>;
}
export type H2OEvolutionStatePRE3303A1 =
  | 'UNRESOLVED_NO_DATED_H2O_FORCING'
  | 'CONDITIONAL_EVOLUTION_COMPLETED';
export interface H2OEvolutionResultPRE3303A1 {
  readonly contractVersion: typeof PLANET_H2O_EVOLUTION_PRE3303A1;
  readonly perspective: 'INTERNAL_SIMULATED_REALITY';
  readonly bodyKey: string;
  readonly epoch: 'CT0';
  readonly state: H2OEvolutionStatePRE3303A1;
  readonly formationHypothesis: 'CT0_CARRIER_CHEMISTRY_BACKPROJECTION_NOT_FORMATION_OBSERVATION';
  readonly sourceH2OKilograms: number;
  readonly datedHistorySource: string | null;
  readonly chronology: Readonly<{ageYearsCT0: number | null; coveredYears: number | null}>;
  readonly massBalance: Readonly<{
    inputH2OKilograms: number;
    externalDeliveryKilograms: number | null;
    escapedH2OKilograms: number | null;
    retainedCT0Kilograms: number | null;
    relativeResidual01: number | null;
    conditionalConservationVerified: boolean;
  }>;
  readonly reservoirs: Readonly<Record<H2OPoolPRE3303A1, number | null>>;
  readonly xuv: Readonly<{
    potentialEscapedH2OKilograms: number | null;
    supplyLimitedEscapedH2OKilograms: number | null;
  }>;
  readonly surfaceLiquidPhaseSupported: boolean | null;
  readonly observedEvidenceGranted: false;
  readonly ct0PhysicalInventoryCertified: false;
  readonly lifeEvaluated: false;
}

export const H2O_POOLS_PRE3303A1: readonly H2OPoolPRE3303A1[] = Object.freeze([
  'ICE_UNLOCATED', 'INTERIOR_UNSPECIFIED', 'MINERAL_BOUND', 'ATMOSPHERIC_VAPOR',
  'SURFACE_ICE', 'SURFACE_LIQUID', 'SUBSURFACE_LIQUID', 'DEEP_ENVELOPE_UNRESOLVED',
]);
export function validatePlanetH2OEvolutionPRE3303A1(r: H2OEvolutionResultPRE3303A1): readonly string[] {
  const bad: string[] = [];
  if (r.contractVersion !== PLANET_H2O_EVOLUTION_PRE3303A1 ||
      r.perspective !== 'INTERNAL_SIMULATED_REALITY' || r.epoch !== 'CT0' || !r.bodyKey ||
      r.formationHypothesis !== 'CT0_CARRIER_CHEMISTRY_BACKPROJECTION_NOT_FORMATION_OBSERVATION' ||
      r.observedEvidenceGranted !== false || r.ct0PhysicalInventoryCertified !== false || r.lifeEvaluated !== false)
    bad.push('PROVENANCE_OR_GROUND_TRUTH_LEAK');
  if (!Number.isFinite(r.sourceH2OKilograms) || r.sourceH2OKilograms < 0 ||
      r.massBalance.inputH2OKilograms !== r.sourceH2OKilograms) bad.push('INVALID_SOURCE');
  const m = r.massBalance;
  if (r.state === 'UNRESOLVED_NO_DATED_H2O_FORCING') {
    if (r.datedHistorySource !== null || r.chronology.coveredYears !== null ||
        m.conditionalConservationVerified || m.escapedH2OKilograms !== null ||
        m.retainedCT0Kilograms !== null || m.externalDeliveryKilograms !== null ||
        Object.values(r.reservoirs).some(v => v !== null) ||
        r.surfaceLiquidPhaseSupported !== null) bad.push('UNSUPPORTED_CT0_PROMOTION');
  } else if (r.state === 'CONDITIONAL_EVOLUTION_COMPLETED') {
    const fields = [m.externalDeliveryKilograms, m.escapedH2OKilograms, m.retainedCT0Kilograms,
      m.relativeResidual01, ...Object.values(r.reservoirs)];
    if (!r.datedHistorySource || !m.conditionalConservationVerified ||
        fields.some(v => v === null || !Number.isFinite(v) || v < 0) ||
        m.relativeResidual01! > 1e-9) bad.push('INVALID_CONDITIONAL_BALANCE');
    const retained = Object.values(r.reservoirs).reduce<number>((s,v) => s + (v ?? 0), 0);
    const available = m.inputH2OKilograms + (m.externalDeliveryKilograms ?? 0);
    const closed = retained + (m.escapedH2OKilograms ?? 0);
    if (Math.abs(available - closed) > 1e-9 * Math.max(1,available) ||
        Math.abs(retained - (m.retainedCT0Kilograms ?? 0)) > 1e-9*Math.max(1,retained))
      bad.push('WATER_MASS_NOT_CONSERVED');
  } else bad.push('INVALID_STATE');
  return Object.freeze(bad);
}
