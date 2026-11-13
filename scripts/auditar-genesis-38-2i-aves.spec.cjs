#!/usr/bin/env node
'use strict';
/** Auditoría CPU autónoma de perfiles y geometría aviar. No requiere Three.js. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
let ts;try{ts=require('typescript');}catch{try{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');}catch{throw new Error('Instala dependencias del proyecto: TypeScript no disponible');}}
const moduleFile='src/app/presentation/life-species-visual/vida38-bird-morphology-38-2i.ts';
const fieldFile='src/app/presentation/life-species-visual/vida38-bird-organic-field-38-2i.ts';
const materialFile='src/app/presentation/life-species-visual/vida38-bird-materials-38-2i.ts';
const integrationFile='src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts';
for(const file of [moduleFile,fieldFile,materialFile,'src/app/presentation/life-species-visual/vida38-bird-preview-38-2i.ts',integrationFile]){
  const content=fs.readFileSync(file,'utf8');
  const compile=ts.transpileModule(content,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  assert.equal((compile.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0,file);
}
const previous=require.extensions['.ts'];
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),
  {fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,file);
try {
  const {deriveVida38BirdMorphology38I,VIDA38_BIRD_ARCHETYPES}=require(`${process.cwd()}/${moduleFile}`);
  const {buildVida38BirdRawMeshV1,auditVida38BirdRawMeshV1}=require(`${process.cwd()}/${fieldFile}`);
  const c={speciesId:'bird',speciesName:'bird',variantSeedUint32:34815,
    morphology:{group:'BIRDS',bodyPlan:'WINGED',covering:'FEATHERS',appendagePairs:2},
    ecology:{habitat:'SURFACE_AIR',nutrition:'OMNIVORE',niche:'SURFACE_AIR/OMNIVORE'},
    locomotion:'FLYING',bodyLengthMeters:.854,pigmentation:{primaryColorHex:'#999999',secondaryColorHex:'#444444',pattern:'SOLID'},adaptations:['AERIAL_STABILITY']};
  const seen=new Set();let triangles=0;
  for(const archetype of VIDA38_BIRD_ARCHETYPES){
    const profile=deriveVida38BirdMorphology38I({...c,speciesId:`bird:${archetype}`},archetype);
    assert.deepEqual(profile,deriveVida38BirdMorphology38I({...c,speciesId:`bird:${archetype}`},archetype));
    const raw=buildVida38BirdRawMeshV1(profile,'LOW');
    const audit=auditVida38BirdRawMeshV1(raw);
    assert.equal(audit.invalid,0,`Invalid coordinates ${archetype}`);
    assert.equal(audit.boundaryEdges,0,`Open edges ${archetype}`);
    assert.equal(audit.nonManifoldEdges,0,`Non manifold ${archetype}`);
    assert.equal(audit.inconsistentEdges,0,`Winding ${archetype}`);
    assert.equal(audit.components,1,`Disconnected parts ${archetype}`);
    const signature=[profile.bodyDepth,profile.legLength,profile.neckLength,
      profile.billLength,profile.wingSpan,profile.tailLength].map(x=>x.toFixed(3)).join(':');
    assert.ok(!seen.has(signature),`Duplicate silhouette ${archetype}`);seen.add(signature);
    assert.equal(profile.sourceLengthMeters,c.bodyLengthMeters);
    triangles+=audit.triangleCount;
  }
  const baseline=deriveVida38BirdMorphology38I(c);
  const recolored=deriveVida38BirdMorphology38I({...c,pigmentation:{...c.pigmentation,primaryColorHex:'#ffffff',secondaryColorHex:'#111111'}});
  assert.deepEqual(baseline,recolored);
  const material=fs.readFileSync(materialFile,'utf8');
  assert.ok(material.includes('fwidth'));assert.ok(!material.includes('gl_FragCoord'));
  const integration=fs.readFileSync(integrationFile,'utf8');
  assert.ok(integration.includes('createVida38BirdPreview38I'));
  assert.ok(integration.includes('restingHeight + Math.sin'));
  console.log(`GENESIS_38_2I_AUDIT_OK | arquetipos=${seen.size} | triangulos=${triangles} | mallas cerradas/conexas`);
} finally {
  if(previous)require.extensions['.ts']=previous;else delete require.extensions['.ts'];
}
