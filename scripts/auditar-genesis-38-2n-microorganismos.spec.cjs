'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
let ts;
try { ts=require('typescript'); }
catch { ts=require(path.join(require('node:child_process').execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript')); }
require.extensions['.ts']=(module, filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,filename);
const base=path.join(__dirname,'../src/app/presentation/life-species-visual');
const {deriveVida38MicrobialMorphology38N,VIDA38_MICROBIAL_FORMS_38N,VIDA38_MICROBIAL_LABELS_38N}=require(path.join(base,'vida38-microbial-morphology-38-2n.ts'));
const make=(id,metres)=>({
  speciesId:id,variantSeedUint32:382001,appearanceFingerprint:`digest:${id}`,
  morphology:{group:'MICROORGANISMS',bodyPlan:'FILAMENTOUS',covering:'MEMBRANE'},
  ecology:{habitat:'SURFACE_WET_MARGIN',nutrition:'DECOMPOSER'},
  bodyLengthMeters:metres,pigmentation:{primaryColorHex:'#aa6677',secondaryColorHex:'#4477bb',bioluminescent:false},
});
const found=new Map(),count=new Map();
for(let i=0;i<800;i++){
  const c=make(`microbial-species:${i}`,i%2===0 ? .000003 : .000085);
  const m=deriveVida38MicrobialMorphology38N(c);
  assert.deepEqual(m,deriveVida38MicrobialMorphology38N(c));
  assert.equal(m.sourceLengthMeters,c.bodyLengthMeters);
  assert.equal(m.provenance,'ARTISTIC_HYPOTHESIS_NOT_OBSERVED');
  assert.deepEqual(m,deriveVida38MicrobialMorphology38N({...c,pigmentation:{...c.pigmentation,primaryColorHex:'#fedcba',secondaryColorHex:'#123456'}}));
  found.set(m.form,c.speciesId); count.set(m.form,(count.get(m.form)||0)+1);
}
assert.equal(found.size,10);assert.equal(VIDA38_MICROBIAL_FORMS_38N.length,10);
for(const kind of VIDA38_MICROBIAL_FORMS_38N){assert.ok(count.get(kind)>45,`forma demasiado rara ${kind}`);assert.ok(VIDA38_MICROBIAL_LABELS_38N[kind]);}
const scene=fs.readFileSync(path.join(base,'vida38-species-visual-preview-scene.ts'),'utf8');
const preview=fs.readFileSync(path.join(base,'vida38-microbial-preview-38-2n.ts'),'utf8');
const ui=fs.readFileSync(path.join(base,'life-species-visual-preview.ts'),'utf8');
assert.match(scene,/createVida38MicrobialPreview38N\(subject, contract/);
assert.doesNotMatch(scene,/function createMicrobialColony\(/);
assert.doesNotMatch(scene,/VIDA38_CANOPY_DECORATIVE_REFERENCE_BRANCH/);
assert.doesNotMatch(scene,/new THREE\.DodecahedronGeometry/);
assert.match(scene,/descriptor\.habitatCue === 'SUBSURFACE_WATER' && descriptor\.family !== 'MICROBIAL_COLONY'/);
assert.match(preview,/case 'COCCOID_AGGREGATE'/);
assert.match(preview,/case 'RADIOLARIAN'/);
assert.doesNotMatch(preview,/Math\.random\(/);
assert.match(preview,/VIDA38_2N_MICROBIAL_ARCHITECTURE/);
assert.match(ui,/microbialGrowthLabel\(\)/);
console.log('GENESIS_38_2N_AUDIT_OK: 800 perfiles | 10 morfotipos | CT-0 cromático | sin burbuja/palos/piedras');
console.log(Object.fromEntries([...count.entries()].sort((a,b)=>a[0].localeCompare(b[0]))));
