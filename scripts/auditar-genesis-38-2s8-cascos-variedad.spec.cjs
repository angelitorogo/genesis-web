'use strict';
/** Auditor real de identidades CT-0, con el algoritmo TypeScript del proyecto. No crea WebGL. */
const fs=require('fs');const path=require('path');const vm=require('vm');const ts=require('typescript');
const root=process.cwd();
const relative='src/app/presentation/life-species-visual/';
const source=(name)=>fs.readFileSync(path.join(root,relative,name+'.ts'),'utf8');
const memo=new Map();
function load(name){
  if(memo.has(name))return memo.get(name);
  const tsText=source(name);
  const js=ts.transpileModule(tsText,{fileName:name+'.ts',reportDiagnostics:true,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  if(js.diagnostics.length)throw new Error('No se pudo transpilar '+name);
  const exports={};memo.set(name,exports);
  const localRequire=(dep)=>{
    if(dep==='three')return {};
    if(dep==='./vida38-species-visual-contract')return {VIDA38_SPECIES_VISUAL_REVISION:'VIDA.38.1/audit-only'};
    if(dep==='./vida38-advanced-reptilian-wardrobe-38-2s4')return {};
    if(dep.startsWith('./'))return load(dep.slice(2));
    throw new Error('Importación inesperada en auditor CT-0: '+dep);
  };
  const wrapped=vm.runInNewContext('(function(require,exports){\n'+js.outputText+'\n})',{});
  wrapped(localRequire,exports);return exports;
}
const galleryModule=load('vida38-advanced-reptilian-fixtures-38-2s');
const designModule=load('vida38-advanced-reptilian-diversity-38-2s8');
const samples=galleryModule.buildVida38AdvancedReptilianGallery38S(24);
const half=galleryModule.buildVida38AdvancedReptilianGallery38S(12);
if(samples.length!==24||half.length!==12)throw new Error('Galería no entrega 12/24 ejemplares');
const styles=new Set(),helmets=new Set(),signatures=new Set(),roles=new Set();
for(const item of samples){
  const d=designModule.deriveVida38AdvancedReptilianDesign38S8(item.plan);
  const repeated=designModule.deriveVida38AdvancedReptilianDesign38S8(item.plan);
  if(JSON.stringify(d)!==JSON.stringify(repeated))throw new Error('Indeterminismo en '+item.contract.speciesId);
  styles.add(d.style);helmets.add(d.helmet);signatures.add(d.signature);roles.add(item.plan.role);
  if(!Number.isFinite(d.hemLength)||!Number.isFinite(d.shoulderSpread))throw new Error('Parámetro no finito');
}
const wanted=designModule.VIDA38_ADV_REPT_STYLES_38S8;
if(styles.size!==wanted.length)throw new Error('Faltan familias de vestuario: '+wanted.filter(s=>!styles.has(s)).join(', '));
if(signatures.size!==24)throw new Error('Identidades de vestuario repetidas en 24');
if(roles.size<8)throw new Error('Cobertura de roles insuficiente');
if(!helmets.has('EVA_TRANSPARENT')||!helmets.has('PRESSURE_HOOD')||!helmets.has('PILOT_OPEN'))
  throw new Error('Faltan cascos EVA/piloto en la galería');
const preview=source('vida38-advanced-reptilian-preview-38-2s2');
if(!preview.includes('buildVida38AdvancedReptilianDiverseClothing38S8(anatomy,body,plan,created)'))
  throw new Error('El preview no construye mallas 38.2s8');
if(!preview.includes('isVida38AdvancedReptilian38S(contract)'))
  throw new Error('No existe guarda del nivel ADVANCED');
if(!preview.includes("part.name==='VIDA38_S4_PRESSURE_HELMET'")||!preview.includes("part.name==='VIDA38_S7_ACCESSORY_SPACE_HELMET'"))
  throw new Error('No desactiva los cascos pequeños heredados');
const helmetCode=source('vida38-advanced-reptilian-diversity-38-2s8');
for(const check of ['deriveVida38AdvancedReptilianCranialEnvelope38S8',"body.geometry.getAttribute('position')",
  'Math.sqrt(Math.max(1,maxQ))','buildVida38AdvancedReptilianHelmet38S8','CLOSED_GLASS_DOME'])
  if(!helmetCode.includes(check))throw new Error('Falta detalle en envolvente de casco: '+check);
const scene=source('vida38-species-visual-preview-scene');
if(!scene.includes('createVida38AdvancedReptilianPreview38S2'))throw new Error('La fábrica de escena no invoca rama ADVANCED');
console.log('GENESIS_38_2S8_AUDIT_OK: 24 muestras; '+styles.size+' familias; '+roles.size+' roles; '+helmets.size+' cascos; '+signatures.size+' firmas deterministas');
