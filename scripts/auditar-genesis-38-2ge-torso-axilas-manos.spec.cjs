#!/usr/bin/env node
'use strict';
/** GENESIS 38.2g.e — auditoría CPU, topológica y de constituciones. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const base='src/app/presentation/life-species-visual';
const files=[
  `${base}/vida38-humanoid-torso-38-2ge.ts`,
  `${base}/vida38-humanoid-chest-hair-38-2ge.ts`,
  `${base}/vida38-humanoid-organic-field-38-2e.ts`,
  `${base}/vida38-species-visual-preview-scene.ts`,
  `${base}/vida38-humanoid-torso-38-2ge.spec.ts`,
  `${base}/vida38-species-visual-preview-scene.spec.ts`,
];
for(const file of files) {
  assert.ok(fs.existsSync(file), `No existe ${file}: extrae el ZIP desde la raíz`);
  const result=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
  const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,`${file}: ${errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('; ')}`);
}
const scene=fs.readFileSync(`${base}/vida38-species-visual-preview-scene.ts`,'utf8');
assert.ok(scene.includes('createVida38HumanoidChestHair38GE'));
assert.ok(scene.includes("subject.userData['vida38ReconstructionRevision'] = '38.2g.e'"));
const spec=fs.readFileSync(`${base}/vida38-species-visual-preview-scene.spec.ts`,'utf8');
assert.ok(spec.includes('vida38BiologicalRelief'));
assert.ok(!spec.includes('normalMap).not.toBeNull'));
assert.ok(spec.includes('VIDA38_2GC_OCULAR_INTEGRATED_'));
const old=require.extensions['.ts'];
require.extensions['.ts']=(module,filename)=>{
  const js=ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  module._compile(js,filename);
};
try {
  const {deriveVida38HumanoidTorso38GE}=require(path.resolve(`${base}/vida38-humanoid-torso-38-2ge.ts`));
  const {deriveVida38HumanoidMorphologyV1}=require(path.resolve(`${base}/vida38-humanoid-morphology-38-2f.ts`));
  const {deriveVida38HumanoidAnatomy,evaluateVida38HumanoidField,buildVida38HumanoidRawMesh,auditVida38HumanoidRawMesh,measureVida38HumanoidMeshV1}=require(path.resolve(`${base}/vida38-humanoid-organic-field-38-2e.ts`));
  const contract=(i,cover='LEATHERY')=>({
    speciesId:`vida6:38ge-${i}`,speciesName:`38ge-${i}`,bodyLengthMeters:1.72,
    ecology:{habitat:'SURFACE_SOIL',nutrition:'OMNIVORE',niche:'SURFACE_SOIL/OMNIVORE'},
    morphology:{group:'HUMANOIDS',bodyPlan:'BIPED',covering:cover,appendagePairs:2},
    locomotion:'WALKING',adaptations:['SENSORY_ORIENTATION','THERMAL_BUFFERING'],intelligence:null,
    pigmentation:{primaryColorHex:'#b39881',secondaryColorHex:'#6b8582',pattern:'MOTTLED',bioluminescent:false},
    appearanceFingerprint:'test',variantSeedUint32:112,
  });
  const profiles=Array.from({length:160},(_,i)=>{
    const c=contract(i);
    return deriveVida38HumanoidTorso38GE(c,deriveVida38HumanoidMorphologyV1(c));
  });
  assert.equal(new Set(profiles.map(p=>p.fingerprint)).size,160);
  assert.equal(new Set(profiles.map(p=>p.build)).size,5);
  assert.ok(profiles.some(p=>p.chestHairPattern==='BARE'));
  assert.ok(profiles.some(p=>p.chestHairPattern==='DENSE'));
  const c=contract('recolor');
  const recolor={...c,appearanceFingerprint:'changed',pigmentation:{...c.pigmentation,primaryColorHex:'#ffff00',secondaryColorHex:'#2200ff'}};
  assert.deepEqual(deriveVida38HumanoidAnatomy(c),deriveVida38HumanoidAnatomy(recolor));
  const scaled=contract('scaled','SCALES');
  assert.equal(deriveVida38HumanoidAnatomy(scaled).torso.chestHairDensity,0);
  let axillaChecks=0;
  for(const i of [0,1,2,5,11,17,26,48,89,117]) {
    const c=contract(i),a=deriveVida38HumanoidAnatomy(c),t=a.torso;
    const elbowX=a.shoulderWidth*1.03*t.chestScale+t.elbowOutset;
    const elbowY=a.legLength+0.31-(a.upperArmRatio-1)*0.075;
    assert.ok(t.elbowOutset>=0.17);
    assert.ok(evaluateVida38HumanoidField(a,elbowX,elbowY,-0.07)<0,`Codo desconectado ${i}`);
    let gap=false;
    for(let xx=0.28;xx<elbowX-0.075;xx+=0.012){
      if(evaluateVida38HumanoidField(a,xx,elbowY,-0.03)>0.012)gap=true;
    }
    if(gap)axillaChecks++;
    const mesh=buildVida38HumanoidRawMesh(a,'LOW'),audit=auditVida38HumanoidRawMesh(mesh);
    assert.equal(audit.invalid,0,`NaN ${i}`);
    assert.equal(audit.boundaryEdges,0,`abierta ${i}`);
    assert.equal(audit.nonManifoldEdges,0,`no-manifold ${i}`);
    assert.equal(audit.inconsistentEdges,0,`normales ${i}`);
    assert.equal(audit.components,1,`desconectada ${i}`);
    assert.equal(measureVida38HumanoidMeshV1(mesh).actualHeightMeters,c.bodyLengthMeters);
  }
  assert.ok(axillaChecks>=8,`Solo ${axillaChecks}/10 axilas con separación visible`);
  console.log('GENESIS_38_2GE_AUDIT_OK: 160 perfiles, 5 constituciones, densidades de vello, 10 mallas estancas y axilas abiertas');
} finally {
  if(old)require.extensions['.ts']=old;
  else delete require.extensions['.ts'];
}
