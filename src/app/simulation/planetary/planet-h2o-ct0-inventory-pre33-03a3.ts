import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import {
  type PlanetH2OFormationContractPRE3303A,
  validatePlanetH2OFormationPRE3303A,
} from '../../domain/planetary/planet-h2o-formation-contract-pre33-03a';
import {
  H2O_POOLS_PRE3303A1, type H2OEvolutionResultPRE3303A1,
  type H2OPoolPRE3303A1, validatePlanetH2OEvolutionPRE3303A1,
} from '../../domain/planetary/planet-h2o-evolution-contract-pre33-03a1';
import {
  type PlanetDeepOceanEnvelopePRE3303B,
  validatePlanetDeepOceanEnvelopePRE3303B,
} from '../../domain/planetary/planet-deep-ocean-envelope-pre33-03b';
import {
  PLANET_H2O_CT0_PRE3303A3, type CT0H2OBlockerPRE3303A3,
  type PlanetH2OCT0InventoryPRE3303A3 as Result,
  validatePlanetH2OCT0InventoryPRE3303A3,
} from '../../domain/planetary/planet-h2o-ct0-inventory-pre33-03a3';
import { PlanetH2OFormationEnginePRE3303A } from './planet-h2o-formation-engine-pre33-03a';
import { PlanetDeepOceanEnvelopeEnginePRE3303B } from './planet-deep-ocean-envelope-pre33-03b';

const ME=5.9722e24;
const nullPools=()=>Object.freeze(Object.fromEntries(H2O_POOLS_PRE3303A1.map(k=>[k,null])) as
  Record<H2OPoolPRE3303A1,number|null>);
/**
 * READ-ONLY CT-0 reconciliation across 19.5 -> 33.03a -> 33.03a.1 -> 33.03b.
 * All magnitudes derived from 33.03a's backprojection MUST remain conditional;
 * even a dated energy-limited XUV model does not independently establish the
 * planet's primordial H2O or gas envelope speciation. Never call this a
 * certified ocean or use it to unlock discoveries/habitability.
 */
