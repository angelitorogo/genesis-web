'use strict';
/** Regresión determinista sin render WebGL; ejecutar en la raíz de GENESIS Web. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = process.cwd();
const dir = path.join(root,'src/app/presentation/life-species-visual');
const files = [
  'vida38-civilized-insectoid-ocular-diversity-38-2q1f.ts',
  'vida38-civilized-insectoid-38-2q1f2.spec.ts',
  'vida38-civilized-insectoid-38-2q1f1.spec.ts',
];
for(const name of files){
  const f=path.join(dir,name);
  assert(fs.existsSync(f),`Falta archivo: ${name}`);
  const report=ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,reportDiagnostics:true,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  assert.equal(report.diagnostics?.length??0,0,`Error de sintaxis: ${name}`);
}
const text=fs.readFileSync(path.join(dir,files[0]),'utf8');
assert(text.includes('findVida38InsectoidFrontalCraniumPoint38Q1F'), 'Se ha perdido el anclaje al cráneo');
assert(text.includes('raycaster.intersectObject(head, false)'), 'El ojo no se ancla por intersección');
assert(!text.includes('Math.random('), 'Debe mantenerse determinismo CT-0');
const js=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const localModule={exports:{}};
vm.runInNewContext(js,{module:localModule,exports:localModule.exports,require(id){
  if(id==='three'||id.startsWith('./'))return {};
  throw Error(`Import no esperado ${id}`);
}}, {filename:files[0]});
const derive=localModule.exports.deriveVida38InsectoidOcularPlan38Q1F;
const archetypes=['MANTID_SENTINEL','BEETLE_BASTION','WASP_DIPLOMAT','ANT_ENGINEER',
  'MOTH_ORACLE','DRAGONFLY_EXPLORER','CICADA_ARCHIVIST','STICK_SCHOLAR'];
const previous={
  ROUNDED_COMPOUND:[1.12,1.14],OVAL_COMPOUND:[1.04,1.38],ANGULAR_COMPOUND:[1.17,1.07],
  LATERAL_COMPOUND:[1.44,1.03],PSEUDO_ARACHNOID:[1.00,1.03],REDUCED_COMPOUND_OCELLI:[.95,.95],
};
const families=new Set(),signatures=new Set();
for(let i=0;i<4096;i++){
  const plan={speciesId:`AUDIT-Q1F2-${i}`,signature:`seed-q1f2-${i}`,archetype:archetypes[i%archetypes.length]};
  const a=derive(plan),b=derive(plan);
  assert.equal(a.signature,b.signature,`No determinista ${i}`);
  assert.equal(a.revision,'VIDA.38.2q1f2/ocular-balanced-placement/v3');
  const old=previous[a.family];assert(old,`Familia desconocida ${a.family}`);
  assert(a.lateralScale.x/old[0]>.73 && a.lateralScale.x/old[0]<.87,`No equilibra anchura: ${i}`);
  assert(a.lateralScale.y/old[1]>.74 && a.lateralScale.y/old[1]<.91,`No equilibra altura: ${i}`);
  assert(a.frontalAnchorFactor>=.86 && a.frontalAnchorFactor<=.94,`Anclaje excesivamente centrado/exterior: ${i}`);
  assert(a.surfaceEmbedDepth>=.015 && a.surfaceEmbedDepth<=.030,`Profundidad anómala: ${i}`);
  assert(a.specialEyeCount===0||a.specialEyeScale<=.025,`Ocelos demasiado grandes: ${i}`);
  families.add(a.family);signatures.add(a.signature);
}
assert.equal(families.size,6,'Falta una familia ocular');
assert(signatures.size>4000,'Poca variedad intraespecífica');
console.log(`GENESIS_38_2Q1F2_AUDIT_OK: 4096 identidades · ${families.size} familias · ${signatures.size} firmas · tamaño equilibrado`);
