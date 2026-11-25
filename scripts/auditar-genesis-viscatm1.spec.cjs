'use strict';
/** GENESIS VISCATM.1 — auditor portable sin WebGL ni datos de usuario. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript'); // Siempre la dependencia local del proyecto, nunca rutas absolutas.
const root = path.resolve(__dirname, '..');
let checks = 0;
function check(name, run) { run(); checks++; }
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  }, fileName: filename, reportDiagnostics: true });
  const errors = (output.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `Falló transpilación de ${filename}: ${errors.map(e => ts.flattenDiagnosticMessageText(e.messageText, '\n'))}`);
  module._compile(output.outputText, filename);
};
const sysDir = path.join(root,'src/app/presentation/system');
const { buildSystemSceneGiantAtmosphereTextureV1 } = require(path.join(sysDir,'system-scene-giant-atmosphere-texture.ts'));
const { buildSystemSceneGiantAtmospherePresentationV1 } = require(path.join(sysDir,'system-scene-giant-atmosphere-presentation.ts'));
const { refineGiantAtmosphereMultiresVISCATM1, giantAtmosphereFocusWidthVISCATM1 } = require(path.join(sysDir,'system-scene-giant-atmosphere-multires-viscatm1.ts'));
const { refinePlanetRgbaTextureV1 } = require(path.join(sysDir,'system-scene-planet-texture-refinement.ts'));
const sceneSource = fs.readFileSync(path.join(sysDir,'system-scene.ts'), 'utf8');
function atmosphere(kind){
  const gas=kind==='GAS_GIANT';
  return buildSystemSceneGiantAtmospherePresentationV1({
    planetType:kind,massEarth:gas?260:kind==='ICE_GIANT'?18:9,
    radiusEarth:gas?10.5:kind==='ICE_GIANT'?4.0:3.3,
    densityGramsPerCubicCentimeter:gas?1.1:1.5,
    envelopeMassFraction01:gas?.78:.28,
    iceBearingFractionOfSolids01:gas?.14:.72,
    rotationPeriodHours:gas?10:16,
    equilibriumTemperatureKelvin:gas?180:70,
    referenceBondAlbedo01:.47,
    retainedMeanMolarMassGramsPerMole:2.6,
    retainedGasComposition:[{gas:'HYDROGEN',moleFraction01:.72}, {gas:'HELIUM',moleFraction01:.20},{gas:'METHANE',moleFraction01:.08}],
  });
}
function generate(kind, id='g-8'){
 const a=atmosphere(kind);
 assert(a && a.regime === kind);
 return buildSystemSceneGiantAtmosphereTextureV1({
   systemIdentity:'V3-ELIXISIS/S1',planetId:id,atmosphere:a,
 });
}
function seam(rgba,width){for(let y=0;y<width/2;y++){const left=y*width*4,right=left+(width-1)*4;for(let c=0;c<4;c++)assert.equal(rgba[left+c],rgba[right+c]);}}
function detailEnergy(p,width){let total=0,count=0;for(let y=24;y<width/2-24;y+=5)for(let x=3;x<width-12;x+=7){let i=(y*width+x)*4;total+=Math.abs(p[i]-p[i+4])+Math.abs(p[i]-p[i+width*4]);count+=2;}return total/count;}
for(const regime of ['GAS_GIANT','ICE_GIANT','MINI_NEPTUNE']){
  const atmosphereInput=atmosphere(regime);
  const original=generate(regime);
  const clone=new Uint8Array(original.albedoRgba);
  check(regime+' determinismo base',()=>assert.deepEqual(original.albedoRgba,generate(regime).albedoRgba));
  check(regime+' semilla propia',()=>assert(Number.isInteger(original.seedUint32)));
  check(regime+' costura base',()=>seam(original.albedoRgba,256));
  check(regime+' no relieve sólido',()=>assert.equal(original.albedoRgba.length,256*128*4));
  for(const width of [512,1024]){
    const high=refineGiantAtmosphereMultiresVISCATM1(clone,256,128,width,original.seedUint32,atmosphereInput,'CLOUD_TOPS');
    check(regime+' '+width+' forma',()=>assert.equal(high.length,width*(width/2)*4));
    check(regime+' '+width+' costura',()=>seam(high,width));
    check(regime+' '+width+' determinismo',()=>assert.deepEqual(high,refineGiantAtmosphereMultiresVISCATM1(clone,256,128,width,original.seedUint32,atmosphereInput,'CLOUD_TOPS')));
    check(regime+' '+width+' opacidad',()=>{for(let i=3;i<high.length;i+=4*19)assert.equal(high[i],255);});
  }
  check(regime+' atlas fuente inmutable',()=>assert.deepEqual(original.albedoRgba,clone));
  if(original.upperHazeRgba){
    const haze=refineGiantAtmosphereMultiresVISCATM1(original.upperHazeRgba,256,128,512,original.seedUint32,atmosphereInput,'UPPER_HAZE');
    check(regime+' haze costura',()=>seam(haze,512));
  }
}
const ice=generate('ICE_GIANT');
const old=refinePlanetRgbaTextureV1(ice.albedoRgba,256,128,1024,ice.seedUint32,'GAS');
const next=refineGiantAtmosphereMultiresVISCATM1(ice.albedoRgba,256,128,1024,ice.seedUint32,atmosphere('ICE_GIANT'),'CLOUD_TOPS');
check('microdetalle efectivo',()=>assert(detailEnergy(next,1024)>detailEnergy(old,1024)*1.08));
check('identidad cromática conservada',()=>{let sum=0,n=0;for(let i=0;i<old.length;i+=4*43){sum+=Math.abs(old[i]-next[i]);n++;}assert(sum/n<22 && sum/n>1);});
const zero=new Uint8Array(256*128*4);
const transparent=refineGiantAtmosphereMultiresVISCATM1(zero,256,128,512,ice.seedUint32,atmosphere('ICE_GIANT'),'UPPER_HAZE');
check('sin nubes inventadas',()=>{for(let i=3;i<transparent.length;i+=4)assert.equal(transparent[i],0);});
check('presupuesto acotado',()=>assert.throws(()=>refineGiantAtmosphereMultiresVISCATM1(ice.albedoRgba,256,128,4096,ice.seedUint32,atmosphere('ICE_GIANT'),'CLOUD_TOPS'),RangeError));
check('ficha usa módulo común',()=>assert(sceneSource.includes("giantAtmosphereTexture !== null && kind === 'GAS'")));
check('zoom usa módulo común',()=>assert(sceneSource.includes('const isGiantCloudDetail = body.giantAtmosphere !== null')));
check('identidad de semilla al zoom',()=>assert(sceneSource.includes('genesisGiantAtmosphereSeedVISCATM1')));
check('LOD de foco 512 sin transición adicional',()=>{assert.equal(giantAtmosphereFocusWidthVISCATM1(350,512),512);assert.equal(giantAtmosphereFocusWidthVISCATM1(390,512),512);assert.equal(giantAtmosphereFocusWidthVISCATM1(300,1024),512);assert.equal(giantAtmosphereFocusWidthVISCATM1(250,1024),512);});
check('LOD extremo solamente atmósfera',()=>{assert(sceneSource.includes("candidateBody?.kind === 'planet' && candidateBody.giantAtmosphere !== null"));assert(!sceneSource.includes('candidateBody?.giantAtmosphere'));});
check('LOD solo foco cercano',()=>assert(sceneSource.includes('closestPlanet.projectedDiameter >= (previous?.id === closestPlanet.id ? 210 : 300)')));
check('techo de 512 en SystemScene',()=>assert(sceneSource.includes('PLANET_TEXTURE_DETAIL_SIZES_V1.closeSystem.width')));
check('sin alterar atlas de lunas',()=>assert(sceneSource.includes('focusedLunarSurfaceLUNSURF1')));
check('VISCATM1 cache versionada',()=>assert(sceneSource.includes('GIANT_ATMOSPHERE_DETAIL_VERSION_VISCATM1')));
console.log(`PASS GENESIS VISCATM.1 — ${checks} comprobaciones portátiles; determinismo, LOD, paridad, costuras y ciencia.`);
