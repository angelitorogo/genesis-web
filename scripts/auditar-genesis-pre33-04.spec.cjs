'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validate}=require('./auditar-genesis-pre33-04.cjs');
function fixture(){
 const physical={hostPlanetOrdinal:3,moonOrdinal:1};
 const formation={waterIceMassKilograms:1e20};
 const interior={waterMassKilograms:1e20};
 const ocean={waterInventoryKilograms:1e20};
 const result={contractVersion:'PRE-33.04/V3-LUNAR-SUBSURFACE-DOMAIN/v1',
  hostPlanetOrdinal:3,moonOrdinal:1,waterMassKilograms:1e20,basalPressurePascal:3e9,
  domain:'EXTENDED_2_TO_10_GPA',pressureProfile:[{pressurePascal:0},{pressurePascal:3e9}],
  shellThicknessKilometers:100,thermalEvaluation:'THREE_CONDITIONAL_CASES',actualPhaseCertified:false,actualSalinityResolved:false,
  lunarHistoryWaterBudgetResolved:false,observationalOceanConfirmed:false,
  thermalScenarios:[{iceCoverKilometers:15,liquidLayerKilometers:60,highPressureIceKilometers:25,
   liquidMassKilograms:6e19,solidMassKilograms:4e19}]};
 result.thermalScenarios=[
  {...result.thermalScenarios[0],thermalCase:'LOW_TIDAL'},
  {...result.thermalScenarios[0],thermalCase:'NOMINAL_CT0'},
  {...result.thermalScenarios[0],thermalCase:'HIGH_TIDAL'},
 ];
 return {physical,formation,interior,ocean,result};
}
const errors=f=>validate(f.physical,f.formation,f.interior,f.ocean,f.result);
test('accepts a modelled V3 lunar-pressure scenario but no observed water',()=>{
 assert.deepEqual(errors(fixture()),[]);
});
test('detects an invented H2O reservoir from different formation source',()=>{
 const f=fixture();f.formation.waterIceMassKilograms=2e20;
 assert.ok(errors(f).includes('WATER_ORIGIN'));
});
test('detects wrong lunar identity',()=>{
 const f=fixture();f.result.moonOrdinal=3;
 assert.ok(errors(f).includes('IDENTITY'));
});
test('detects fake certifying flags, including salinity and history',()=>{
 for(const key of ['actualPhaseCertified','actualSalinityResolved','lunarHistoryWaterBudgetResolved','observationalOceanConfirmed']) {
  const f=fixture();f.result[key]=true;
  assert.ok(errors(f).includes('FALSE_CERTIFICATION'));
 }
});
test('rejects pressure reversal and invalid extended domain',()=>{
 const f=fixture();f.result.pressureProfile[1].pressurePascal=-1;
 assert.ok(errors(f).includes('PRESSURE_PROFILE'));
 const other=fixture();other.result.basalPressurePascal=1e11;
 assert.ok(errors(other).includes('EXTENDED_PRESSURE_DOMAIN'));
});
test('rejects radial geometry greater than shell depth',()=>{
 const f=fixture();f.result.thermalScenarios[0].iceCoverKilometers=150;
 assert.ok(errors(f).includes('RADIAL_GEOMETRY'));
});
test('rejects invented liquid mass not conserved by formation H2O',()=>{
 const f=fixture();f.result.thermalScenarios[0].liquidMassKilograms*=2;
 assert.ok(errors(f).includes('PHASE_CONSERVATION'));
});
test('rejects a fabricated ocean for a dry lunar endmember',()=>{
 const f=fixture();f.result.waterMassKilograms=0;f.result.domain='NO_FORMATION_H2O';
 assert.ok(errors(f).includes('DRY_MOON'));
});
test('enforces no EOS extrapolation beyond 10 GPa',()=>{
 const f=fixture();f.result.domain='BEYOND_10_GPA_UNRESOLVED';
 assert.ok(errors(f).includes('EXTRAPOLATION'));
});
