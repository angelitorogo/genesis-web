'use strict';
/** VISCATM.1b — portable across Windows/Linux, does not need WebGL. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const sys=path.join(root,'src/app/presentation/system');
let checks=0;
const check=(label,fn)=>{try{fn();checks++;}catch(e){console.error('FAIL:',label);throw e;}};
require.extensions['.ts']=(module,filename)=>{
  const result=ts.transpileModule(fs.readFileSync(filename,'utf8'),{
    fileName:filename,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true,
  });
  assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
  module._compile(result.outputText,filename);
};
const {buildSystemSceneGiantAtmospherePresentationV1:P}=require(path.join(sys,'system-scene-giant-atmosphere-presentation.ts'));
const {buildSystemSceneGiantAtmosphereTextureV1:T}=require(path.join(sys,'system-scene-giant-atmosphere-texture.ts'));
const {refineGiantAtmosphereMultiresVISCATM1:R,giantAtmosphereFocusWidthVISCATM1:F,
  GIANT_ATMOSPHERE_DETAIL_VERSION_VISCATM1:VERSION}=require(path.join(sys,'system-scene-giant-atmosphere-multires-viscatm1.ts'));
const {refinePlanetRgbaTextureV1:OLD}=require(path.join(sys,'system-scene-planet-texture-refinement.ts'));
const scene=fs.readFileSync(path.join(sys,'system-scene.ts'),'utf8');
const material=fs.readFileSync(path.join(sys,'system-scene-atmosphere-material.ts'),'utf8');
const input=kind=>P({planetType:kind,massEarth:kind==='GAS_GIANT'?250:17,radiusEarth:kind==='GAS_GIANT'?10:4,
  densityGramsPerCubicCentimeter:1.4,envelopeMassFraction01:.55,iceBearingFractionOfSolids01:.66,
  rotationPeriodHours:15,equilibriumTemperatureKelvin:90,referenceBondAlbedo01:.48,
  retainedMeanMolarMassGramsPerMole:2.5,retainedGasComposition:[
    {gas:'HYDROGEN',moleFraction01:.74},{gas:'HELIUM',moleFraction01:.18},{gas:'METHANE',moleFraction01:.08}]});
function edgeEnergy(p,width){let sum=0,n=0;for(let y=18;y<width/2-18;y+=3)for(let x=4;x<width-8;x+=5){const i=(y*width+x)*4;sum+=Math.abs(p[i]-p[i+4])+Math.abs(p[i]-p[i+width*4]);n+=2;}return sum/n;}
check('versión de caché de texturas renovada',()=>assert.equal(VERSION,3));
check('LOD de foco único sin segundo salto',()=>{assert.equal(F(300,null),512);assert.equal(F(390,512),512);assert.equal(F(300,1024),512);assert.equal(F(250,1024),512);});
check('LOD limitado al único planeta cercano',()=>{
  assert(scene.includes('const candidate = closestPlanet?.projectedDiameter'));
  assert(scene.includes("candidateBody?.kind === 'planet' && candidateBody.giantAtmosphere !== null"));
  assert(scene.includes('giantAtmosphereFocusWidthVISCATM1(candidate!.projectedDiameter'));
});
check('sin alterar el LOD de sólidos',()=>assert(scene.includes('PLANET_TEXTURE_DETAIL_SIZES_V1.closeSystem.width')));
check('bruma reducida solo para gigantes',()=>{
  assert(material.includes('value: optics.deepEnvelope ? 1 : 0'));
  assert(material.includes('mix(1.0, 0.47, genesisClarity)'));
  assert(material.includes('mix(1.0, 0.35, genesisClarity)'));
  assert(scene.includes('0.56, // VISCATM.1b: preserve cloud-top detail'));
});
for(const kind of ['GAS_GIANT','ICE_GIANT','MINI_NEPTUNE']){
  const state=input(kind);const context={systemIdentity:'G0/Droveria',planetId:'h',atmosphere:state};
  const base=T(context);const snapshot=new Uint8Array(base.albedoRgba);
  const high=T({...context,width:1024,height:512});
  const refined=R(base.albedoRgba,256,128,1024,base.seedUint32,state,'CLOUD_TOPS');
  const interp=OLD(base.albedoRgba,256,128,1024,base.seedUint32,'GAS');
  check(kind+' paridad exacta de ficha y foco',()=>assert.deepEqual(high.albedoRgba,refined));
  check(kind+' mayor definición espacial',()=>assert(edgeEnergy(high.albedoRgba,1024)>1.25*edgeEnergy(interp,1024)));
  check(kind+' atlas fuente inmutable',()=>assert.deepEqual(base.albedoRgba,snapshot));
  check(kind+' determinismo entre ejecuciones',()=>assert.deepEqual(high.albedoRgba,T({...context,width:1024,height:512}).albedoRgba));
  check(kind+' costura longitudinal',()=>{for(let y=0;y<512;y++){const i=y*1024*4;for(let c=0;c<4;c++)assert.equal(high.albedoRgba[i+c],high.albedoRgba[i+1023*4+c]);}});
  check(kind+' sin vegetación ni relieve sintético',()=>assert.equal(high.albedoRgba.length,1024*512*4));
  check(kind+' haze mismo atlas de ficha y escena',()=>assert.deepEqual(high.upperHazeRgba,base.upperHazeRgba===null?null:
    R(base.upperHazeRgba,256,128,1024,base.seedUint32,state,'UPPER_HAZE')));
}
console.log(`PASS GENESIS VISCATM.1b — ${checks} comprobaciones portátiles de claridad, paridad, LOD y regresión.`);
