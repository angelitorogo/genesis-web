'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {patchScene,marker}=require('./integrar-genesis-38-2s6-renderer-verificado.cjs');
const root=process.cwd();
const visual='src/app/presentation/life-species-visual/';
function read(file){return fs.readFileSync(path.join(root,file),'utf8');}
function checkFile(f){assert(fs.existsSync(path.join(root,f)),`Falta ${f}`);}
const scene=visual+'vida38-species-visual-preview-scene.ts';
const runtime=visual+'vida38-advanced-reptilian-runtime-38-2s6.ts';
const preview=visual+'vida38-advanced-reptilian-preview-38-2s2.ts';
const clothes=visual+'vida38-advanced-reptilian-wardrobe-38-2s4.ts';
const gallery=visual+'vida38-advanced-reptilian-gallery-38-2s.component.ts';
const test=visual+'vida38-advanced-reptilian-38-2s6.spec.ts';
const thumbs=visual+'vida38-advanced-reptilian-thumbnails-38-2s3.ts';
for (const p of [scene,runtime,preview,clothes,gallery,test,thumbs]) checkFile(p);
const current=read(scene),probe=patchScene(current);
assert.equal(probe,current,'38.2s6: la escena todavía NO está integrada. Ejecuta node scripts/integrar-genesis-38-2s6-renderer-verificado.cjs');
assert(current.includes(marker),'38.2s6: falta control post-render');
const posFactory=current.indexOf('export function createVida38SpeciesPreviewModelV1('),posGuard=current.indexOf('enforceVida38AdvancedReptilianVisibleRenderer38S6(subject, contract,',posFactory);
const posNormalize=current.indexOf('normalizeSubject(subject);',posFactory);
const posSwitch=current.indexOf('switch (descriptor.family)',posFactory);
assert(posFactory>=0&&posSwitch>posFactory&&posGuard>posSwitch&&posNormalize>posGuard,
 '38.2s6: control fuera de orden en la fábrica real');
const runtimeSource=read(runtime);
assert(runtimeSource.includes('if (!isVida38AdvancedReptilian38S(contract)) return null;'),
  '38.2s6: el control post-render no está limitado a REPTILIAN/ADVANCED');
assert(runtimeSource.includes('assertVida38AdvancedReptilianActualModel38S6'), '38.2s6: falta validación de mallas reales');
const clothingSource=read(clothes);
for(const part of ['JACKET_360','COAT_360','WORKSUIT_360','TECH_BOOTS_360','PRESSURE_HELMET','BACKPACK_LIGHT']){
 assert(clothingSource.includes(part),`38.2s6: falta prenda real ${part}`);
}
assert(read(gallery).includes('assertVida38AdvancedReptilianActualModel38S6(model.subject)'),
 '38.2s6: la galería no valida el modelo antes de renderizar');
assert(read(gallery).includes('ERROR: vestuario no aplicado'),
 '38.2s6: se volverían a ocultar los fallos de integración');
assert(read(thumbs).includes('VIDA.38.2s6/'), '38.2s6: miniaturas obsoletas en caché');
assert(read(test).includes('createVida38SpeciesPreviewModelV1'), '38.2s6: el test no usa la escena de producción');
let ts=null;
try{ts=require('typescript');}catch{ /* proyectos sin TypeScript resoluble se revisan con ng build */ }
if(ts){
 for(const file of [runtime,preview,gallery,test,thumbs]){
  const result=ts.transpileModule(read(file),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}});
  const errs=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.equal(errs.length,0,`${file}: ${errs.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; ')}`);
 }
}
console.log('GENESIS_38_2S6_AUDIT_OK: control post-render real + ropa 3D + galería fail-closed + caché renovada + VERY_ADVANCED no modificado');
