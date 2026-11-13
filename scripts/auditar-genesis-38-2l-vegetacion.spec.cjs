'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let ts;try{ts=require('typescript');}catch{ts=require(path.join(require('node:child_process').execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript'));}
require.extensions['.ts']=(mod,filename)=>mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const base=path.join(__dirname,'../src/app/presentation/life-species-visual');
const {deriveVida38PlantMorphology38L,VIDA38_PLANT_ARCHETYPES}=require(path.join(base,'vida38-plant-morphology-38-2l.ts'));
const {buildVida38PlantArchitecture38L}=require(path.join(base,'vida38-plant-architecture-38-2l.ts'));
const contract=(id,height,cover='FIBROUS')=>({speciesId:id,variantSeedUint32:276891,
 morphology:{group:'PLANTS_TREES',bodyPlan:'STEMMED',covering:cover,appendagePairs:0},
 ecology:{habitat:'SURFACE_WET_MARGIN',nutrition:'PHOTOSYNTHETIC',niche:'WET_MARGIN/PHOTOSYNTHETIC'},
 locomotion:'SESSILE',bodyLengthMeters:height,adaptations:['HUMIDITY_TOLERANCE'],
 pigmentation:{primaryColorHex:'#689c79',secondaryColorHex:'#c9ae94',pattern:'SOLID',bioluminescent:false}});
let inspected=0,leaves=0,stems=0;const found=new Set();
for(let i=0;i<600;i++){
 const c=contract('vegetal:'+i,[.4,.8,1.4,1.8,2,2.01,3.2142,14][i%8]);
 const m=deriveVida38PlantMorphology38L(c);found.add(m.archetype);
 assert.deepEqual(m,deriveVida38PlantMorphology38L(c));
 assert.equal(m.sourceHeightMeters,c.bodyLengthMeters);
 assert.equal(m.form,c.bodyLengthMeters<=1?'HERB':c.bodyLengthMeters<=2?'SHRUB':'TREE');
 const other={...c,pigmentation:{...c.pigmentation,primaryColorHex:'#123456'}};
 assert.deepEqual(m,deriveVida38PlantMorphology38L(other));
 if(i%7!==0)continue;
 const model=buildVida38PlantArchitecture38L(m);
 assert.ok(model.stems.length>0&&model.leaves.length>0);
 for(const l of model.leaves){assert.ok(l.branchIndex>=0&&l.branchIndex<model.stems.length);assert.ok(l.size>0);assert.ok(l.direction.every(Number.isFinite));}
 for(const f of model.flowers)assert.ok(model.leaves.includes(f));
 inspected++;leaves+=model.leaves.length;stems+=model.stems.length;
}
assert.equal(found.size,VIDA38_PLANT_ARCHETYPES.length,'los 19 arquetipos deben aparecer');
const preview=fs.readFileSync(path.join(base,'vida38-species-visual-preview-scene.ts'),'utf8');
assert.match(preview,/createVida38PlantPreview38L\(subject, contract/);
assert.doesNotMatch(preview,/function createPlant\(/);
console.log(`GENESIS_38_2L_AUDIT_OK perfiles=600 arquetipos=${found.size} arquitecturas=${inspected} ramas=${stems} hojas_ancladas=${leaves}`);
