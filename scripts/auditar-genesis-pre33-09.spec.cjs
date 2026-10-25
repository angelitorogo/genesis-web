'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),
 {fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const root='../src/app/';
const {HABITABILITY_REQUIREMENTS_31_1}=require(root+'domain/habitability/habitability-scenario.ts');
const {PlanetaryHistoryIntervalEngine32_12:History}=require(root+'simulation/planetary-history/planetary-history-interval-engine-32-12.ts');
const {HabitabilityHistoricalWindowsResolver31_7:Windows}=require(root+'simulation/habitability/habitability-historical-windows-resolver-31-7.ts');
const {EnvironmentalContinuityEnginePRE3309:Engine}=require(root+'simulation/planetary-history/environmental-continuity-engine-pre33-09.ts');
const {environmentalContinuityFieldsPRE3309:fields}=require(root+'presentation/scientific/environmental-continuity-fields-pre33-09.ts');
const ctx={bodyKind:'MOON',bodyKey:'G7/S1/O5/B2/M0',multiplicity:'TRIPLE',time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:1}};
const version={universeKey:'universe-v3',physicsModelRevision:'p32',sourceRevision:'e32'};
const episodes=[{episodeKey:'GRB-7',targetBodyKind:'MOON',targetBodyKey:ctx.bodyKey,
 kind:'RESOLVED_TRANSIENT_EFFECT',time:{timeScale:'YEARS_SINCE_SYSTEM_FORMATION',startYear:108,endYear:108,resolution:'MODELLED_INSTANT'},
 source:{sourcePhase:'29.7',sourceModel:'transient',sourceRecordKey:'physical-grb',evidenceKind:'RESOLVED_PHYSICAL_EVENT'},
 causedByEpisodeKeys:[]}];
const interval=(events=episodes,context=ctx)=>new History({revision:()=>version.sourceRevision,
 readInterval:(_c,from,to)=>events.filter(e=>e.time.startYear<=to&&e.time.endYear>=from),
 readByKey:(_c,k)=>events.find(e=>e.episodeKey===k)||null}).read({context,version,startYear:100,endYear:120});
const evidence=()=>['SURFACE_AQUEOUS','SUBSURFACE_AQUEOUS'].flatMap(route=>
 HABITABILITY_REQUIREMENTS_31_1[route].map(constraint=>({route,constraint,verdict:'SUPPORTS',basis:'PHYSICAL_MODEL',
 accessibleToObserver:true,sourceKey:`physical-${route}-${constraint}`})));
const state=(a,b)=>({bodyKind:ctx.bodyKind,bodyKey:ctx.bodyKey,startYear:a,endYear:b,
 temporalBasis:'DATED_PHYSICAL_TRAJECTORY',sourcePhase:'PRE33.09-physical-history',sourceModel:'dated-trajectory',
 sourceRecordKey:`validated-${a}-${b}`,accessibleToObserver:true,evidence:evidence()});
const report=(states=[state(100,120)],perspective='SIMULATED_REALITY',access=true)=>Windows.reconstruct({
 history:interval(),environmentSourceRevision:'environment-v1',perspective,
 observationAccess:{discoveryState:access?'CONFIRMED':'DETECTED',scientificFicheAccessible:access}},
 {revision:()=> 'environment-v1',readInterval:()=>states});
const surface=r=>r.routes.find(x=>x.route==='SURFACE_AQUEOUS');
const resolved={episodeKey:'GRB-7',outcome:'QUANTIFIED_DISRUPTION',affectedRoutes:['SURFACE_AQUEOUS'],
 physicalResponseSourceKey:'dose-spectrum-and-shield-response',physicalCriterion:'IONIZING_DOSE'};
