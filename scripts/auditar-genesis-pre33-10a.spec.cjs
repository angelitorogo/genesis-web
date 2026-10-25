'use strict';
/** PRE-33.10a: semantic regressions without Angular or browser. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),
 {fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const root='../src/app/';
const {GeneratorVersion}=require(root+'domain/generation/generator-version.ts');
const {UniverseGenerationKey}=require(root+'domain/generation/universe-generation-key.ts');
const {UniverseSeed}=require(root+'domain/universe/universe-seed.ts');
const {GalaxyGenerator}=require(root+'simulation/universe/galaxy-generator.ts');
const {GalaxySectorContentGenerator}=require(root+'simulation/sector/galaxy-sector-content-generator.ts');
const {GalaxySectorCoordinates}=require(root+'domain/sector/galaxy-sector-coordinates.ts');
const {StellarMultihostFormation}=require(root+'simulation/stellar/stellar-multihost-formation.ts');
const {MinorMoonOnDemandPRE3310:Minor}=require(root+'simulation/planetary/minor-moon-on-demand-pre33-10.ts');
const {formatMinorMoonNumber,formatMinorMoonRadius,minorMoonDynamicStateLabel}=
 require(root+'presentation/moon-detail/minor-moon-scenario-format-pre33-10a.ts');
const key=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V3);
const galaxy=GalaxyGenerator.generate(key,0n);
const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(23,24));
const locator=sector.systemLocators.find(x=>x.galacticObjectIndex===0n);assert.ok(locator);
const single=StellarMultihostFormation.generateSingleOrNull(key,locator);assert.ok(single);
const moonSystem=single.moonSystems.find(x=>x.unmaterializedMinorMoonCount>0);assert.ok(moonSystem);
const index=BigInt(moonSystem.relevantMoonCount);

test('no confunde el planeta con un límite de masa lunar: prior <=10^-5 de la masa del anfitrión',()=>{
 const r=Minor.materialize(moonSystem,index);assert.equal(r.status,'CONDITIONAL_BOUNDS');
 assert.equal(r.massUpperBoundEarth,r.massPriorCeilingEarth);
 assert.ok(r.massPriorCeilingEarth<=moonSystem.hostPlanet.massEarth*1e-5/moonSystem.unmaterializedMinorMoonCount);
 assert.ok(r.massUpperBoundEarth<moonSystem.hostPlanet.massEarth);
 assert.ok(r.scenarioMassEarth<=r.massPriorCeilingEarth);
});
test('Roche usa densidad hipotética del satélite y densidad a granel del anfitrión',()=>{
 const r=Minor.materialize(moonSystem,index);const host=moonSystem.hostPlanet;
 const expected=2.44*Math.cbrt(5.514*host.massEarth/(host.radiusEarth**3)/r.scenarioDensityGramsPerCm3);
 assert.ok(Math.abs(r.rocheFluidReferenceInnerPlanetRadii-expected)<1e-9);
 assert.ok(r.samplingInnerPlanetRadii>=r.rocheFluidReferenceInnerPlanetRadii);
});
test('Hill y 1000 radios se informan por separado: el 1000 nunca es frontera física',()=>{
 const r=Minor.materialize(moonSystem,index);assert.equal(r.status,'CONDITIONAL_BOUNDS');
 assert.ok(Math.abs(r.hillProgradeReferenceOuterPlanetRadii-.49*moonSystem.hillSphereRadiusPlanetRadii)<1e-9);
 assert.equal(r.samplingOuterPlanetRadii,Math.min(1000,r.hillProgradeReferenceOuterPlanetRadii));
 assert.equal(r.samplingCeilingIsNumerical,r.hillProgradeReferenceOuterPlanetRadii>1000);
 const template=fs.readFileSync('src/app/presentation/moon-detail/moon-detail.html','utf8');
 assert.match(template,/techo de 1\.000 radios es numérico/);
 assert.doesNotMatch(template,/Órbita estable exterior/);
 assert.doesNotMatch(template,/Límite superior de masa \(M⊕/);
});
test('tope de muestreo activo: se puede comprobar sin modificar el generador',()=>{
 const host=Object.create(moonSystem);
 Object.defineProperty(host,'hillSphereRadiusPlanetRadii',{value:10000});
 Minor.release();const r=Minor.materialize(host,index);
 assert.equal(r.status,'CONDITIONAL_BOUNDS');
 assert.equal(r.hillProgradeReferenceOuterPlanetRadii,4900);
 assert.equal(r.samplingOuterPlanetRadii,1000);
 assert.equal(r.samplingCeilingIsNumerical,true);
 Minor.release();
});
test('dominio inviable no inventa masa, órbita, marea ni cotas',()=>{
 const host=Object.create(moonSystem);
 Object.defineProperty(host,'hillSphereRadiusPlanetRadii',{value:2});
 Minor.release();const r=Minor.materialize(host,index);
 assert.equal(r.status,'OUTSIDE_ORBITAL_DOMAIN');
 assert.equal(r.scenarioMassEarth,null);
 assert.equal(r.scenarioSemiMajorAxisPlanetRadii,null);
 assert.equal(r.massPriorCeilingEarth,null);
 assert.equal(r.hillProgradeReferenceOuterPlanetRadii,null);
 assert.equal(r.physicalModelResolved,false);
 Minor.release();
});
test('semilla/época reproducibles, sin elevar hipótesis a vida o evidencia resuelta',()=>{
 const a=Minor.materialize(moonSystem,index,25);Minor.release();
 const b=Minor.materialize(moonSystem,index,25);
 assert.deepEqual(a,b);assert.equal(b.life,'NOT_EVALUATED');
 assert.equal(b.physicalModelResolved,false);assert.equal(b.water,'UNKNOWN');
});
test('formato de la ficha, radio aproximado, textos españoles y ausencia de falsa ficha detallada',()=>{
 assert.equal(formatMinorMoonNumber(0.0000016198858311689724),'1,620 × 10⁻⁶');
 assert.equal(formatMinorMoonNumber(12.02030371210795),'12,02');
 assert.match(formatMinorMoonRadius(.013222426811642455),/84,24 km/);
 assert.equal(formatMinorMoonNumber(null),'No evaluable');
 assert.match(minorMoonDynamicStateLabel('CONDITIONAL_BOUNDS'),/condicional/);
 const tpl=fs.readFileSync('src/app/presentation/moon-detail/moon-detail.html','utf8');
 assert.match(tpl,/resolution\(\)\?\.kind === 'IDENTITY_ONLY'/);
 assert.match(tpl,/Caracterización física bajo demanda/);
});
