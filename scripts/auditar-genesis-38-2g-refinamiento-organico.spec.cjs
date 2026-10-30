#!/usr/bin/env node
'use strict';
/**
 * Auditoría 38.2g: determinismo, topología, métrica VIDA y acoplamiento de
 * shader procedural. No necesita WebGL: el test GPU/Angular se ejecuta aparte.
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
const folder='src/app/presentation/life-species-visual';
const paths=[
  `${folder}/vida38-humanoid-organic-field-38-2e.ts`,
  `${folder}/vida38-humanoid-organic-material-38-2e.ts`,
  `${folder}/vida38-species-visual-preview-scene.ts`,
  `${folder}/vida38-humanoid-refinement-38-2g.spec.ts`,
];
for(const filename of paths) {
  assert.ok(fs.existsSync(filename),`Falta archivo ${filename}`);
  const transpilation=ts.transpileModule(fs.readFileSync(filename,'utf8'),{
    fileName:filename,reportDiagnostics:true,
    compilerOptions:{strict:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true},
  });
  const errors=(transpilation.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,`${filename}: ${errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,'\n')).join('\n')}`);
}
const previousLoader=require.extensions['.ts'];
require.extensions['.ts']=(module,filename)=>{
  const transpilation=ts.transpileModule(fs.readFileSync(filename,'utf8'),{
    fileName:filename,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
  });
  module._compile(transpilation.outputText,filename);
};
try {
  const {deriveVida38HumanoidAnatomy,buildVida38HumanoidRawMesh,
    auditVida38HumanoidRawMesh,measureVida38HumanoidMeshV1,evaluateVida38HumanoidField}=require(path.resolve(paths[0]));
  const make=(speciesId,overrides={})=>({
    speciesId,bodyLengthMeters:1.6126,variantSeedUint32:305419896,
    appearanceFingerprint:'fingerprint-test',
    morphology:{group:'HUMANOIDS',bodyPlan:'BIPED',covering:'LEATHERY',appendagePairs:2},
    ecology:{habitat:'SURFACE_SOIL',nutrition:'OMNIVORE',niche:'SURFACE_SOIL/OMNIVORE'},
    locomotion:'WALKING',
    adaptations:['SENSORY_ORIENTATION','THERMAL_BUFFERING'],
    pigmentation:{primaryColorHex:'#887799',secondaryColorHex:'#bb9977',pattern:'MOTTLED',bioluminescent:false},
    intelligence:null,...overrides,
  });
  const ids=['Kamera ix1','Sania on1','Elvar um3','Lonia aj2','Ivar en8','Amier or5'];
  const variants=[];
  for(const id of ids) {
    const original=make(`vida6:${id}`);
    const a=deriveVida38HumanoidAnatomy(original);
    const b=deriveVida38HumanoidAnatomy(original);
    assert.deepEqual(a,b,`Anatomía no determinista: ${id}`);
    for(const key of ['cheekFullness','chinShape','mouthWidth','nasalBridge','orbitalRidge','stanceBias','shoulderTilt']) {
      assert.ok(Number.isFinite(a[key]),`${id}: ${key}`);
    }
    const raw=buildVida38HumanoidRawMesh(a,'LOW');
    const audit=auditVida38HumanoidRawMesh(raw);
    assert.equal(audit.invalid,0,`${id}: geometría inválida`);
    assert.equal(audit.boundaryEdges,0,`${id}: bordes abiertos`);
    assert.equal(audit.nonManifoldEdges,0,`${id}: no manifold`);
    assert.equal(audit.inconsistentEdges,0,`${id}: caras inconsistentes`);
    assert.equal(audit.components,1,`${id}: superficies desconectadas`);
    const measure=measureVida38HumanoidMeshV1(raw);
    assert.ok(Math.abs(measure.metersPerUnit*measure.heightUnits-original.bodyLengthMeters)<1e-9);
    variants.push(`${a.cheekFullness.toFixed(5)}|${a.stanceBias.toFixed(5)}|${a.chinShape.toFixed(5)}`);
    console.log(`38.2g ${id} ${audit.vertexCount} vértices, ${audit.triangleCount} triángulos, cerrado`);
  }
  assert.equal(new Set(variants).size,6,'Las seis identidades se han homogeneizado');
  const identity=make('vida6:recolor');
  const recolor=make('vida6:recolor',{
    appearanceFingerprint:'new-pigmentation-only',
    pigmentation:{primaryColorHex:'#000000',secondaryColorHex:'#ffffff',pattern:'BANDS',bioluminescent:true},
  });
  const a=deriveVida38HumanoidAnatomy(identity);
  assert.deepEqual(a,deriveVida38HumanoidAnatomy(recolor),'Pigmentos alteraron anatomía');
  const rawA=buildVida38HumanoidRawMesh(a,'LOW');
  const rawB=buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(recolor),'LOW');
  assert.deepEqual(rawA.positions,rawB.positions);
  assert.deepEqual(rawA.indices,rawB.indices);
  const raised={...a,cheekFullness:1.24,chinShape:1.3,nasalBridge:1.31};
  let difference=0;
  for(let x=-.22;x<=.22;x+=.04)for(let y=a.legLength+.95;y<=a.legLength+1.35;y+=.045)for(let z=.15;z<=.43;z+=.04)
    difference+=Math.abs(evaluateVida38HumanoidField(a,x,y,z)-evaluateVida38HumanoidField(raised,x,y,z));
  assert.ok(difference>0.1,'Los rasgos faciales no intervienen realmente en el campo');

  const shader=fs.readFileSync(paths[1],'utf8');
  const scene=fs.readFileSync(paths[2],'utf8');
  for(const fragment of ['vida38Pigment','vida38BiologicalRelief','vVida38OrganicPosition','roughnessFactor=clamp','vida38Worley'])
    assert.ok(shader.includes(fragment),`Shader incompleto: ${fragment}`);
  assert.ok(shader.includes('mat.onBeforeCompile'));
  assert.ok(shader.includes('OCULAR_INTEGRATED'));
  assert.ok(shader.includes("geometry.setAttribute('color',new THREE.BufferAttribute(colors,3))"));
  assert.ok(!shader.includes('new THREE.BufferAttribute(vertexColors,3)'),
    'Se reintrodujo pigmento por vértice en la piel');
  assert.ok(scene.includes("subject.userData['vida38ReconstructionRevision'] = '38.2g'"));
  console.log('GENESIS_38_2G_AUDIT_OK: SDF, seis identidades, pigmentación independiente, mallas cerradas, metrificación VIDA y shader integrado');
} finally {
  if(previousLoader)require.extensions['.ts']=previousLoader;
  else delete require.extensions['.ts'];
}