test('sin episodios: duración 31.7/31.8 conservada; no supone catálogo completo',()=>{
 const x=Engine.reconstruct(report());assert.equal(surface(x).compatibleYearSlots,21);
 assert.equal(surface(x).longestContinuousYearSlots,21);assert.equal(x.eventCatalogCompleteness,'NOT_ESTABLISHED');
 assert.equal(x.lifePresence,'NOT_EVALUATED');
});
test('GRB sin efecto dosimétrico resuelto: 1 año UNKNOWN, no extinción',()=>{
 const x=Engine.reconstruct(report(),interval());const r=surface(x);
 assert.equal(r.compatibleYearSlots,20);assert.equal(r.unknownYearSlots,1);
 assert.equal(r.longestContinuousYearSlots,12);
 assert.equal(r.incompatibleYearSlots,0);assert.equal(r.coversEntireQueriedIntervalWithDocumentedCompatibility,false);
});
test('consecuencia cuantificada solo bloquea la ruta realmente afectada',()=>{
 const x=Engine.reconstruct(report(),interval(),[resolved]);
 assert.equal(surface(x).incompatibleYearSlots,1);assert.equal(surface(x).unknownYearSlots,0);
 const below=x.routes.find(r=>r.route==='SUBSURFACE_AQUEOUS');
 assert.equal(below.compatibleYearSlots,21);assert.equal(below.incompatibleYearSlots,0);
});
test('ausencia cuantificada de daño de un evento no inventa vida',()=>{
 const x=Engine.reconstruct(report(),interval(),[{...resolved,affectedRoutes:[],outcome:'QUANTIFIED_NON_DISRUPTIVE'}]);
 assert.equal(surface(x).compatibleYearSlots,21);assert.equal(x.biologicalContinuity,'NOT_EVALUATED');
});
test('un hueco de 1 año no se une para fabricar continuidad',()=>{
 const x=Engine.reconstruct(report([state(100,109),state(111,120)]));
 assert.equal(surface(x).compatibleYearSlots,20);assert.equal(surface(x).longestContinuousYearSlots,10);
 assert.equal(surface(x).unknownYearSlots,1);
});
test('no acepta episodios de otro mundo ni otra consulta temporal',()=>{
 assert.throws(()=>Engine.reconstruct(report(),interval([], {...ctx,bodyKey:'otro'})));
});
test('observación bloqueada jamás revela cuerpo ni episodios privados',()=>{
 const x=Engine.reconstruct(report([state(100,120)],'OBSERVED_KNOWLEDGE',false));
 assert.equal(x.bodyKey,null);assert.deepEqual(x.routes,[]);
 assert.throws(()=>Engine.reconstruct(report([state(100,120)],'OBSERVED_KNOWLEDGE',false),interval()));
});
test('no introduce episodios internos en una consulta observada abierta',()=>{
 assert.throws(()=>Engine.reconstruct(report([state(100,120)],'OBSERVED_KNOWLEDGE',true),interval()));
});
test('consecuencia falsa, incompleta o sin criterio físico no se autoriza',()=>{
 assert.throws(()=>Engine.reconstruct(report(),interval(),[{...resolved,physicalResponseSourceKey:null}]));
 assert.throws(()=>Engine.reconstruct(report(),interval(),[{...resolved,affectedRoutes:[]}]));
 assert.throws(()=>Engine.reconstruct(report(),interval(),[{...resolved,episodeKey:'NO-EXISTE'}]));
 assert.throws(()=>Engine.reconstruct(report(),interval(),[{...resolved,outcome:'UNTRUSTED'}]));
});
test('la ficha solo presenta compatibilidad ambiental, no biología',()=>{
 const text=JSON.stringify(fields(Engine.reconstruct(report(),interval())));
 assert.match(text,/PRE-33.09/);assert.doesNotMatch(text,/vida confirmada|extinción confirmada/);
 assert.equal(fields(null)[0].value,'No certificada');
});
test('mismo informe y eventos dan byte por byte el mismo resultado',()=>{
 const a=JSON.stringify(Engine.reconstruct(report(),interval(),[resolved]));
 const b=JSON.stringify(Engine.reconstruct(report(),interval(),[resolved]));assert.equal(a,b);
});
