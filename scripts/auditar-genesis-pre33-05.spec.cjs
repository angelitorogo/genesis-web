'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const {validateEnergy}=require('./auditar-genesis-pre33-05.cjs');
function sample(){
 const physical={hostPlanetOrdinal:2,moonOrdinal:1,radiusEarth:.1};
 const formation={waterIceMassKilograms:1e20};
 const interior={waterMassKilograms:1e20};
 const ocean={waterInventoryKilograms:1e20,generatedRadiogenicFluxWattsPerSquareMeter:.005,
  pressureAtWaterShellBasePascal:1e9};
 const tidal={isTidallyLocked:true,sourceEccentricity:.012};
 const radius=.1*6371000,area=4*Math.PI*radius**2;
 const model={contractVersion:'PRE-33.05/V3-LUNAR-ENERGY-CONFINEMENT/v1',
  hostPlanetOrdinal:2,moonOrdinal:1,tidalRegime:'BOUNDED_SYNCHRONOUS_LOW_E',
  radiogenicFluxWattsPerSquareMeter:.005,confinementPressurePascal:1e9,
  pressureDomain:'BELOW_2_GPA',thermalConfinement:'ENERGY_SPANS_REFERENCE',
  tidalFluxMinimumWattsPerSquareMeter:.001,tidalFluxMaximumWattsPerSquareMeter:.05,
  tidalPowerMinimumWatts:.001*area,tidalPowerMaximumWatts:.05*area,
  totalFluxMinimumWattsPerSquareMeter:.006,totalFluxMaximumWattsPerSquareMeter:.055,
  totalFluxNominalWattsPerSquareMeter:.02,
  oceanConfirmed:false,independentThermalHistoryResolved:false,tidalResonanceSustained:false};
 const deep={contractVersion:'PRE-33.04/V3-LUNAR-SUBSURFACE-DOMAIN/v1',hostPlanetOrdinal:2,moonOrdinal:1,
  domain:'LEGACY_BELOW_2_GPA',waterMassKilograms:1e20,basalPressurePascal:1e9,
  shellThicknessKilometers:100,pressureProfile:[{pressurePascal:0},{pressurePascal:1e9}],
  thermalEvaluation:'THREE_CONDITIONAL_CASES',
  thermalScenarios:[
   {thermalCase:'LOW_TIDAL',heatFluxWattsPerSquareMeter:.006},
   {thermalCase:'NOMINAL_CT0',heatFluxWattsPerSquareMeter:.02},
   {thermalCase:'HIGH_TIDAL',heatFluxWattsPerSquareMeter:.055},
  ].map(x=>({...x,liquidMassKilograms:6e19,solidMassKilograms:4e19,iceCoverKilometers:15,
   liquidLayerKilometers:60,highPressureIceKilometers:25})),
  actualPhaseCertified:false,actualSalinityResolved:false,lunarHistoryWaterBudgetResolved:false,
  observationalOceanConfirmed:false};
 return {physical,formation,interior,ocean,tidal,model,deep};
}
const issues=x=>validateEnergy(x.physical,x.formation,x.interior,x.ocean,x.tidal,x.model,x.deep);
test('accepts traceable heat source without claiming ocean observation',()=>assert.deepEqual(issues(sample()),[]));
test('detects cross-moon identities',()=>{const f=sample();f.model.moonOrdinal=9;assert.ok(issues(f).includes('IDENTITY'));});
test('detects invented tidal heat on circular orbit',()=>{const f=sample();f.tidal.sourceEccentricity=0;assert.ok(issues(f).includes('CIRCULAR_HEAT'));});
test('detects power/area mismatch',()=>{const f=sample();f.model.tidalPowerMaximumWatts*=2;assert.ok(issues(f).includes('TIDAL_POWER_AREA'));});
test('detects radiogenic double counting',()=>{const f=sample();f.model.totalFluxMaximumWattsPerSquareMeter+=.005;assert.ok(issues(f).includes('HEAT_DOUBLE_COUNT'));});
test('detects unauthorized observed-ocean certification',()=>{const f=sample();f.model.oceanConfirmed=true;assert.ok(issues(f).includes('FALSE_CERTIFICATION'));});
test('detects radiogenic source substitution',()=>{const f=sample();f.model.radiogenicFluxWattsPerSquareMeter=.5;assert.ok(issues(f).includes('RADIOGENIC_ORIGIN'));});
test('detects wrong PRE-33.04 heat handoff',()=>{const f=sample();f.deep.thermalScenarios[2].heatFluxWattsPerSquareMeter=.08;assert.ok(issues(f).includes('DEEP_ENERGY_HANDOFF'));});
test('detects missing dry-moon confinement',()=>{const f=sample();f.formation.waterIceMassKilograms=0;f.model.pressureDomain='NO_H2O';assert.ok(issues(f).includes('DRY_MOON'));});
