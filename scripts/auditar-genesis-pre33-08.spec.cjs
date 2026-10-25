'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),
 {fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {RadiationTransportEnginePRE3308:E}=require('../src/app/simulation/planetary/radiation-transport-engine-pre33-08.ts');
const {radiationFieldsPRE3308:fields}=require('../src/app/presentation/scientific/radiation-fields-pre33-08.ts');
const {unifyPlanetFicheSections:unify}=require('../src/app/presentation/planet-detail/planet-scientific-fiche-layout.ts');
const mono={state:'QUANTIFIED_SPECTRUM',sourceRecordKey:'LAB-0',spectralCoverageComplete:true,
 bands:[{energyMeV:1,energyFluxWattsPerSquareMeter:1,sourceRecordKey:'LAB-BAND'}]};
const absent={state:'INDEPENDENT_ABSENCE',sourceRecordKey:'LAB-ZERO',spectralCoverageComplete:true,bands:[]};
const source={epoch:'CT0',recordKey:'LAB-S',geometryRecordKey:'LAB-G',geometryTransmission01:1,
 photons:mono,particles:absent,durationSeconds:null,transientEventId:null};
const target={niche:'SUBSURFACE',targetRecordKey:'LAB-T',columnProfileComplete:true,
 responseRecordKey:'LAB-R',columnProfile:[{material:'H2O_ICE',kilogramsPerSquareMeter:1000,
 sourceRecordKey:'LAB-ICE',provenance:'CT0_CONSTITUTIVE'}],
 responses:[{channel:'PHOTON',energyMeV:1,grayPerJoulePerSquareMeter:1e-6,
 sourceRecordKey:'LAB-CAL',includesSecondaryAndScattered:true}]};
test('PRE33.08 dosimetría cuantificada',()=>assert(Math.abs(E.dose(source,target).doseGrayPerYear-31557600e-6)<1e-9));
test('sin espectro independiente no concede dosis',()=>assert.equal(E.dose(null,target).doseGrayPerYear,null));
test('canal de partículas UNKNOWN bloquea dosis',()=>assert.equal(E.dose({...source,particles:{...absent,state:'UNKNOWN',spectralCoverageComplete:false}},target).doseGrayPerYear,null));
test('falta columna bloquea dosis',()=>assert.equal(E.dose(source,{...target,columnProfileComplete:false}).doseGrayPerYear,null));
test('falta respuesta dosimétrica completa bloquea',()=>assert.equal(E.dose(source,{...target,responses:[]}).doseGrayPerYear,null));
test('transitorio no produce Gy/año',()=>assert.equal(E.dose({...source,epoch:'DATED_EVENT',transientEventId:'X',durationSeconds:1},target).doseGrayPerYear,null));
test('flujo negativo, duplicación de bandas rechazados',()=>assert.throws(()=>E.dose({...source,photons:{...mono,bands:[mono.bands[0],mono.bands[0]]}},target)));
test('doble ausencia probada permite exactamente 0 Gy',()=>assert.equal(E.dose({...source,photons:absent},target).doseGrayPerYear,0));
test('una presión no medida no crea columna',()=>assert.equal(E.world({bodyKind:'PLANET',hasSolidSurface:true,surfaceGravityEarth:1,atmosphericClosure:null}).atmosphereColumn,null));
test('no superficie en gigantes no crea exposición superficial',()=>assert.equal(E.world({bodyKind:'PLANET',hasSolidSurface:false,surfaceGravityEarth:1,atmosphericClosure:null}).surface.status,'NO_SURFACE_REFERENCE'));
test('ficha V3 ofrece matriz física sin Gy falso',()=>{
 const w=E.world({bodyKind:'MOON',hasSolidSurface:true,surfaceGravityEarth:0.1,atmosphericClosure:null});
 const values=fields(w);assert.equal(values.length,8);assert(values.some(x=>x.value==='No resuelta'));
});
test('V1/V2 no gana campos PRE33.08 en layout',()=>{
 const base={id:'surface',fields:[{label:'PRE-33.08 — Dosis ionizante superficial',value:'No resuelta',note:'fuente'}]};
 assert.equal(unify([base])[0].fields.filter(x=>x.label.startsWith('PRE-33.08')).length,1);
 assert.equal(unify([{...base,fields:[]}])[0].fields.filter(x=>x.label.startsWith('PRE-33.08')).length,0);
});
test('el mundo V3 puede consumir fuente y respuestas físicas sin inferirlas de bolométrica',()=>{
 const w=E.world({bodyKind:'PLANET',hasSolidSurface:true,surfaceGravityEarth:1,atmosphericClosure:null,
  forcing:source,targets:{SURFACE:{...target,niche:'SURFACE'}}});
 assert.equal(w.surface.status,'MODELLED_CT0_DOSE');
 assert(w.surface.doseGrayPerYear>0);assert.equal(w.observationallyConfirmed,false);
});
test('el modelo CT0 rechaza un pulso como dosis anual',()=>assert.throws(()=>E.world({
 bodyKind:'PLANET',hasSolidSurface:true,surfaceGravityEarth:1,atmosphericClosure:null,
 forcing:{...source,epoch:'DATED_EVENT',transientEventId:'TEST',durationSeconds:1}})));
