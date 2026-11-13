#!/usr/bin/env node
/** Auditoría independiente de Three.js/Angular para GENESIS 38.2j. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,filename)=>{
  const text=fs.readFileSync(filename,'utf8');
  const result=ts.transpileModule(text,{fileName:filename,reportDiagnostics:true,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
  assert.equal(result.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length||0,0,filename);
  module._compile(result.outputText,filename);
};
const {
  VIDA38_REPTILE_ARCHETYPES,deriveVida38ReptileMorphology38J,
}=require('../src/app/presentation/life-species-visual/vida38-reptile-morphology-38-2j.ts');
const {
  buildVida38ReptileRawMesh38J,auditVida38ReptileRawMesh38J,
}=require('../src/app/presentation/life-species-visual/vida38-reptile-organic-field-38-2j.ts');
const contract=(speciesId,nutrition='PREDATOR')=>({
  speciesId,variantSeedUint32:0x6215af12,
  morphology:{group:'REPTILES',bodyPlan:'TETRAPOD',covering:'SCALES'},
  ecology:{habitat:'SURFACE_OPEN_TERRAIN',niche:`SURFACE_OPEN_TERRAIN/${nutrition}`,nutrition},
  locomotion:'WALKING',adaptations:['SENSORY_ORIENTATION'],bodyLengthMeters:1.53,
  pigmentation:{primaryColorHex:'#8b7766',secondaryColorHex:'#4c6b60'},
});
assert.equal(VIDA38_REPTILE_ARCHETYPES.length,9);
const silhouettes=new Set();
let triangles=0;
for(const kind of VIDA38_REPTILE_ARCHETYPES){
  const c=contract(`reptile:audit:${kind}`);
  const p=deriveVida38ReptileMorphology38J(c,kind);
  const q=deriveVida38ReptileMorphology38J(c,kind);
  assert.deepEqual(p,q,'Determinismo '+kind);
  const b=deriveVida38ReptileMorphology38J({...c,pigmentation:{primaryColorHex:'#ffffff',secondaryColorHex:'#222222'}},kind);
  assert.deepEqual(p,b,'La pigmentación no cambia anatomía '+kind);
  const key=[p.bodyLength,p.bodyDepth,p.headSize,p.snoutLength,p.legLength,p.tailLength].map(x=>x.toFixed(4)).join('|');
  silhouettes.add(key);
  const mesh=buildVida38ReptileRawMesh38J(p,'LOW');
  const audit=auditVida38ReptileRawMesh38J(mesh);
  assert.equal(audit.invalid,0,kind+' invalid');
  assert.equal(audit.boundaryEdges,0,kind+' open');
  assert.equal(audit.nonManifoldEdges,0,kind+' nonmanifold');
  assert.equal(audit.inconsistentEdges,0,kind+' orientation');
  assert.equal(audit.components,1,kind+' disconnected');
  triangles+=audit.triangleCount;
  console.log(`${kind}: ${audit.triangleCount} triángulos / topología correcta`);
}
assert.equal(silhouettes.size,9);
const variation=new Set();
for(let i=0;i<180;i++){
  const p=deriveVida38ReptileMorphology38J(contract(`reptile:distribution:${i}`));
  variation.add(p.archetype);
  assert.ok(p.tailLength>0 && p.legLength>0 && p.snoutLength>0);
}
assert.equal(variation.size,9);
console.log(`GENESIS_38_2J_AUDIT_OK: arquetipos=9 mallas=9 triángulos=${triangles} variantes=180`);
