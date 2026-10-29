'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..','src','app');
if(!require.extensions['.ts'])require.extensions['.ts']=(mod,file)=>{
 const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}});
 mod._compile(output.outputText,file);
};
const {test}=require('node:test');
const {GalaxySectorCoordinates}=require(path.join(root,'domain/sector/galaxy-sector-coordinates.ts'));
const {GalaxySectorGrid}=require(path.join(root,'domain/sector/galaxy-sector-grid.ts'));
const {UniverseGenerationKey}=require(path.join(root,'domain/generation/universe-generation-key.ts'));
const {UniverseSeed}=require(path.join(root,'domain/universe/universe-seed.ts'));
const {GeneratorVersion}=require(path.join(root,'domain/generation/generator-version.ts'));
const r=require(path.join(root,'presentation/galaxy-map/regional-technosignature-37b.ts'));
const key=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V3);
const g=new GalaxySectorGrid(key,9n,100,30);
test('ventana 10×10, 100 sectores, centro y extremos',()=>{
 for(const [x,y] of [[0,0],[-30,30],[30,-30]]){
  const p=r.regionalSectorWindow37b(g,new GalaxySectorCoordinates(x,y));
  assert.equal(p.length,100);assert.equal(new Set(p.map(c=>c.x+','+c.y)).size,100);
  assert(p.every(c=>g.contains(c)));
  assert(p.some(c=>c.x===x && c.y===y));
 }
});
test('una observación incompleta no se presenta como negativo confirmado',()=>{
 assert.equal(r.regionalSignalStatus37b(false,4),'INCOMPLETE');
 assert.equal(r.regionalSignalStatus37b(false,0),'NO_SIGNAL');
 assert.equal(r.regionalSignalStatus37b(true,4),'DETECTED');
});
test('el Worker utiliza solo las evaluaciones canónicas de VIDA.3–7',()=>{
 const code=fs.readFileSync(path.join(root,'presentation/galaxy-map/regional-technosignature-37b.worker.ts'),'utf8');
 for(const str of ['GalaxySectorContentGenerator.generate','vida9V3ConfirmedPhysicalTargets','ProceduralMicrobialLifeVIDA3.evaluate','ProceduralEcologyVIDA4.evaluate','Vida5aEcologyAtmosphere.evaluate','Vida5bEcologicalMaturation.evaluate','Vida5cAdvancedBiospheres.evaluate','Vida6EcosystemsSpecies.evaluate','Vida7IntelligenceCivilizations.evaluate'])assert(code.includes(str),str);
 assert(!code.includes('setState('));assert(!code.includes('put('));
 assert(/kind: 'complete', status: 'DETECTED'/.test(code));
});
test('módulo ES, sin filtración de locators ni datos de VIDA al mapa',()=>{
 const scanner=fs.readFileSync(path.join(root,'presentation/galaxy-map/regional-technosignature-37b.scanner.ts'),'utf8');
 assert(scanner.includes("type:'module'"));
 const model=fs.readFileSync(path.join(root,'presentation/galaxy-map/regional-technosignature-37b.ts'),'utf8');
 assert(!/originPlanet|originSystem|speciesName/.test(model));
 const ui=fs.readFileSync(path.join(root,'presentation/galaxy-map/galaxy-map.html'),'utf8');
 assert(ui.includes('Origen exacto permanece desconocido.') || ui.includes('El origen exacto permanece desconocido.'));
});
