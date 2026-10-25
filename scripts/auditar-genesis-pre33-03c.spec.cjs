'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validateRecord,validateSharedDisk,validateCoEval}=require('./pre33/pre33-03c-integrity.cjs');
function fixture(){
 const planet={locator:{galaxyIndex:1n,sectorKey:2n,galacticObjectIndex:3n,bodyIndex:1n},
  physicalProperties:{massEarth:1},architectureSlot:{sourceFormationOrdinals:[1,2]}};
 const atmosphere={hostPlanet:planet};
 const origin={sourceId:'DISK/G1/S2/O3/B1',bodyIndex:1n,sourceFormationOrdinals:[1,2],
  formationWaterKilograms:1e22,lateDeliveryWaterBudgetKilograms:1e20,
  diskWaterBudgetKilograms:8e22,initialDiskDustKilograms:1e24,timeSinceFormationYears:1e9};
 const history={sourceId:'DISK/G1/S2/O3/B1/HISTORY',complete:true,ageYearsCT0:1e9,
  intervals:[{sourceId:'I0',fromYear:0,toYear:5e8,incidentXuvWattsPerSquareMeter:2},
    {sourceId:'I1',fromYear:5e8,toYear:1e9,incidentXuvWattsPerSquareMeter:1}],
  transfers:[{sourceId:'RESIDUAL_DISK_ACCRETION/E0',epochYears:0,from:'EXTERNAL',to:'ICE_OR_DEEP_UNSPECIFIED',kilograms:1e20,process:'DELIVERY'}]};
 const environment={sourceId:origin.sourceId,history};
 const pools={ICE_OR_DEEP_UNSPECIFIED:7.5e21,INTERIOR_WATER:2.5e21,
  MINERAL_BOUND:0,ATMOSPHERIC_VAPOR:0,SURFACE_ICE:0,SURFACE_LIQUID:0,SUBSURFACE_LIQUID:0};
 const forward={bodyKey:'G1/S2/O3/B1',status:'MODELED_CT0_RESERVOIRS',
  source:{historyId:history.sourceId,chemistry:'V3_FORMATION_DISK_ELEMENTAL_MODEL',
   waterSpeciesIndependentlyDetermined:false},
  v3ModelBalanceCertified:true,v3TimeEvolutionClosed:true,
  waterKilograms:{modeledFormation:1e22,modeledCT0:1.01e22,externalDelivery:1e20,escaped:0,pools},
  relativeMassResidual01:0,physicalCT0InventoryCertified:false,
  oceanExistenceCertified:false,observedEvidenceGranted:false,
  deepWater:{liquidLayerThicknessMeters:null,hasIndependentlySourcedThermalProfile:false}};
 // Use floating point sums exactly for consistency in strict relative test.
 pools.ICE_OR_DEEP_UNSPECIFIED=7.6e21;
 const deep={bodyKey:forward.bodyKey,epoch:'CT0_CONDITIONAL_STRUCTURE',
  masses:{planetTotalKilograms:5.9722e24,noDoubleCountingVerified:true},
  envelope:{kind:'19_5_GAS_CHEMISTRY_UNRESOLVED'},
  candidateWaterShell:{confirmedLiquidThicknessMeters:null,phaseBoundaryDepthMeters:null},
  currentH2OTotalCertified:false,oceanExistenceCertified:false,
  observedEvidenceGranted:false,habitabilityCertified:false,lifeEvaluated:false};
 return {planet,atmosphere,origin,environment,forward,deep};
}
const codes = p => validateRecord(p).map(x=>x.code);
test('accepts a native modeled CT0 budget without claiming ocean discovery',()=>{
 const f=fixture();assert.deepEqual(codes(f),[]);
});
test('rejects water forged after formation or sourced from a foreign planet',()=>{
 const f=fixture();f.forward.waterKilograms.modeledFormation=2e22;
 assert.ok(codes(f).includes('FORMATION_REPROJECTION'));
 const g=fixture();g.origin.bodyIndex=3n;
 assert.ok(codes(g).includes('FORMATION_IDENTITY'));
});
test('rejects missing history segments and repeated event identities',()=>{
 const f=fixture();f.environment.history.intervals[1].fromYear=6e8;
 assert.ok(codes(f).includes('CHRONOLOGY_GAP'));
 const g=fixture();g.environment.history.intervals[1].sourceId='I0';
 assert.ok(codes(g).includes('EVENT_IDENTITY'));
});
test('rejects unbudgeted external delivery or invented impacts',()=>{
 const f=fixture();f.origin.lateDeliveryWaterBudgetKilograms=1;
 assert.ok(codes(f).includes('UNSOURCED_DELIVERY'));
 const g=fixture();g.environment.history.transfers[0].sourceId='IMPACT_NOT_IN_SIM';
 assert.ok(codes(g).includes('UNSOURCED_DELIVERY'));
});
test('rejects creation of water and fake CT0 observation',()=>{
 const f=fixture();f.forward.waterKilograms.modeledCT0*=2;
 assert.ok(codes(f).includes('RESERVOIR_MASS'));
 const g=fixture();g.forward.oceanExistenceCertified=true;
 assert.ok(codes(g).includes('OBSERVATIONAL_PROMOTION'));
});
test('rejects radiogenic cooling prior mislabeled as independently sourced deep phase',()=>{
 const f=fixture();f.environment.waterShellThermalProvenance='CT0_CLIMATE_PLUS_RADIogenic_COOLING_MODEL';
 f.forward.deepWater.liquidLayerThicknessMeters=500;
 f.forward.deepWater.hasIndependentlySourcedThermalProfile=true;
 assert.ok(codes(f).includes('PRIOR_MISLABELED_INDEPENDENT'));
});
test('shared disk budget prevents unlimited formation + late deliveries',()=>{
 const f=fixture().origin,g={...f,sourceId:'DISK/G1/S2/O3/B2',bodyIndex:2n};
 assert.deepEqual(validateSharedDisk([f,g]).map(x=>x.code),[]);
 g.formationWaterKilograms=8e22;
 assert.ok(validateSharedDisk([f,g]).some(x=>x.code==='DISK_WATER_CREATION'));
});
test('multihost coeval chronology is a hard invariant, SINGLE is not checked',()=>{
 assert.deepEqual(validateCoEval([{lifetime:{ageBillionYears:3}},{lifetime:{ageBillionYears:3}}]),[]);
 assert.ok(validateCoEval([{lifetime:{ageBillionYears:3}},{lifetime:{ageBillionYears:5}}])
   .some(x=>x.code==='MULTIHOST_AGE'));
 assert.deepEqual(validateCoEval([{lifetime:{ageBillionYears:5}}]),[]);
});
