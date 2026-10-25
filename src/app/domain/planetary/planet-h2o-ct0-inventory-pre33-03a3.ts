/**
 * PRE-33.03a.3 — reconciled CT-0 H2O ledger. This is simulated reality, not
 * player observation. The older PRE-33.03a material-endmember speciation is
 * NOT an independent water inventory at planetary formation.
 *
 * A closed mathematical balance is NOT the same as a source-certified CT-0
 * inventory: the latter requires independently produced formation chemistry,
 * historical XUV/escape, dated deliveries and a compatible bulk/EOS solution.
 */
import {
  H2O_POOLS_PRE3303A1, type H2OPoolPRE3303A1,
} from './planet-h2o-evolution-contract-pre33-03a1';

export const PLANET_H2O_CT0_PRE3303A3 = 'PRE-33.03a.3/ct0-species-ledger/v1' as const;
export type CT0H2OStatusPRE3303A3 =
  | 'UNRESOLVED_NO_DATED_HISTORY'
  | 'MODELED_CT0_BALANCE_CONDITIONAL';
export type CT0H2OBlockerPRE3303A3 =
  | 'FORMATION_SPECIES_IS_BACKPROJECTED_MATURE_19_5'
  | 'NO_COMPLETE_DATED_H2O_HISTORY'
  | 'XUV_ESCAPE_IS_PARAMETERIZED_NOT_INDEPENDENT'
  | 'EXTERNAL_DELIVERY_HISTORY_NOT_ESTABLISHED'
  | 'HISTORICAL_PHASE_AND_CLIMATE_NOT_RECONSTRUCTED'
  | 'GAS_ENVELOPE_H_HE_H2O_SPECIATION_UNRESOLVED'
  | 'WATER_SHELL_EOS_OR_P_T_UNRESOLVED'
  | 'REVISED_BULK_AFTER_H2O_LOSS_OR_DELIVERY_REQUIRED';

export interface PlanetH2OCT0InventoryPRE3303A3 {
  readonly contractVersion: typeof PLANET_H2O_CT0_PRE3303A3;
  readonly perspective: 'INTERNAL_SIMULATED_REALITY';
  readonly bodyKey: string;
  readonly epoch: 'CT0';
  readonly status: CT0H2OStatusPRE3303A3;
  /** Exactly one body: never merge a private multihost source and its public identity. */
  readonly source: Readonly<{
    formationContract: 'PRE-33.03a/formation-endmembers/v1';
    formationChemistry: 'HYPOTHETICAL_ENDMEMBER_OF_MATURE_CARRIERS';
    datedEvolutionSource: string | null;
    deepEnvelopeSource: 'PRE-33.03b/deep-layers/v1';
    historyIsIndependent: false;
  }>;
  readonly waterKilograms: Readonly<{
    /** H2O species assigned conditionally to 19.5 solid/volatile carriers. */
    formationReference: number;
    /** Only available with a closed, dated history; otherwise null. */
    externalDelivery: number | null;
    escaped: number | null;
    retainedCT0: number | null;
    /** Current partition: conditional values only. */
    pools: Readonly<Record<H2OPoolPRE3303A1, number | null>>;
    liquidTotal: number | null;
    frozenTotal: number | null;
    /** NEVER substitute 20.3 gas mixture or 20.7 coverage for a vapor mass. */
    atmosphericVapor: number | null;
    deepUnresolved: number | null;
  }>;
  readonly conservation: Readonly<{
    modeledSourceClosure: boolean;
    relativeResidual01: number | null;
    gasMassReconciled: boolean | null;
    bulkMassReconciled: boolean | null;
  }>;
  readonly blockers: readonly CT0H2OBlockerPRE3303A3[];
  readonly physicalCT0InventoryCertified: false;
  readonly oceanExistenceCertified: false;
  readonly playerObservationUpdated: false;
  readonly lifeEvaluated: false;
}

