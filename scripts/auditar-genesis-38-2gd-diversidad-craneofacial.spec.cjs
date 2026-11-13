#!/usr/bin/env node
'use strict';
/** Auditoría CPU 38.2g.d, sin WebGL: contrato puro y topología SDF real. */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const ts = require('typescript');
const base = 'src/app/presentation/life-species-visual';
const paths = [
  `${base}/vida38-humanoid-face-38-2gd.ts`,
  `${base}/vida38-humanoid-organic-field-38-2e.ts`,
  `${base}/vida38-humanoid-hair-dentition-38-2gd.ts`,
  `${base}/vida38-species-visual-preview-scene.ts`,
  `${base}/vida38-humanoid-face-38-2gd.spec.ts`,
];
for (const file of paths) {
  assert.ok(fs.existsSync(file), `Falta ${file}: aplica el ZIP desde la raíz de GENESIS`);
  const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
  });
  const errors = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `${file}: ${errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('; ')}`);
}
const old = require.extensions['.ts'];
require.extensions['.ts'] = (mod, filename) => {
  const out = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  mod._compile(out.outputText, filename);
};
try {
  const {deriveVida38HumanoidFace38GD, deriveVida38HumanoidHairColor38GD} = require(path.resolve(`${base}/vida38-humanoid-face-38-2gd.ts`));
  const {deriveVida38HumanoidAnatomy, evaluateVida38HumanoidField, buildVida38HumanoidRawMesh, auditVida38HumanoidRawMesh, measureVida38HumanoidMeshV1} = require(path.resolve(`${base}/vida38-humanoid-organic-field-38-2e.ts`));
  const contract = (i, food='OMNIVORE', covering='LEATHERY') => ({
    speciesId:`vida6:38gd-${i}`, speciesName:`38gd-${i}`, bodyLengthMeters: 1.67,
    ecology:{habitat:'SURFACE_SOIL', nutrition:food, niche:`SOIL/${food}`},
    morphology:{group:'HUMANOIDS', bodyPlan:'BIPED', covering, appendagePairs:2},
    locomotion:'WALKING', adaptations:['SENSORY_ORIENTATION'], intelligence:null,
    pigmentation:{primaryColorHex:'#ad9180',secondaryColorHex:'#698e9b',pattern:'MOTTLED',bioluminescent:false},
    variantSeedUint32:1, appearanceFingerprint:'normal',
  });
  const profiles = Array.from({length:120},(_,i) => deriveVida38HumanoidFace38GD(contract(i)));
  assert.ok(new Set(profiles.map(p => p.fingerprint)).size === profiles.length);
  assert.ok(new Set(profiles.map(p => p.hairStyle)).size >= 5);
  assert.ok(profiles.some(p => p.hairStyle==='BALD'));
  assert.ok(profiles.some(p => p.hairStyle==='DENSE'));
  assert.ok(profiles.some(p => p.browRidge === 0));
  assert.ok(profiles.some(p => p.browRidge > 1.2));
  assert.ok(new Set(profiles.map(p => p.restingExpression)).size === 5);
  assert.ok(new Set(profiles.map(p => p.facialWidth)).size > 80);
  const nutrition = ['PREDATOR','OMNIVORE','HERBIVORE','PHOTOSYNTHETIC'];
  assert.deepEqual(nutrition.map(x => deriveVida38HumanoidFace38GD(contract(999, x)).dentition), ['CANINES','MIXED','FLAT','REDUCED']);
  const original = contract('stable');
  const altered = {...original, appearanceFingerprint:'another', pigmentation:{...original.pigmentation,primaryColorHex:'#112233',secondaryColorHex:'#eeffcc'}};
  assert.deepEqual(deriveVida38HumanoidFace38GD(original), deriveVida38HumanoidFace38GD(altered));
  assert.notEqual(deriveVida38HumanoidHairColor38GD(original), deriveVida38HumanoidHairColor38GD(altered));

  // Comprobación física de que el perfil facial interviene en el SDF,
  // no solo en metadatos: ceja y boca cambian el campo real.
  const anatomy=deriveVida38HumanoidAnatomy(contract('landmarks'));
  const browLess={...anatomy,face:{...anatomy.face,browRidge:0,mouthOpen:0.004,mouthCurve:-0.022}};
  const browMore={...anatomy,face:{...anatomy.face,browRidge:1.5,mouthOpen:0.025,mouthCurve:0.022}};
  let fieldDifference=0;
  for(let x=-0.21;x<=0.23;x+=0.035)
    for(let y=anatomy.legLength+1.04*anatomy.torsoLength;y<=anatomy.legLength+1.34*anatomy.torsoLength;y+=0.035)
      for(let z=0.19;z<0.37;z+=0.035)
        fieldDifference+=Math.abs(evaluateVida38HumanoidField(browLess,x,y,z)-evaluateVida38HumanoidField(browMore,x,y,z));
  assert.ok(fieldDifference>0.04,'El perfil facial no modifica la geometría SDF real');
  for(const i of [0,1,2,13,47,88]) {
    const c=contract(i);
    const mesh=buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(c),'LOW');
    const a=auditVida38HumanoidRawMesh(mesh);
    assert.equal(a.invalid,0);
    assert.equal(a.components,1);
    assert.equal(a.boundaryEdges,0);
    assert.equal(a.nonManifoldEdges,0);
    assert.equal(a.inconsistentEdges,0);
    assert.equal(measureVida38HumanoidMeshV1(mesh).actualHeightMeters,c.bodyLengthMeters);
  }
  console.log('GENESIS_38_2GD_AUDIT_OK: 120 perfiles deterministas, ecología/dentición, diversidad capilar y 6 mallas SDF cerradas');
} finally {
  if (old) require.extensions['.ts'] = old;
  else delete require.extensions['.ts'];
}
