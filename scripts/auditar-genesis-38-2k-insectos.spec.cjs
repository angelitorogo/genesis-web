'use strict';
/** Auditoría CPU portable de 38.2k, sin Three.js ni Angular. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let ts;
try{ts=require('typescript');}catch{ts=require(path.join(require('node:child_process').execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript'));}
require.extensions['.ts']=(mod,filename)=>{
  const source=fs.readFileSync(filename,'utf8');
  const result=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  mod._compile(result.outputText,filename);
};
const folder=path.join(__dirname,'../src/app/presentation/life-species-visual');
const morphology=require(path.join(folder,'vida38-insect-morphology-38-2k.ts'));
const field=require(path.join(folder,'vida38-insect-organic-field-38-2k.ts'));
const c=(id,locomotion='WALKING',pairs=3)=>({
  speciesId:id,variantSeedUint32:0xa6146a9b,morphology:{group:'INSECTS',bodyPlan:'ARTHROPOD',covering:'CHITINOUS',appendagePairs:pairs},
  ecology:{habitat:'SURFACE_CANOPY',nutrition:'OMNIVORE',niche:'SURFACE_CANOPY/OMNIVORE'},locomotion,
  adaptations:['SENSORY_ORIENTATION'],bodyLengthMeters:.0804,pigmentation:{primaryColorHex:'#88aa99',secondaryColorHex:'#a7b5c1',pattern:'MOTTLED',bioluminescent:false},
});
const found=new Set();let totalTriangles=0;
for(let i=0;i<250;i++){
  const sample=c('genesis:insect:'+i,i%3===0?'FLYING':'WALKING',i%7===0?4:3);
  const a=morphology.deriveVida38InsectMorphology38K(sample);
  const b=morphology.deriveVida38InsectMorphology38K(sample);
  assert.deepEqual(a,b);assert.equal(a.sourceLengthMeters,sample.bodyLengthMeters);
  assert.equal(a.legPairs,sample.morphology.appendagePairs);
  if(sample.locomotion==='WALKING')assert.equal(a.wingPairs,0);
  found.add(a.archetype);
}
assert.equal(found.size,10,'los diez arquetipos deben aparecer en 250 identidades');
for(const kind of morphology.VIDA38_INSECT_ARCHETYPES){
  const profile=morphology.deriveVida38InsectMorphology38K(c('gallery:'+kind,'FLYING'),kind);
  const raw=field.buildVida38InsectRawMesh38K(profile,'LOW');
  const audit=field.auditVida38InsectRawMesh38K(raw);
  assert.equal(audit.invalid,0,kind);
  assert.equal(audit.boundaryEdges,0,kind);
  assert.equal(audit.nonManifoldEdges,0,kind);
  assert.equal(audit.inconsistentEdges,0,kind);
  assert.equal(audit.components,1,kind);
  totalTriangles+=audit.triangleCount;
}
const original=c('color-invariant');
const recolored={...original,pigmentation:{...original.pigmentation,primaryColorHex:'#ffffff'}};
assert.deepEqual(morphology.deriveVida38InsectMorphology38K(original),morphology.deriveVida38InsectMorphology38K(recolored));
const src=fs.readFileSync(path.join(folder,'vida38-species-visual-preview-scene.ts'),'utf8');
assert.match(src,/createVida38InsectPreview38K\(subject, contract/);
assert.match(src,/restingHeight \+ Math\.sin\(elapsedSeconds \* 1\.1\) \* 0\.017/);
const shader=fs.readFileSync(path.join(folder,'vida38-insect-materials-38-2k.ts'),'utf8');
assert.match(shader,/transparent:false,opacity:1,alphaTest:0/);
assert.match(shader,/fwidth\(value\)/);
assert.doesNotMatch(shader,/gl_FragCoord|uTime/);
console.log('GENESIS_38_2K_AUDIT_OK');
console.log('perfiles=250 arquetipos='+found.size+' triangulos_LOW='+totalTriangles+' mallas_cerradas=10/10');
