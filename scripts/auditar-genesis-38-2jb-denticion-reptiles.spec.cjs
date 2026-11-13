#!/usr/bin/env node
/** Auditoría CPU 38.2j.b: dentición implantada en superficie, sin Three.js. */
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
const root='../src/app/presentation/life-species-visual/';
const {VIDA38_REPTILE_ARCHETYPES,deriveVida38ReptileMorphology38J}=require(root+'vida38-reptile-morphology-38-2j.ts');
const {deriveVida38ReptileJaw38JB,findVida38ReptileOuterJawX38JB}=require(root+'vida38-reptile-dentition-38-2jb.ts');
const {evaluateVida38ReptileField38J,buildVida38ReptileRawMesh38J,auditVida38ReptileRawMesh38J}=require(root+'vida38-reptile-organic-field-38-2j.ts');
const c=(name,nutrition)=>({speciesId:name,variantSeedUint32:0x72ad9270,
  morphology:{group:'REPTILES',bodyPlan:'TETRAPOD',covering:'SCALES'},
  ecology:{habitat:'SURFACE_OPEN_TERRAIN',niche:`SURFACE_OPEN_TERRAIN/${nutrition}`,nutrition},
  locomotion:'WALKING',adaptations:['RESOURCE_FORAGING'],bodyLengthMeters:1.74,
  pigmentation:{primaryColorHex:'#987977',secondaryColorHex:'#5a7870'},
});
let inspected=0,teeth=0,hidden=0,subtle=0,predators=0;
for(const diet of ['PREDATOR','OMNIVORE','HERBIVORE']){
  for(const kind of VIDA38_REPTILE_ARCHETYPES){
    const m=deriveVida38ReptileMorphology38J(c(`reptile:38.2jb:${diet}:${kind}`,diet),kind);
    const jaw=deriveVida38ReptileJaw38JB(m,diet);
    assert.deepEqual(jaw,deriveVida38ReptileJaw38JB(m,diet),'reproducibilidad '+kind);
    assert.ok(jaw.seam.every(side=>side.length>=10),'mordida sin superficie '+kind);
    if(jaw.exposure==='HIDDEN')hidden++;
    if(jaw.exposure==='SUBTLE')subtle++;
    if(diet==='PREDATOR'){
      predators++;
      assert.ok(jaw.teeth.some(t=>t.row==='UPPER')&&jaw.teeth.some(t=>t.row==='LOWER'));
    }
    for(const tooth of jaw.teeth){
      const [x,y,z]=tooth.base;
      const outerX=findVida38ReptileOuterJawX38JB(m,y,z);
      assert.ok(outerX!==null&&Math.abs(Math.abs(x)-outerX)<.017*m.headSize,'raíz separada del cráneo');
      assert.ok(evaluateVida38ReptileField38J(m,...tooth.tip)>.00001,'punta enterrada');
      assert.ok(tooth.exposedLength>.012,'diente invisible');
      teeth++;
    }
    inspected++;
  }
}
assert.ok(hidden>0&&subtle>0);
for(const kind of VIDA38_REPTILE_ARCHETYPES){
  const m=deriveVida38ReptileMorphology38J(c('reptile:topology:'+kind,'PREDATOR'),kind);
  const mesh=buildVida38ReptileRawMesh38J(m,'LOW');
  const audit=auditVida38ReptileRawMesh38J(mesh);
  assert.equal(audit.invalid,0,kind);assert.equal(audit.boundaryEdges,0,kind);
  assert.equal(audit.nonManifoldEdges,0,kind);assert.equal(audit.components,1,kind);
}
console.log(`GENESIS_38_2JB_AUDIT_OK: perfiles=${inspected}; dientes=${teeth}; depredadores=${predators}; discretos=${subtle}; ocultos=${hidden}; mallas=9`);
