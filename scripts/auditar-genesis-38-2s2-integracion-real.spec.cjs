'use strict';
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const ts=require('typescript');const {patchScene}=require('./integrar-genesis-38-2s2-reptilianos-avanzados.cjs');
const root=process.cwd();const d='src/app/presentation/life-species-visual';
const files=[
  `${d}/vida38-advanced-reptilian-plan-38-2s.ts`,
  `${d}/vida38-advanced-reptilian-preview-38-2s2.ts`,
  `${d}/vida38-advanced-reptilian-38-2s2.spec.ts`,
];
for(const rel of files){
  const f=path.join(root,rel);assert(fs.existsSync(f),`Falta ${rel}`);
  const out=ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,reportDiagnostics:true,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  assert.equal(out.diagnostics?.length||0,0,`TS sintaxis: ${rel}`);
}
const preview=fs.readFileSync(path.join(root,files[1]),'utf8');
for(const token of [
  'isVida38AdvancedReptilian38S(contract)',
  'createVida38CivilizedReptilianPreview38O(subject,contract,quality)',
  'disposeDetachedLegacyGarments',
  'addGarments(subject,created,body,anatomy,p)',
  'addAccessories(subject,created,anatomy,p)',
  'VIDA38_2OD_REPTILIAN_BODY',
  'PRESSURE_SUIT','LAB_APPAREL','UTILITY_OVERALLS','EXECUTIVE_ATTIRE',
])assert(preview.includes(token),`No se encuentra ${token}`);
assert(!preview.includes('Math.random('),'No usar aleatoriedad no determinista');
const priorRenderer=path.join(root,d,'vida38-civilized-reptilian-preview-38-2o.ts');
assert(fs.existsSync(priorRenderer),'Falta el renderer 38.2o ya aprobado');
const sceneFile=path.join(root,d,'vida38-species-visual-preview-scene.ts');
assert(fs.existsSync(sceneFile),'Falta la escena de especies');
const scene=fs.readFileSync(sceneFile,'utf8');
const applied=patchScene(scene);assert.equal(patchScene(applied),applied,'El integrador no es idempotente');
assert(applied.includes("if (isVida38AdvancedReptilian38S(contract)) return 'BIPED_BODY'"));
assert(applied.includes('return createVida38AdvancedReptilianPreview38S2(subject, contract, quality)'));
console.log('GENESIS_38_2S2_AUDIT_OK: renderer ADVANCED, rama bípeda protegida, integración idempotente');