export class PlanetH2OCT0InventoryEnginePRE3303A3 {
  private constructor() {}
  static project(planet:Planet, atmosphere:Atmosphere,
    formation?:PlanetH2OFormationContractPRE3303A,
    evolution?:H2OEvolutionResultPRE3303A1,
    structure?:PlanetDeepOceanEnvelopePRE3303B): Result {
    if (atmosphere.hostPlanet!==planet) throw new RangeError('PRE-33.03a.3 FOREIGN_ATMOSPHERE');
    const f=formation??PlanetH2OFormationEnginePRE3303A.project(planet,atmosphere);
    if (validatePlanetH2OFormationPRE3303A(f).length) throw new RangeError('PRE-33.03a.3 INVALID_SPECIES_FORMATION');
    const k=f.bodyKey, l=planet.locator;
    if(k!==`G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`)
      throw new RangeError('PRE-33.03a.3 FOREIGN_FORMATION_IDENTITY');
    if(evolution && (evolution.bodyKey!==k || validatePlanetH2OEvolutionPRE3303A1(evolution).length))
      throw new RangeError('PRE-33.03a.3 FOREIGN_OR_INVALID_EVOLUTION');
    const s=structure??PlanetDeepOceanEnvelopeEnginePRE3303B.project(planet,atmosphere,f);
    if(s.bodyKey!==k || validatePlanetDeepOceanEnvelopePRE3303B(s).length)
      throw new RangeError('PRE-33.03a.3 FOREIGN_OR_INVALID_DEEP_ENVELOPE');
    const modeled=evolution?.state==='CONDITIONAL_EVOLUTION_COMPLETED';
    const pool=modeled?evolution!.reservoirs:null;
    const b:CT0H2OBlockerPRE3303A3[]=['FORMATION_SPECIES_IS_BACKPROJECTED_MATURE_19_5'];
    if (!modeled) b.push('NO_COMPLETE_DATED_H2O_HISTORY');
    // With 33.03a.1 XUV we know a modelled escape bound, NOT stellar
    // XUV measurements or the species composition of the escaping atmosphere.
    b.push('XUV_ESCAPE_IS_PARAMETERIZED_NOT_INDEPENDENT');
    b.push('EXTERNAL_DELIVERY_HISTORY_NOT_ESTABLISHED');
    b.push('HISTORICAL_PHASE_AND_CLIMATE_NOT_RECONSTRUCTED');
    b.push('GAS_ENVELOPE_H_HE_H2O_SPECIATION_UNRESOLVED');
    b.push('WATER_SHELL_EOS_OR_P_T_UNRESOLVED');
    if(s.candidateWaterShell.status==='UPDATED_BULK_REQUIRED' ||
      (modeled && ((evolution!.massBalance.externalDeliveryKilograms??0)!==0 ||
        (evolution!.massBalance.escapedH2OKilograms??0)!==0)))
      b.push('REVISED_BULK_AFTER_H2O_LOSS_OR_DELIVERY_REQUIRED');
    const gas=s.masses.gasEnvelopeKilograms;
    const retained=modeled?evolution!.massBalance.retainedCT0Kilograms!:null;
    // Non-gas current mass may be known, but its *partition* into H2O is not.
    const bulkOk=modeled?retained!==null &&
      retained<=planet.physicalProperties.massEarth*ME*(1+1e-9) &&
      !b.includes('REVISED_BULK_AFTER_H2O_LOSS_OR_DELIVERY_REQUIRED'):null;
    const gasOk=modeled?(pool!.ATMOSPHERIC_VAPOR??0)<=gas*(1+1e-9):null;
    const r:Result=Object.freeze({
      contractVersion:PLANET_H2O_CT0_PRE3303A3,
      perspective:'INTERNAL_SIMULATED_REALITY',bodyKey:k,epoch:'CT0',
      status:modeled?'MODELED_CT0_BALANCE_CONDITIONAL':'UNRESOLVED_NO_DATED_HISTORY',
      source:Object.freeze({formationContract:f.contractVersion,
        formationChemistry:'HYPOTHETICAL_ENDMEMBER_OF_MATURE_CARRIERS' as const,
        datedEvolutionSource:modeled?evolution!.datedHistorySource:null,
        deepEnvelopeSource:s.contractVersion, historyIsIndependent:false as const}),
      waterKilograms:Object.freeze({
        formationReference:f.formation.modeledFormationH2OKilograms,
        externalDelivery:modeled?evolution!.massBalance.externalDeliveryKilograms:null,
        escaped:modeled?evolution!.massBalance.escapedH2OKilograms:null,
        retainedCT0:retained,
        pools:pool?Object.freeze({...pool}):nullPools(),
        liquidTotal:pool?(pool.SURFACE_LIQUID!+pool.SUBSURFACE_LIQUID!):null,
        frozenTotal:pool?(pool.SURFACE_ICE!+pool.ICE_UNLOCATED!):null,
        atmosphericVapor:pool?pool.ATMOSPHERIC_VAPOR:null,
        deepUnresolved:pool?pool.DEEP_ENVELOPE_UNRESOLVED:null,
      }),
      conservation:Object.freeze({modeledSourceClosure:modeled,
        relativeResidual01:modeled?evolution!.massBalance.relativeResidual01:null,
        gasMassReconciled:gasOk,bulkMassReconciled:bulkOk}),
      blockers:Object.freeze(b),physicalCT0InventoryCertified:false as const,
      oceanExistenceCertified:false as const,playerObservationUpdated:false as const,
      lifeEvaluated:false as const,
    });
    const errors=validatePlanetH2OCT0InventoryPRE3303A3(r);
    if (errors.length) throw new RangeError('PRE-33.03a.3 '+errors.join(','));
    return r;
  }
}
