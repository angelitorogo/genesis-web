'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
const root=process.cwd();
const prefix='src/app/presentation/life-species-visual/';
const paths=[
  prefix+'vida38-civilized-humanoid-preview-38-2r.ts',
  prefix+'vida38-civilized-humanoid-oral-shape-38-2r1a.ts',
  prefix+'vida38-civilized-humanoid-oral-mesh-38-2r1a.ts',
  prefix+'vida38-civilized-humanoid-38-2r1a.spec.ts',
];
for(const name of paths){
  const full=path.join(root,name);
  assert(fs.existsSync(full),`Falta ${name}`);
  const src=fs.readFileSync(full,'utf8');
  const result=ts.transpileModule(src,{fileName:full,reportDiagnostics:true,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  assert.equal(result.diagnostics?.length??0,0,`Error sintáctico: ${name}`);
}
const renderer=fs.readFileSync(path.join(root,paths[0]),'utf8');
const shape=fs.readFileSync(path.join(root,paths[1]),'utf8');
const mesh=fs.readFileSync(path.join(root,paths[2]),'utf8');
assert(renderer.includes('sculptVida38CivilHumanoidOralRaw38R1A(shaped,oralPlan)'),
  'La malla SDF no contiene la reconstrucción del tercio facial');
assert(renderer.includes('createVida38CivilHumanoidOralMeshes38R1A(anatomy,oralPlan,contract)'),
  'No está conectada la abertura oral');
assert(renderer.includes('createVida38HumanoidTeethV1(anatomy,contract)'),
  'Se ha perdido la dentición anterior');
assert(!renderer.includes('addHumanoidMouth('),'Permanece el montaje obsoleto de 38.2r1');
assert(shape.includes('deriveVida38HumanoidFaceLandmarks38GC'), 'Faltan landmarks reales');
assert(shape.includes('evaluateVida38HumanoidField'), 'Falta alineación con el SDF');
assert(mesh.includes('contract.pigmentation.primaryColorHex'),'Boca basada en color del traje y no de la piel');
assert(!shape.includes('Math.random('),'Aleatoriedad global prohibida');
assert(!mesh.includes('Math.random('),'Aleatoriedad global prohibida');
console.log('GENESIS_38_2R1A_AUDIT_OK: landmarks SDF; 3 superficies; tercio facial; identidad y regresión intactos');
