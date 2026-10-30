#!/usr/bin/env node
'use strict';
/** Auditoría sin WebGL. Ejecutar en raíz de genesis-web con TypeScript instalado. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = 'src/app/presentation/life-species-visual/vida38-humanoid-organic-field-38-2e.ts';
const material = 'src/app/presentation/life-species-visual/vida38-humanoid-organic-material-38-2e.ts';
const bridge = 'src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts';
const component = 'src/app/presentation/life-species-visual/life-species-visual-preview.ts';
for(const f of [source,material,bridge,component])assert.ok(fs.existsSync(f),`Archivo ausente: ${f}`);
const compile = (p) => {
  const text = fs.readFileSync(p,'utf8');
  const result = ts.transpileModule(text, {
    fileName:p, reportDiagnostics:true,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true,experimentalDecorators:true},
  });
  const errors = (result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('\n'));
  return result.outputText;
};
for(const p of [source,material,bridge,component])compile(p);
const Module=require('node:module');
const filename=path.resolve(source);
const mod = new Module(filename,module);
mod.filename=filename;mod.paths=Module._nodeModulePaths(path.dirname(filename));
mod._compile(compile(source),filename);
const {deriveVida38HumanoidAnatomy,buildVida38HumanoidRawMesh,auditVida38HumanoidRawMesh}=mod.exports;
const contract=id=>({speciesId:id,variantSeedUint32:0x12abcdef,appearanceFingerprint:'af81c0d2',bodyLengthMeters:1.6126});
for(const speciesId of ['vida6:kamera-ix1','vida6:sania-on1','vida6:another-humanoid']){
  const input=contract(speciesId);
  const anatomy=deriveVida38HumanoidAnatomy(input);
  assert.equal(anatomy.lengthMeters,input.bodyLengthMeters);
  const first=buildVida38HumanoidRawMesh(anatomy,'MEDIUM');
  const result=auditVida38HumanoidRawMesh(first);
  assert.ok(result.triangleCount>10000,result.triangleCount);
  assert.equal(result.invalid,0);
  assert.equal(result.boundaryEdges,0);
  assert.equal(result.nonManifoldEdges,0);
  assert.equal(result.inconsistentEdges,0);
  assert.equal(result.components,1);
  console.log(`${speciesId}: ${result.vertexCount} vertices, ${result.triangleCount} triángulos, malla cerrada y conexa`);
}
const ident=deriveVida38HumanoidAnatomy(contract('vida6:deterministic'));
const a=buildVida38HumanoidRawMesh(ident,'LOW');
const b=buildVida38HumanoidRawMesh(ident,'LOW');
assert.deepEqual(a.positions,b.positions);
assert.deepEqual(a.indices,b.indices);
assert.deepEqual(a.normals,b.normals);
assert.ok(buildVida38HumanoidRawMesh(ident,'HIGH').indices.length>a.indices.length);
const bridgeSource=fs.readFileSync(bridge,'utf8');
assert.ok(bridgeSource.includes("buildVida38HumanoidRawMesh(anatomy, quality)"));
assert.ok(bridgeSource.includes('createVida38HumanoidSkinV1'));
assert.ok(bridgeSource.includes('contract.morphology.group === \'HUMANOIDS\''));
assert.ok(!bridgeSource.includes('function organicRelief('));
assert.ok(!bridgeSource.includes('function latheOrganicGeometry('));
assert.ok(fs.readFileSync(material,'utf8').includes('vertexColors:true'));
assert.ok(fs.readFileSync(material,'utf8').includes('roughnessMap:maps.roughnessMap'));
assert.ok(fs.readFileSync(component,'utf8').includes('THREE.ACESFilmicToneMapping'));
console.log('VIDA38_2E_ORGANIC_HUMANOID_AUDIT_OK');
