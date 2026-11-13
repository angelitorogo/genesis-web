#!/usr/bin/env node
'use strict';
/** GENESIS 38.2i.a.2b — auditoría craneofacial aviar con SDF real. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
let ts;
try{ts=require('typescript');}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');}
const root='src/app/presentation/life-species-visual';
for(const name of [
  'vida38-bird-organic-field-38-2i.ts',
  'vida38-bird-preview-38-2i.ts',
  'vida38-bird-materials-38-2i.ts',
  'vida38-bird-face-visibility-38-2ia2b.spec.ts',
]){
  const file=`${root}/${name}`;
  assert.ok(fs.existsSync(file),`Falta ${file}`);
  const r=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  assert.equal((r.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0,`Error de sintaxis ${file}`);
}
const previous=require.extensions['.ts'];
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
}).outputText,file);
try{
  const {deriveVida38BirdMorphology38I,VIDA38_BIRD_ARCHETYPES}=require(`${process.cwd()}/${root}/vida38-bird-morphology-38-2i.ts`);
  const {
    VIDA38_BIRD_MESH_REVISION,
    deriveVida38BirdLandmarks38I,
    deriveVida38BirdEyeSurface38IA2,
    isVida38BirdProtectedFace38IA2,
    evaluateVida38BirdField38I,
    buildVida38BirdRawMeshV1,
    auditVida38BirdRawMeshV1,
  }=require(`${process.cwd()}/${root}/vida38-bird-organic-field-38-2i.ts`);
  assert.ok(VIDA38_BIRD_MESH_REVISION.includes('38.2i.a.2b'));
  let minProjection=Infinity,minIrisExterior=Infinity,maxResidual=0;
  for(let i=0;i<600;i++){
    const habitats=['SURFACE_AIR','SURFACE_OPEN_TERRAIN','SURFACE_WET_MARGIN','SURFACE_SOIL'];
    const diets=['OMNIVORE','PREDATOR','HERBIVORE'];
    const c={speciesId:`GENESIS:bird:face:${i}`,variantSeedUint32:(0x24b17231+i*431)>>>0,
      morphology:{group:'BIRDS',bodyPlan:'WINGED',covering:'FEATHERS',appendagePairs:2},
      ecology:{habitat:habitats[i%4],nutrition:diets[i%3],niche:'SURFACE'},
      locomotion:i%3===0?'FLYING':'WALKING',bodyLengthMeters:.65+(i%8)*.18,
      pigmentation:{primaryColorHex:'#8c735b',secondaryColorHex:'#3c776b',pattern:'MOTTLED'},adaptations:[]};
    const m=deriveVida38BirdMorphology38I(c);
    const a=deriveVida38BirdLandmarks38I(m);
    const clearance=a.billTipZ-(a.headZ+a.headRadius*1.12);
    minProjection=Math.min(minProjection,clearance);
    assert.ok(clearance>=.145*m.headSize-1e-9,`Pico oculto en ${i}: ${clearance}`);
    for(const side of [-1,1]){
      const eye=deriveVida38BirdEyeSurface38IA2(m,side);
      const d=evaluateVida38BirdField38I(m,...eye.irisCenter);
      minIrisExterior=Math.min(minIrisExterior,d);
      maxResidual=Math.max(maxResidual,Math.abs(eye.surfaceResidual));
      assert.ok(Math.abs(eye.surfaceResidual)<1e-5,`Ojo no anclado a SDF en ${i}`);
      assert.ok(d>0,`Iris enterrado en ${i}, lado ${side}: ${d}`);
      assert.ok(isVida38BirdProtectedFace38IA2(m,...eye.surface),`Plumaje podría tapar el ojo ${i}`);
    }
  }
  for(const archetype of VIDA38_BIRD_ARCHETYPES){
    const c={speciesId:`GENESIS:bird:mesh:face:${archetype}`,variantSeedUint32:0x48b17232,
      morphology:{group:'BIRDS',bodyPlan:'WINGED',covering:'FEATHERS',appendagePairs:2},
      ecology:{habitat:'SURFACE_AIR',nutrition:'OMNIVORE',niche:'SURFACE_AIR/OMNIVORE'},
      locomotion:'FLYING',bodyLengthMeters:.92,
      pigmentation:{primaryColorHex:'#998877',secondaryColorHex:'#556677',pattern:'MOTTLED'},adaptations:[]};
    const m=deriveVida38BirdMorphology38I(c,archetype);
    const a=deriveVida38BirdLandmarks38I(m);
    const mesh=buildVida38BirdRawMeshV1(m,'LOW');
    const topology=auditVida38BirdRawMeshV1(mesh);
    for(const k of ['invalid','boundaryEdges','nonManifoldEdges','inconsistentEdges'])
      assert.equal(topology[k],0,`${archetype}: ${k}`);
    assert.equal(topology.components,1,`${archetype}: desconectada`);
    let maxFacialZ=-Infinity;
    for(let j=0;j<mesh.positions.length;j+=3){
      const x=mesh.positions[j],y=mesh.positions[j+1],z=mesh.positions[j+2];
      if(Math.abs(x)<.24*m.headSize && Math.abs(y-(a.headY-.10*m.headSize))<.22*m.headSize)
        maxFacialZ=Math.max(maxFacialZ,z);
    }
    assert.ok(maxFacialZ>a.headZ+a.headRadius*1.12+.065*m.headSize,`${archetype}: pico sin volumen visible en la malla LOW`);
  }
  const preview=fs.readFileSync(`${root}/vida38-bird-preview-38-2i.ts`,'utf8');
  const material=fs.readFileSync(`${root}/vida38-bird-materials-38-2i.ts`,'utf8');
  assert.ok(preview.includes('deriveVida38BirdEyeSurface38IA2') && preview.includes('anchor.irisCenter'));
  assert.ok(preview.includes('VIDA38_BIRD_MESH_REVISION'));
  assert.ok(material.includes('isVida38BirdProtectedFace38IA2'));
  console.log(`GENESIS_38_2IA2B_FACE_OK | perfiles=600 | arquetipos=${VIDA38_BIRD_ARCHETYPES.length} | `+
    `proyeccion_min=${minProjection.toFixed(4)} | iris_exterior_min=${minIrisExterior.toFixed(4)} | `+
    `residuo_SDF_max=${maxResidual.toExponential(2)} | mallas cerradas`);
}finally{
  if(previous)require.extensions['.ts']=previous;else delete require.extensions['.ts'];
}
