'use strict';
/** PRE-33.03c: external, read-only verification of the V3 planet-water chain.
 * All comparisons use actual generated inputs, not audit-specific seed branches.
 * A closed *modeled* CT-0 balance is not an observation of water or oceans. */
const { FORWARD_H2O_POOLS } = (()=>({FORWARD_H2O_POOLS:[
  'ICE_OR_DEEP_UNSPECIFIED','INTERIOR_WATER','MINERAL_BOUND','ATMOSPHERIC_VAPOR',
  'SURFACE_ICE','SURFACE_LIQUID','SUBSURFACE_LIQUID']}))();
const finiteNonNegative = x => typeof x === 'number' && Number.isFinite(x) && x >= 0;
const approximately = (a,b, tolerance=1e-8) => finiteNonNegative(a) && finiteNonNegative(b) &&
  Math.abs(a-b) <= tolerance*Math.max(1,a,b);
const unique = arr => new Set(arr).size===arr.length;
const issue=(list,code,detail)=>list.push({code,detail});

/** Independent invariants: do not call the production result validators here.
 * Test suite injects deliberate mutations to ensure failures cannot be hidden.
 */
function validateRecord({planet,atmosphere,origin,environment,forward,deep}) {
  const issues=[];
  if(!planet||!atmosphere||atmosphere.hostPlanet!==planet)
    return [{code:'ATMOSPHERE_IDENTITY',detail:'Atmosphere does not belong to planet'}];
  const l=planet.locator;
  const expectedKey=`G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`;
  const pMass=planet.physicalProperties?.massEarth*5.9722e24;
  const w=forward?.waterKilograms;
  if(!origin||origin.bodyIndex!==l.bodyIndex||
    origin.sourceFormationOrdinals?.join(',')!==planet.architectureSlot?.sourceFormationOrdinals?.join(',')||
    typeof origin.sourceId!=='string'||!origin.sourceId.endsWith(`/B${l.bodyIndex}`))
    issue(issues,'FORMATION_IDENTITY','Origin is missing, points to another body or uses a foreign anchor');
  if(!environment||!environment.history||environment.sourceId!==origin?.sourceId||
     environment.history.sourceId!==forward?.source?.historyId)
    issue(issues,'HISTORY_SOURCE','Dated CT-0 history not bound to formation origin');
  if(forward?.bodyKey!==expectedKey||deep?.bodyKey!==expectedKey)
    issue(issues,'BODY_IDENTITY','CT-0 and/or deep-layer result belongs to a different body');
  if(!finiteNonNegative(pMass)||pMass===0||!finiteNonNegative(origin?.formationWaterKilograms)||
    !finiteNonNegative(origin?.lateDeliveryWaterBudgetKilograms)||
    origin.formationWaterKilograms>pMass*(1+1e-8))
    issue(issues,'FORMATION_MASS','Formation water exceeds the body or is not finite');
  if(!approximately(w?.modeledFormation,origin?.formationWaterKilograms))
    issue(issues,'FORMATION_REPROJECTION','CT-0 formation H2O is not the Stage-17 origin record');
  if(forward?.status!=='MODELED_CT0_RESERVOIRS'||forward?.v3ModelBalanceCertified!==true||
    forward?.v3TimeEvolutionClosed!==true||!finiteNonNegative(w?.modeledCT0))
    issue(issues,'CT0_INCOMPLETE','No complete dated CT-0 model result');
  if(forward?.source?.chemistry!=='V3_FORMATION_DISK_ELEMENTAL_MODEL'||
    forward?.source?.waterSpeciesIndependentlyDetermined!==false)
    issue(issues,'CHEMISTRY_PROVENANCE','Formation must be from model 17.7, not post-19.5 nor measured');
  if(forward?.physicalCT0InventoryCertified!==false||forward?.oceanExistenceCertified!==false||
     forward?.observedEvidenceGranted!==false||deep?.currentH2OTotalCertified!==false||
     deep?.oceanExistenceCertified!==false||deep?.observedEvidenceGranted!==false||
     deep?.habitabilityCertified!==false||deep?.lifeEvaluated!==false)
    issue(issues,'OBSERVATIONAL_PROMOTION','Model may not grant observed or biological knowledge');
  const sum=FORWARD_H2O_POOLS.reduce((s,k)=>s+(w?.pools?.[k]??NaN),0);
  if(!FORWARD_H2O_POOLS.every(k=>finiteNonNegative(w?.pools?.[k]))||
     !approximately(sum,w?.modeledCT0)||
     !approximately(w?.modeledFormation+w?.externalDelivery,w?.modeledCT0+w?.escaped)||
     !finiteNonNegative(forward?.relativeMassResidual01)||forward.relativeMassResidual01>1e-9)
    issue(issues,'RESERVOIR_MASS','Water budget fails origin + delivery = retained + escaped = pools');
  if(!approximately(planet.physicalProperties.massEarth*5.9722e24,deep?.masses?.planetTotalKilograms)||
     deep?.masses?.noDoubleCountingVerified!==true||
     deep?.envelope?.kind!=='19_5_GAS_CHEMISTRY_UNRESOLVED')
    issue(issues,'DEEP_ENVELOPE_SEPARATION','Deep scenario conflates bulk mass or gas chemistry');
  // 03b is the original Stage-19.5 structure *scenario*, not the CT-0 shell.
  // It must never be interpreted as a second quantitative H2O inventory.
  if(deep?.epoch!=='CT0_CONDITIONAL_STRUCTURE'||
     deep?.candidateWaterShell?.confirmedLiquidThicknessMeters!==null||
     deep?.candidateWaterShell?.phaseBoundaryDepthMeters!==null)
    issue(issues,'DEEP_PHASE_PROMOTION','Hypothetical radial envelope promoted to confirmed ocean');
  if(forward?.deepWater?.liquidLayerThicknessMeters!==null &&
     forward?.deepWater?.hasIndependentlySourcedThermalProfile!==true)
    issue(issues,'UNSOURCED_DEEP_LIQUID','Liquid thickness shown without independent P-T source');
  if(environment?.waterShellThermalProvenance==='CT0_CLIMATE_PLUS_RADIogenic_COOLING_MODEL' &&
     (forward?.deepWater?.hasIndependentlySourcedThermalProfile===true||
      forward?.deepWater?.liquidLayerThicknessMeters!==null))
    issue(issues,'PRIOR_MISLABELED_INDEPENDENT','Parametric climate+cooling prior is not an independent deep P-T profile');
  const h=environment?.history;
  if(h){
    const xs=h.intervals||[],transfers=h.transfers||[];
    if(h.complete!==true||!Number.isSafeInteger(h.ageYearsCT0)||h.ageYearsCT0<=0||
       !xs.length||xs[0]?.fromYear!==0||xs.at(-1)?.toYear!==h.ageYearsCT0||
       xs.some((v,i)=>!Number.isSafeInteger(v.fromYear)||!Number.isSafeInteger(v.toYear)||
       v.toYear<=v.fromYear||i>0&&xs[i-1].toYear!==v.fromYear||
       !finiteNonNegative(v.incidentXuvWattsPerSquareMeter)))
      issue(issues,'CHRONOLOGY_GAP','XUV intervals do not continuously cover formation to CT-0');
    const sourceIds=[h.sourceId,...xs.map(x=>x.sourceId),...transfers.map(x=>x.sourceId)];
    if(!unique(sourceIds)||sourceIds.some(x=>typeof x!=='string'||!x.trim()))
      issue(issues,'EVENT_IDENTITY','A dated source has an empty or repeated identity');
    if(transfers.some(t=>!Number.isSafeInteger(t.epochYears)||t.epochYears<0||
       t.epochYears>=h.ageYearsCT0||!xs.some(x=>x.fromYear===t.epochYears)||
       !finiteNonNegative(t.kilograms)))
      issue(issues,'TRANSFER_TIME','Water transfer not on a valid source interval');
    const delivered=transfers.filter(t=>t.from==='EXTERNAL');
    const received=delivered.reduce((s,t)=>s+t.kilograms,0);
    if(delivered.some(t=>t.process!=='DELIVERY'||!t.sourceId.includes('RESIDUAL_DISK_ACCRETION'))||
       !approximately(received,w?.externalDelivery)||
       received>(origin?.lateDeliveryWaterBudgetKilograms??-1)*(1+1e-8)+1)
      issue(issues,'UNSOURCED_DELIVERY','A delivery is invented or exceeds the frozen disk budget');
    if(!approximately(h.ageYearsCT0,origin?.timeSinceFormationYears))
      issue(issues,'FORMATION_AGE','History age differs from V3 formation-completion age');
  }
  return issues;
}
function validateSharedDisk(origins) {
  const issues=[];
  if(!origins.length)return issues;
  const b=origins[0].diskWaterBudgetKilograms,solid=origins[0].initialDiskDustKilograms;
  if(!finiteNonNegative(b)||!finiteNonNegative(solid)||b>solid*(1+1e-8)||
      origins.some(x=>!approximately(x.diskWaterBudgetKilograms,b)||
                       !approximately(x.initialDiskDustKilograms,solid)))
    issue(issues,'DISK_IDENTITY','One planetary system cannot have multiple disk budgets');
  const assembled=origins.reduce((s,x)=>s+x.formationWaterKilograms+x.lateDeliveryWaterBudgetKilograms,0);
  if(!finiteNonNegative(assembled)||assembled>b*(1+1e-8)+1)
    issue(issues,'DISK_WATER_CREATION','Planet sources and all residual budgets exceed shared disk H2O');
  const ids=origins.map(x=>x.sourceId);
  if(!unique(ids))issue(issues,'DUPLICATE_FORMATION_SOURCE','Two planets share the same source');
  return issues;
}
function validateCoEval(components) {
  if(!components||components.length<2)return [];
  const ages=components.map(c=>c.lifetime?.ageBillionYears);
  return ages.every(t=>typeof t==='number'&&Number.isFinite(t)&&t>0&&
    Math.abs(t-ages[0])<=1e-9*Math.max(1,t,ages[0]))
    ?[]:[{code:'MULTIHOST_AGE',detail:'A/B/C component formation ages are inconsistent'}];
}
module.exports={validateRecord,validateSharedDisk,validateCoEval,approximately};
