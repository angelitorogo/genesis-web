'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);
const root=path.resolve(__dirname,'../src/app');
const {LifePlausibilityEngineVIDA2:Life}=require(path.join(root,'simulation/life/life-plausibility-engine-vida2.ts'));
const {ProceduralMicrobialLifeVIDA3:Microbes}=require(path.join(root,'simulation/life/procedural-microbial-life-vida3.ts'));
const {VIDA3_MODEL_REVISION,VIDA3_LIFE_ROLL_NAMESPACE}=require(path.join(root,'domain/life/procedural-microbial-vida3.ts'));
const make=(route,extra={})=>({route,water:'UNKNOWN',temperatureKelvin:null,interiorLiquidModeled:false,interiorPotential:false,
 pressurePascal:null,hasIceOrRockCover:null,coverPotential:false,stellarInsolationEarth:null,
 internalHeatFluxWattsPerSquareMeter:null,internalEnergyPotential:null,solidSurface:true,provenance:'VIDA.3 test',...extra});
const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const id={universeSeed:seed,generatorVersionCode:3,kind:'MOON',galaxyIndex:'0',sectorKey:'1',galacticObjectIndex:'0',bodyIndex:'1',moonIndex:'0'};
test('VIDA.2/v2: cuatro factores condicionales no crean un subsuelo plausible',()=>{
 const result=Life.evaluate(make('SURFACE',{temperatureKelvin:45}),make('SUBSURFACE',{
  water:'POTENTIAL',interiorPotential:true,coverPotential:true,internalEnergyPotential:true,
 }));
 assert.equal(result.classification,'INDETERMINATE');
 assert.equal(result.routes[1].score,null);
 assert.equal(Microbes.evaluate(id,result).lifePresent,false);
});
test('VIDA.2/v2: océano interior modelado y calor no adverso permite plausibilidad',()=>{
 const result=Life.route(make('SUBSURFACE',{
  water:'PRESENT',interiorLiquidModeled:true,hasIceOrRockCover:true,internalEnergyPotential:true,
 }));
 assert.equal(result.classification,'PLAUSIBLE');
});
test('VIDA.2/v2: solo nicho potencial con calor físico suficiente y sin contradicción',()=>{
 const base={water:'POTENTIAL',interiorPotential:true,coverPotential:true,
  internalHeatFluxWattsPerSquareMeter:0.002};
 assert.equal(Life.route(make('SUBSURFACE',{...base,internalEnergyPotential:true})).classification,'PLAUSIBLE');
 assert.equal(Life.route(make('SUBSURFACE',{...base,internalEnergyPotential:false})).classification,'INDETERMINATE');
});
test('VIDA.3: el 20% conserva el sorteo de v1 en mundos que siguen siendo plausibles',()=>{
 assert.equal(VIDA3_MODEL_REVISION,'VIDA.3/microbial/v3-aquifer-lunar-surface');
 assert.equal(VIDA3_LIFE_ROLL_NAMESPACE,'VIDA.3/microbial/v1');
 const assessment=Life.evaluate(make('SURFACE',{water:'PRESENT',temperatureKelvin:300,pressurePascal:101325,
  stellarInsolationEarth:1}),make('SUBSURFACE'));
 const sample=Microbes.evaluate(id,assessment);
 const hash=createHash('sha256').update([VIDA3_LIFE_ROLL_NAMESPACE,seed,'3',sample.bodyStorageKey,'LIFE_PRESENT'].join('|')).digest();
 const expected=hash.readUInt32BE(0)/2**32<0.2;
 assert.equal(sample.lifePresent,expected);
});
test('VIDA.3 v2 persiste en namespace por revision sin migración de Dexie V8',()=>{
 const repository=fs.readFileSync(path.resolve(root,'data/local/repository/dexie-procedural-microbial-vida3.repository.ts'),'utf8');
 assert.match(repository,/storageBodyKey\s*=\s*`\$\{snapshot\.revision\}\|\$\{snapshot\.bodyStorageKey\}`/);
 assert.match(repository,/snapshotJson: JSON\.stringify\(snapshot\)/);
 const schema=fs.readFileSync(path.resolve(root,'data/local/indexed-db/genesis-indexed-db-schema.ts'),'utf8');
 assert.match(schema,/privateMicrobialBiospheres: '\[universeSeed\+generatorVersionCode\+bodyStorageKey\]/);
});
