'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const d='src/app/presentation/life-species-visual';
const files=[
  `${d}/vida38-advanced-reptilian-wardrobe-38-2s4.ts`,
  `${d}/vida38-advanced-reptilian-preview-38-2s2.ts`,
  `${d}/vida38-advanced-reptilian-38-2s4.spec.ts`,
];
for(const f of files){
  const content=fs.readFileSync(path.resolve(process.cwd(),f),'utf8');
  const compiled=ts.transpileModule(content,{fileName:f,reportDiagnostics:true,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  assert.equal(compiled.diagnostics?.length??0,0,`Sintaxis TS inválida en ${f}`);
}
const wardrobe=fs.readFileSync(path.resolve(d,'vida38-advanced-reptilian-wardrobe-38-2s4.ts'),'utf8');
const renderer=fs.readFileSync(path.resolve(d,'vida38-advanced-reptilian-preview-38-2s2.ts'),'utf8');
for(const name of ['CIVIL_UNIFORM','TECH_WORKSUIT','SCIENTIFIC_ATTIRE','COLONIAL_EXPLORER',
  'SECURITY_MILITARY','ENVIRONMENTAL_SUIT','DIPLOMATIC_FORMAL','AEROSPACE_TECHNICIAN']){
    assert(wardrobe.includes(name),`Falta familia ${name}`);
}
for(const name of ['TECH_BOOTS_360','TAIL_AWARE_COAT_SKIRT','PRESSURE_HELMET','BREATHING_MODULE','UTILITY_POUCH']){
  assert(wardrobe.includes(name),`Falta una pieza visual: ${name}`);
}
assert(renderer.includes('isVida38AdvancedReptilian38S(contract)'));
assert(renderer.includes('createVida38CivilizedReptilianPreview38O(subject,contract,quality)'));
assert(renderer.includes('buildVida38AdvancedReptilianGarments38S4'));
assert(renderer.includes('buildVida38AdvancedReptilianAccessories38S4'));
assert(!wardrobe.includes('Math.random('));
assert(!renderer.includes('Math.random('));
console.log('GENESIS_38_2S4_AUDIT_OK: 8 familias y prendas 3D; integración exclusiva ADVANCED');
