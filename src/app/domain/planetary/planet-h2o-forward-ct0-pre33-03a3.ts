/**
 * PRE-33.03a.3 — independent forward chemical/dynamical WATER scenario.
 * A model with explicitly adopted protostellar abundances is not the same as an
 * observationally constrained chemical inventory or a certified ocean.
 */
export const H2O_FORWARD_CT0_PRE3303A3 = 'PRE-33.03a.3/forward-disk-chemistry-history/v1' as const;
export type H2OForwardState =
  | 'NO_FORMATION_ENVIRONMENT'
  | 'MODELED_FORMATION_NO_COMPLETE_HISTORY'
  | 'MODELED_CT0_RESERVOIRS';
export type H2OForwardPool = 'ICE_OR_DEEP_UNSPECIFIED' | 'INTERIOR_WATER' |
  'MINERAL_BOUND' | 'ATMOSPHERIC_VAPOR' | 'SURFACE_ICE' |
  'SURFACE_LIQUID' | 'SUBSURFACE_LIQUID';
export interface H2OForwardTimedTransfer {
  readonly sourceId: string;
  readonly epochYears: number;
  readonly from: H2OForwardPool | 'EXTERNAL';
  readonly to: H2OForwardPool;
  readonly kilograms: number;
  readonly process: 'DELIVERY' | 'OUTGASS' | 'CONDENSATION' | 'MELTING' |
    'SUBLIMATION' | 'SEQUESTRATION' | 'INTERNAL_TRANSFER';
}
export interface H2OForwardXuvInterval {
  readonly sourceId: string;
  readonly fromYear: number;
  readonly toYear: number;
  readonly incidentXuvWattsPerSquareMeter: number;
  readonly heatingEfficiency01: number;
  readonly escapingH2OMassFraction01: number;
  readonly rocheFactor01: number;
}
/** Caller-provided source: no XUV, impact or interior event may be inferred from a null list. */
export interface H2OForwardHistory {
  readonly sourceId: string;
  readonly ageYearsCT0: number;
  readonly intervals: readonly H2OForwardXuvInterval[];
  readonly transfers: readonly H2OForwardTimedTransfer[];
  readonly complete: true;
}
export interface H2OForwardEnvironment {
  /** Independent disk abundance record; absent values use clearly labeled solar prior. */
  readonly sourceId: string;
  readonly stellarLuminosityAtFormationSolar?: number;
  readonly metallicitySolarRatio: number;
  readonly carbonOxygenRatio?: number;
  /** PRE33 origin: derived at Stage-17/18 handoff, not a CT0 19.5 split. */
  readonly formationWaterKilogramsFromDisk?: number;
  readonly diskFormationTemperatureKelvin?: number;
  readonly originChemistryContract?: 'PRE-33.03a.3/V3-DISK-FORMATION-ORIGIN/v1';
  readonly history?: H2OForwardHistory;
  readonly initialInteriorWaterFraction01?: number;
  readonly waterShellThermalProvenance?: 'CT0_CLIMATE_PLUS_RADIogenic_COOLING_MODEL';
  readonly waterShellTopTemperatureKelvin?: number;
  readonly waterShellBaseTemperatureKelvin?: number;
}
export interface H2OForwardCT0Result {
  readonly contractVersion: typeof H2O_FORWARD_CT0_PRE3303A3;
  readonly bodyKey: string;
  readonly status: H2OForwardState;
  readonly source: Readonly<{
    diskId: string | null;
    historyId: string | null;
    chemistry: 'SOLAR_SCALED_ELEMENTAL_BUDGET_MODEL' | 'V3_FORMATION_DISK_ELEMENTAL_MODEL' | 'UNRESOLVED';
    waterSpeciesIndependentlyDetermined: false;
  }>;
  readonly chemistry: Readonly<{
    assemblyRadiusAu: number | null;
    diskTemperatureKelvin: number | null;
    waterIceCondensationFraction01: number | null;
    oxygenAfterCOAndSilicatesMolesPerHydrogen: number | null;
    carbonOxygenRatio: number | null;
  }>;
  readonly waterKilograms: Readonly<{
    modeledFormation: number | null;
    modeledCT0: number | null;
    externalDelivery: number | null;
    escaped: number | null;
    pools: Readonly<Record<H2OForwardPool, number | null>>;
  }>;
  readonly deepWater: Readonly<{
    modeledShellKilograms: number | null;
    shellThicknessMeters: number | null;
    basePressurePascal: number | null;
    highPressureIceDomainPossible: boolean | null;
    liquidLayerThicknessMeters: number | null;
    hasIndependentlySourcedThermalProfile: boolean;
  }>;
  /** Every required interval within the declared V3 physics is evaluated. */
  readonly v3TimeEvolutionClosed?: boolean;
  /** Model certification does not imply observational H2O abundance. */
  readonly v3ModelBalanceCertified?: boolean;
  readonly relativeMassResidual01: number | null;
  readonly unresolved: readonly string[];
  readonly physicalCT0InventoryCertified: false;
  readonly oceanExistenceCertified: false;
  readonly observedEvidenceGranted: false;
}
export const FORWARD_H2O_POOLS: readonly H2OForwardPool[] = Object.freeze([
  'ICE_OR_DEEP_UNSPECIFIED','INTERIOR_WATER','MINERAL_BOUND','ATMOSPHERIC_VAPOR',
  'SURFACE_ICE','SURFACE_LIQUID','SUBSURFACE_LIQUID',
]);
export function validateH2OForwardCT0Result(x: H2OForwardCT0Result): string[] {
  const errors: string[] = [];
  if(x.contractVersion!==H2O_FORWARD_CT0_PRE3303A3 || !x.bodyKey ||
    x.physicalCT0InventoryCertified!==false || x.oceanExistenceCertified!==false ||
    x.observedEvidenceGranted!==false || x.source.waterSpeciesIndependentlyDetermined!==false)
    errors.push('UNSUPPORTED_CERTIFICATION_OR_IDENTITY');
  const w=x.waterKilograms;
  if(x.status==='MODELED_CT0_RESERVOIRS') {
    if([w.modeledFormation,w.modeledCT0,w.externalDelivery,w.escaped,x.relativeMassResidual01,
      ...FORWARD_H2O_POOLS.map(k=>w.pools[k])].some(v=>v===null||!Number.isFinite(v)||v<0))
      errors.push('INCOMPLETE_MODELED_BALANCE');
    else {
      const total=FORWARD_H2O_POOLS.reduce((s,k)=>s+(w.pools[k]??0),0);
      const tolerance=1e-8*Math.max(1,w.modeledFormation!,w.externalDelivery!);
      if(Math.abs(total-w.modeledCT0!)>tolerance ||
        Math.abs(w.modeledFormation!+w.externalDelivery!-w.escaped!-total)>tolerance ||
        x.relativeMassResidual01!>1e-8) errors.push('WATER_NOT_CONSERVED');
    }
  }else if (w.modeledCT0!==null || w.externalDelivery!==null || w.escaped!==null ||
    FORWARD_H2O_POOLS.some(k=>w.pools[k]!==null)) errors.push('UNKNOWN_CT0_PROMOTED');
  if(x.deepWater.liquidLayerThicknessMeters!==null &&
    !x.deepWater.hasIndependentlySourcedThermalProfile) errors.push('UNSOURCED_LIQUID_LAYER');
  if(x.v3ModelBalanceCertified===true && (
    x.status!=='MODELED_CT0_RESERVOIRS' || !x.v3TimeEvolutionClosed ||
    x.relativeMassResidual01===null || x.relativeMassResidual01>1e-9 ||
    x.source.chemistry!=='V3_FORMATION_DISK_ELEMENTAL_MODEL'))
    errors.push('UNSUPPORTED_V3_MODEL_CERTIFICATION');
  if(x.unresolved.length!==new Set(x.unresolved).size) errors.push('DUPLICATE_UNRESOLVED');
  return errors;
}