const close = (a: number, b: number) =>
  Number.isFinite(a) && Number.isFinite(b) &&
  Math.abs(a-b) <= 1e-9*Math.max(1,Math.abs(a),Math.abs(b));
export function validatePlanetH2OCT0InventoryPRE3303A3(r: PlanetH2OCT0InventoryPRE3303A3): readonly string[] {
  const errors: string[]=[];
  if (r.contractVersion!==PLANET_H2O_CT0_PRE3303A3 || !r.bodyKey ||
      r.epoch!=='CT0' || r.perspective!=='INTERNAL_SIMULATED_REALITY' ||
      r.physicalCT0InventoryCertified!==false || r.oceanExistenceCertified!==false ||
      r.playerObservationUpdated!==false || r.lifeEvaluated!==false ||
      r.source.formationContract!=='PRE-33.03a/formation-endmembers/v1' ||
      r.source.formationChemistry!=='HYPOTHETICAL_ENDMEMBER_OF_MATURE_CARRIERS' ||
      r.source.deepEnvelopeSource!=='PRE-33.03b/deep-layers/v1' ||
      r.source.historyIsIndependent!==false ||
      !r.blockers.includes('FORMATION_SPECIES_IS_BACKPROJECTED_MATURE_19_5'))
    errors.push('UNSUPPORTED_GROUND_TRUTH_CERTIFICATION');
  const w=r.waterKilograms, c=r.conservation;
  if (!Number.isFinite(w.formationReference) || w.formationReference<0 ||
      r.blockers.length===0 || new Set(r.blockers).size!==r.blockers.length)
    errors.push('INVALID_FORMATION_OR_BLOCKERS');
  const pools=H2O_POOLS_PRE3303A1.map(k=>w.pools[k]);
  if (r.status==='UNRESOLVED_NO_DATED_HISTORY') {
    if (r.source.datedEvolutionSource!==null ||
        [w.externalDelivery,w.escaped,w.retainedCT0,w.liquidTotal,w.frozenTotal,
          w.atmosphericVapor,w.deepUnresolved,...pools,c.relativeResidual01,
          c.gasMassReconciled,c.bulkMassReconciled].some(v=>v!==null) ||
        c.modeledSourceClosure || !r.blockers.includes('NO_COMPLETE_DATED_H2O_HISTORY'))
      errors.push('UNRESOLVED_PROMOTED_TO_QUANTIFIED_CT0');
  } else if (r.status==='MODELED_CT0_BALANCE_CONDITIONAL') {
    const numbers=[w.externalDelivery,w.escaped,w.retainedCT0,w.liquidTotal,w.frozenTotal,
      w.atmosphericVapor,w.deepUnresolved,...pools,c.relativeResidual01];
    if (!r.source.datedEvolutionSource || !c.modeledSourceClosure ||
        numbers.some(v=>v===null || !Number.isFinite(v) || v<0) ||
        c.gasMassReconciled===null || c.bulkMassReconciled===null)
      errors.push('INVALID_CONDITIONAL_CT0_BALANCE');
    else {
      const pool = pools.reduce<number>((sum,v)=>sum+(v??0),0);
      if (!close(w.formationReference+w.externalDelivery!,pool+w.escaped!) ||
          !close(pool,w.retainedCT0!) ||
          !close(w.liquidTotal!,w.pools.SURFACE_LIQUID!+w.pools.SUBSURFACE_LIQUID!) ||
          !close(w.frozenTotal!,w.pools.SURFACE_ICE!+w.pools.ICE_UNLOCATED!) ||
          !close(w.atmosphericVapor!,w.pools.ATMOSPHERIC_VAPOR!) ||
          !close(w.deepUnresolved!,w.pools.DEEP_ENVELOPE_UNRESOLVED!) ||
          c.relativeResidual01!>1e-9)
        errors.push('CT0_SPECIES_MASS_BALANCE_FAILED');
    }
  } else errors.push('UNKNOWN_CT0_STATUS');
  return Object.freeze(errors);
}
