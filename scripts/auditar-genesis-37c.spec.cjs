'use strict';
/** Fase 37.C: contrato de ejecución real del Worker 37.B, sin simular VIDA en producción.
 * Se cargan las funciones del Worker verdadero en una VM con dependencias controladas:
 * se comprueban sus salidas, su secreto observacional y su aislamiento de escrituras.
 * Los tests de integración del motor real VIDA.7 siguen en sus suites nativas.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const base=path.resolve(__dirname,'../src/app');
const read=(pathFromApp)=>fs.readFileSync(path.join(base,pathFromApp),'utf8');
const workerFile='presentation/galaxy-map/regional-technosignature-37b.worker.ts';
const scannerFile='presentation/galaxy-map/regional-technosignature-37b.scanner.ts';
const mapFile='presentation/galaxy-map/galaxy-map.ts';
const sceneFile='presentation/galaxy-map/galactic-map-scene.ts';
const profileFile='domain/life/technosignatures-37a.ts';
const worker=read(workerFile),scanner=read(scannerFile),map=read(mapFile),scene=read(sceneFile),profile=read(profileFile);

/** Load the 37.B regional-domain module with transpilation (no Angular needed). */
const domainSource=read('presentation/galaxy-map/regional-technosignature-37b.ts');
function transpile(source,file){return ts.transpileModule(source,{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;}
function moduleFrom(source, name, requireMock){
  const mod={exports:{}};
  const context={module:mod,exports:mod.exports,require:requireMock,BigInt,console};
  vm.runInNewContext(transpile(source,name),context,{filename:name,timeout:3000});
  return mod.exports;
}
class Coordinates{constructor(x,y){this.x=x;this.y=y;}}
const regional=moduleFrom(domainSource,'regional-technosignature-37b.ts',id=>{
  if(id.includes('galaxy-sector-coordinates'))return {GalaxySectorCoordinates:Coordinates};
  throw Error('Dependencia inesperada del contrato regional: '+id);
});
function makeGrid(halfExtent=1){return {minCoordinate:-halfExtent,maxCoordinate:halfExtent,halfExtentInSectors:halfExtent,
  contains(p){return p.x>=-halfExtent&&p.x<=halfExtent&&p.y>=-halfExtent&&p.y<=halfExtent;}};}
function loadWorkerScenario({tier='VERY_ADVANCED',physical=true,failAt=null}={}){
  const emitted=[];const calls={sectors:0,planets:0,microbial:0,civilizations:0};
  const data={tag:'TOP_SECRET_ORIGIN_PLANET_99',founderSpeciesId:'TOP_SECRET_SPECIES'};
  const system={galaxyIndex:8n,sectorKey:123n,galacticObjectIndex:2n};
  const dependencies={
    'universe-seed':{UniverseSeed:{parse:v=>({value:v})}},
    'universe-generation-key':{UniverseGenerationKey:class{constructor(seed,version){this.seed=seed;this.version=version;}}},
    'generator-version':{GeneratorVersion:{V3:{code:3}}},
    'galaxy-sector-coordinates':{GalaxySectorCoordinates:Coordinates},
    'procedural-locator':{BodyLocator:class{constructor(_g,_s,_o,bodyIndex){this.bodyIndex=bodyIndex;}}},
    'galaxy-generator':{GalaxyGenerator:{generate:(_key,index)=>({index})}},
    'galaxy-sector-grid-generator':{GalaxySectorGridGenerator:{generate:()=>makeGrid()}},
    'galaxy-sector-content-generator':{GalaxySectorContentGenerator:{generate:(_g,cell)=>{
      calls.sectors++;
      if(failAt==='sector' && cell.x===0&&cell.y===0)throw Error('sector no evaluable');
      return {systemLocators:cell.x===0&&cell.y===0?[system]:[]};
    }}},
    'vida9-v3-confirmed-physical-targets':{vida9V3ConfirmedPhysicalTargets:()=>{
      if(failAt==='system')throw Error('sistema no evaluable');
      return {planetCount:failAt==='firstPlanet'?2:1,resolvePlanet:body=>{calls.planets++;if(failAt==='planet' || (failAt==='firstPlanet'&&body.bodyIndex===0n))throw Error('planeta no evaluable');return physical?data:null;}};
    }},
    'life-plausibility-physical-adapter-vida2':{Vida2PhysicalInput:{planet:v=>v}},
    'procedural-microbial-life-vida3':{ProceduralMicrobialLifeVIDA3:{evaluate:()=>{calls.microbial++;return data;}}},
    'procedural-ecology-vida4':{ProceduralEcologyVIDA4:{evaluate:()=>data}},
    'vida5a-ecology-atmosphere':{Vida5aEcologyAtmosphere:{evaluate:()=>data}},
    'vida5b-ecological-maturation':{Vida5bEcologicalMaturation:{evaluate:()=>data}},
    'vida5c-advanced-biospheres':{Vida5cAdvancedBiospheres:{evaluate:()=>data}},
    'vida6-ecosystems-species':{Vida6EcosystemsSpecies:{evaluate:()=>data}},
    'vida7-intelligence-civilizations':{Vida7IntelligenceCivilizations:{evaluate:()=>{
      calls.civilizations++;
      if(failAt==='civilization')throw Error('VIDA7 no evaluable');
      return {civilizationPresent:tier!==null,civilization:tier!==null?{tier,origin:data}:null};
    }}},
    'regional-technosignature-37b':regional,
  };
  const mockRequire=(id)=>{
    for(const [piece,value] of Object.entries(dependencies))if(id.endsWith('/'+piece)||id.endsWith('/'+piece+'.ts')||id.endsWith(piece))return value;
    throw Error('Dependencia no prevista en Worker: '+id);
  };
  const scope={postMessage:value=>emitted.push(value)};
  const mod={exports:{}};
  vm.runInNewContext(transpile(worker,workerFile),{globalThis:scope,module:mod,exports:mod.exports,
    require:mockRequire,BigInt,console},{filename:workerFile,timeout:3000});
  assert.equal(typeof scope.onmessage,'function');
  const run=(overrides={})=>{
    scope.onmessage({data:{seed:'SEED_SIMULADA',version:3,galaxyIndex:'8',centerX:0,centerY:0,...overrides}});
    return emitted.at(-1);
  };
  return {run,emitted,calls};
}

// --- Execution, not inspection-only tests. ---
test('37.C/01: el Worker real responde solo DETECTED ante VIDA.7 VERY_ADVANCED',()=>{
  const run=loadWorkerScenario();
  assert.deepEqual({...run.run()},{kind:'complete',status:'DETECTED'});
  assert.equal(run.calls.civilizations,1);
  assert.equal(run.calls.planets,1);
  assert.equal(run.calls.sectors,5); // x,y iteration stops at central cell in 3×3
});
test('37.C/02: primitivas, avanzadas y ausencia de vida NO producen anomalías regionales',()=>{
  for(const tier of ['PRIMITIVE','ADVANCED',null]){
    const run=loadWorkerScenario({tier});
    assert.equal(run.run().status,'NO_SIGNAL',String(tier));
  }
});
test('37.C/03: no evaluable no se convierte en ausencia confirmada ni impide otras zonas',()=>{
  for(const failAt of ['sector','system','planet','civilization']){
    const run=loadWorkerScenario({failAt});
    assert.equal(run.run().status,'INCOMPLETE',failAt);
  }
});
test('37.C/03b: un planeta fallido no suprime la señal positiva de otro planeta',()=>{
  const run=loadWorkerScenario({failAt:'firstPlanet'});
  assert.equal(run.run().status,'DETECTED');
  assert.equal(run.calls.planets,2);
});
test('37.C/04: ningún mensaje del Worker revela planeta, especie, sistema o recuentos',()=>{
  for(const tier of ['VERY_ADVANCED','ADVANCED',null]){
    const run=loadWorkerScenario({tier});
    const output=JSON.stringify(run.run());
    assert.deepEqual(Object.keys(JSON.parse(output)).sort(),['kind','status']);
    assert(!/TOP_SECRET|founder|planet|species|galaxy|sector|count|system/i.test(output),output);
  }
});
test('37.C/05: dos consultas de la misma generación/región dan la misma respuesta',()=>{
  const run=loadWorkerScenario({tier:'VERY_ADVANCED'});
  assert.deepEqual(run.run(),run.run());
  assert.equal(run.calls.civilizations,2);
});
test('37.C/06: rangos de la cuadrícula y resultados de frontera respetan la región',()=>{
  const grid=makeGrid(12);
  for(const [x,y] of [[0,0],[-12,-12],[-12,12],[12,12]]){
    const list=regional.regionalSectorWindow37b(grid,new Coordinates(x,y));
    assert.equal(list.length,100);
    assert.equal(new Set(list.map(p=>`${p.x},${p.y}`)).size,100);
    assert(list.every(p=>grid.contains(p)));
    assert(list.some(p=>p.x===x&&p.y===y));
    assert.deepEqual(list.map(p=>`${p.x}/${p.y}`),regional.regionalSectorWindow37b(grid,new Coordinates(x,y)).map(p=>`${p.x}/${p.y}`));
  }
});
test('37.C/07: errores físicos producen INCOMPLETE; DETECTED prevalece sin falsos negativos',()=>{
  assert.equal(regional.regionalSignalStatus37b(false,1),'INCOMPLETE');
  assert.equal(regional.regionalSignalStatus37b(true,1),'DETECTED');
  assert.equal(regional.regionalSignalStatus37b(false,0),'NO_SIGNAL');
  assert.equal(loadWorkerScenario({physical:false}).run().status,'NO_SIGNAL');
});
test('37.C/08: rechazo de solicitudes ajenas a V3 o con coordenadas inválidas',()=>{
  const run=loadWorkerScenario();
  for(const params of [{version:2},{centerX:1.5},{centerX:100}]){
    assert.equal(run.run(params).kind,'error');
  }
});
test('37.C/09: contratos cruzados VIDA.9/37.A y ausencia de radio artificial en primitivas',()=>{
  assert(profile.includes("case 'PRIMITIVE':"));
  assert(profile.includes("radio:'NONE'"));
  assert(profile.includes('observedRadioSignal:false'));
  assert(profile.includes("case 'VERY_ADVANCED':"));
  const source=read('presentation/system/system-technosignature-37a.data-source.ts');
  assert(source.includes('if (!request.confirmed')||source.includes('if(!request.confirmed'));
  assert(source.includes("id[2].endsWith(':PLANET:-')"));
  assert(source.includes('extractConfirmedCivilization'));
  const notice=read('presentation/system/system-technosignature-alert-37a.ts');
  assert(notice.includes('DiscoveryState.CONFIRMED'));
  assert(notice.includes('if(sequence===this.sequence)'));
  assert(!/\{\{\s*(?:bodyIndex|planetName|systemKey|founderSpecies)/.test(notice));
});
test('37.C/10: integración del mapa no modifica conocimiento, PD ni inventarios',()=>{
  assert(map.includes('this.regionalScanner.scan('));
  assert(map.includes('this.regionalScanner.cancel()'));
  assert(map.includes('requestId !== this.regionalSequence'));
  assert(map.includes('latest.galaxyIndex !== model.galaxyIndex'));
  assert(scene.includes('this.regionalSignalScan.emit(selection)'));
  assert(scanner.includes("type:'module'"));
  assert(!/\b(?:\.bulkPut\(|\.putState\(|\.confirm\(|\.redeem\(|\.transaction\(|\.openDatabase\()/.test(worker+scanner));
  assert(!/indexedDB|GenesisIndexedDb|GENESIS_LOCAL_REPOSITORIES/.test(worker+scanner));
  const responseShape=domainSource;
  assert(!/originPlanet|originSystem|founderSpeciesId|speciesName/.test(responseShape));
  const ui=read('presentation/galaxy-map/galaxy-map.html');
  assert(ui.includes('El origen exacto permanece desconocido.'));
});

/** Scanner real: VM aislada para demostrar la expulsión LRU y aislamiento
 * sin iniciar Angular ni abrir un Worker del navegador en Node. */
function scannerHarness(){
  const workers=[];
  class WorkerControlled {
    constructor(_url,options){this.options=options;this.terminated=false;workers.push(this);}
    postMessage(){}
    terminate(){this.terminated=true;}
    complete(status){this.onmessage?.({data:{kind:'complete',status}});}
    fail(message){this.onerror?.({message});}
  }
  const code=transpile(scanner,scannerFile).replaceAll('import.meta.url',"'file:///audit-37c.js'");
  const mod={exports:{}};
  const context={module:mod,exports:mod.exports,require:id=>{
    if(id==='@angular/core')return {Injectable:()=>value=>value};
    throw Error('Import inesperado en escáner: '+id);
  },URL,Worker:WorkerControlled,console};
  vm.runInNewContext(code,context,{filename:scannerFile,timeout:3000});
  return {scanner:new mod.exports.RegionalTechnosignature37bScanner(),workers};
}
const scannerRequest={seed:'SEED_SIMULADA',version:3,galaxyIndex:'8',centerX:0,centerY:0};
test('37.C/11: la caché conserva la ventana recientemente utilizada (LRU real)',async()=>{
  const {scanner,workers}=scannerHarness();
  for(let i=0;i<16;i++){
    const p=scanner.scan({...scannerRequest,centerX:i*10});
    workers.at(-1).complete('DETECTED');await p;
  }
  assert.equal(workers.length,16);
  assert.equal(await scanner.scan(scannerRequest),'DETECTED'); // reordena 0 a MRU
  const p=scanner.scan({...scannerRequest,centerX:160});
  workers.at(-1).complete('NO_SIGNAL');await p;
  assert.equal(workers.length,17);
  assert.equal(await scanner.scan(scannerRequest),'DETECTED');
  assert.equal(workers.length,17); // La ventana 0 no fue expulsada.
  const older=scanner.scan({...scannerRequest,centerX:10});
  assert.equal(workers.length,18); // La ventana 10 era LRU.
  workers.at(-1).complete('NO_SIGNAL');await older;
});
test('37.C/12: la caché no comunica resultados entre distintas galaxias',async()=>{
  const {scanner,workers}=scannerHarness();
  const a=scanner.scan(scannerRequest);workers[0].complete('DETECTED');await a;
  const b=scanner.scan({...scannerRequest,galaxyIndex:'9'});
  assert.equal(workers.length,2);
  workers[1].complete('NO_SIGNAL');assert.equal(await b,'NO_SIGNAL');
  assert.equal(await scanner.scan(scannerRequest),'DETECTED');
  assert.equal(workers.length,2);
});
test('37.C/13: cancelar una búsqueda invalida el resultado antiguo y permite reintento',async()=>{
  const {scanner,workers}=scannerHarness();
  const p=scanner.scan(scannerRequest);
  const rejection=assert.rejects(p,/cancelado/);
  scanner.cancel();workers[0].complete('DETECTED');await rejection;
  assert(workers[0].terminated);
  const b=scanner.scan(scannerRequest);
  assert.equal(workers.length,2);
  workers[1].complete('NO_SIGNAL');assert.equal(await b,'NO_SIGNAL');
});
