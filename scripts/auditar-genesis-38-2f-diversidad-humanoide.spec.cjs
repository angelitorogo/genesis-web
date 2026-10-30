#!/usr/bin/env node
'use strict';
/** Auditoría portable, sin Three/WebGL; requiere TypeScript instalado en proyecto. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const folder='src/app/presentation/life-species-visual';
const targets=[
  `${folder}/vida38-humanoid-morphology-38-2f.ts`,
  `${folder}/vida38-humanoid-organic-field-38-2e.ts`,
  `${folder}/vida38-humanoid-organic-material-38-2e.ts`,
  `${folder}/vida38-humanoid-morphology-38-2f.spec.ts`,
];
for(const file of targets)assert.ok(fs.existsSync(file),`Falta ${file}`);
const original=require.extensions['.ts'];
require.extensions['.ts']=(module,filename)=>{
  const result=ts.transpileModule(fs.readFileSync(filename,'utf8'),{
    fileName:filename,reportDiagnostics:true,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true,experimentalDecorators:true},
  });
  const errors=(result.diagnostics||[]).filter(e=>e.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,'\n')).join('\n'));
  module._compile(result.outputText,filename);
};
try {
  const {
    deriveVida38HumanoidMorphologyV1,VIDA38_HUMANOID_MORPHOLOGY_REVISION,VIDA38_HUMANOID_MORPHOLOGY_LIMITS,
  }=require(path.resolve(targets[0]));
  const {
    deriveVida38HumanoidAnatomy,buildVida38HumanoidRawMesh,auditVida38HumanoidRawMesh,measureVida38HumanoidMeshV1,
  }=require(path.resolve(targets[1]));
  const contract=(id,overrides={})=>({
    speciesId:id,bodyLengthMeters:1.6126,variantSeedUint32:0xabad1dea,appearanceFingerprint:'aabbccdd',
    morphology:{group:'HUMANOIDS',bodyPlan:'BIPED',covering:'LEATHERY',appendagePairs:2},
    ecology:{habitat:'SURFACE_SOIL',nutrition:'OMNIVORE',niche:'SURFACE_SOIL/OMNIVORE'},
    locomotion:'WALKING',adaptations:['THERMAL_BUFFERING','SENSORY_ORIENTATION'],
    pigmentation:{primaryColorHex:'#888888',secondaryColorHex:'#999999',pattern:'MOTTLED'},
    intelligence:null,...overrides,
  });
  const inputs=['Kamera ix1','Sania on1','Elvar um3','Lonia aj2','Ivar en8','Amier or5'].map(n=>contract(`vida6:${n}`));
  const profiles=inputs.map(deriveVida38HumanoidMorphologyV1);
  assert.equal(profiles[0].revision,VIDA38_HUMANOID_MORPHOLOGY_REVISION);
  for(const profile of profiles){
    for(const [key,[min,max]] of Object.entries(VIDA38_HUMANOID_MORPHOLOGY_LIMITS)){
      assert.ok(profile[key]>=min&&profile[key]<=max,`${key}: ${profile[key]}`);
    }
    assert.equal(profile.provenance,'ARTISTIC_SCIENTIFIC_RECONSTRUCTION_NOT_OBSERVED');
    assert.equal(Object.isFrozen(profile),true);
  }
  assert.equal(new Set(profiles.map(p=>p.anatomyFingerprint)).size,inputs.length);
  const colored=contract(inputs[0].speciesId,{
    appearanceFingerprint:'fff00000',variantSeedUint32:0,
    pigmentation:{primaryColorHex:'#113355',secondaryColorHex:'#000000',pattern:'BANDS'},
  });
  assert.deepEqual(deriveVida38HumanoidMorphologyV1(colored),profiles[0]);
  assert.deepEqual(deriveVida38HumanoidMorphologyV1(inputs[0]),profiles[0]);
  const differentShapes=[];
  const ratioSamples=[];
  for(const input of inputs){
    const morphology=deriveVida38HumanoidAnatomy(input);
    const raw=buildVida38HumanoidRawMesh(morphology,'LOW');
    const audit=auditVida38HumanoidRawMesh(raw);
    assert.ok(audit.vertexCount>1500);
    for(const key of ['invalid','boundaryEdges','nonManifoldEdges','inconsistentEdges']){
      assert.equal(audit[key],0,`${input.speciesId}: ${key}=${audit[key]}`);
    }
    assert.equal(audit.components,1,input.speciesId);
    const dims=measureVida38HumanoidMeshV1(raw);
    assert.ok(Number.isFinite(dims.metersPerUnit)&&dims.metersPerUnit>0);
    assert.ok(Math.abs(dims.metersPerUnit*dims.heightUnits-input.bodyLengthMeters)<1e-8);
    differentShapes.push(morphology.headWidth.toFixed(5)+'|'+morphology.shoulderWidth.toFixed(5)+'|'+dims.widthToHeight.toFixed(5));
    ratioSamples.push(dims.widthToHeight);
    console.log(`${input.speciesId} ${audit.vertexCount}v ${audit.triangleCount}t ratio ${dims.widthToHeight.toFixed(3)} cabeza ${morphology.headWidth.toFixed(3)} brazos ${morphology.armReach.toFixed(3)}`);
  }
  assert.ok(new Set(differentShapes).size>=5,'No hay diversidad anatómica');
  assert.ok(Math.max(...ratioSamples)-Math.min(...ratioSamples)>0.015,'Las siluetas difieren muy poco');
  const originalRaw=buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(inputs[0]),'LOW');
  const recoloredRaw=buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(colored),'LOW');
  assert.deepEqual(originalRaw.positions,recoloredRaw.positions);
  assert.deepEqual(originalRaw.indices,recoloredRaw.indices);
  console.log('VIDA38_2F_MORPHOLOGY_AUDIT_OK: determinismo, identidad cromática independiente, 6 siluetas, mallas cerradas, metros VIDA');
} finally {
  if(original)require.extensions['.ts']=original;
  else delete require.extensions['.ts'];
}
