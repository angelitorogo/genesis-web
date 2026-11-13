#!/usr/bin/env node
'use strict';
/** Auditoría real de 11 arquetipos SDF y determinismo de VIDA.38.2h. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const folder=path.join(__dirname,'../src/app/presentation/life-species-visual');
const prev=require.extensions['.ts'];
require.extensions['.ts']=(mod,file)=>{
  const result=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  assert.equal((result.diagnostics||[]).filter(e=>e.category===ts.DiagnosticCategory.Error).length,0,file);
  mod._compile(result.outputText,file);
};
try{
 const {deriveVida38MammalMorphologyV1,VIDA38_MAMMAL_ARCHETYPES}=require(path.join(folder,'vida38-mammal-morphology-38-2h.ts'));
 const {buildVida38MammalRawMeshV1,auditVida38MammalRawMeshV1}=require(path.join(folder,'vida38-mammal-organic-field-38-2h.ts'));
 const specimen=(name)=>({
   speciesId:'vida6:audit:'+name,variantSeedUint32:134265,bodyLengthMeters:1.8,
   morphology:{group:'MAMMALS',bodyPlan:'TETRAPOD',covering:'FUR',appendagePairs:2},
   ecology:{habitat:'SURFACE_OPEN_TERRAIN',nutrition:'OMNIVORE',niche:'SURFACE_OPEN_TERRAIN/OMNIVORE'},
   locomotion:'WALKING',adaptations:['RESOURCE_FORAGING'],
   pigmentation:{primaryColorHex:'#baa68d',secondaryColorHex:'#506b79',pattern:'MOTTLED',bioluminescent:false},
 });
 const results=[];
 for(const kind of VIDA38_MAMMAL_ARCHETYPES){
   const contract=specimen(kind);
   const profile=deriveVida38MammalMorphologyV1(contract,kind);
   assert.deepEqual(profile,deriveVida38MammalMorphologyV1(contract,kind));
   const mesh=buildVida38MammalRawMeshV1(profile,'LOW');
   const audit=auditVida38MammalRawMeshV1(mesh);
   assert.ok(audit.triangleCount>400,`${kind} insufficient triangles`);
   assert.equal(audit.invalid,0,`${kind} invalid`);
   assert.equal(audit.boundaryEdges,0,`${kind} boundary`);
   assert.equal(audit.nonManifoldEdges,0,`${kind} manifold`);
   assert.equal(audit.inconsistentEdges,0,`${kind} orientation`);
   assert.equal(audit.components,1,`${kind} components`);
   results.push({kind,triangles:audit.triangleCount,vertices:audit.vertexCount,profile:profile.fingerprint});
 }
 const colored=specimen('chromatic');
 const first=deriveVida38MammalMorphologyV1(colored);
 const recolored={...colored,pigmentation:{...colored.pigmentation,primaryColorHex:'#ffffff',secondaryColorHex:'#003344'}};
 assert.deepEqual(first,deriveVida38MammalMorphologyV1(recolored));
 assert.equal(new Set(results.map(r=>r.kind)).size,11);
 console.log('GENESIS_38_2H_AUDIT_OK',JSON.stringify(results));
} finally{if(prev)require.extensions['.ts']=prev;else delete require.extensions['.ts'];}
