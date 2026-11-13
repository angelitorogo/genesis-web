'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let ts;try{ts=require('typescript');}catch{ts=require(path.join(require('node:child_process').execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript'));}
const base=path.join(__dirname,'../src/app/presentation/life-species-visual');
function transpile(name){
 const filename=path.join(base,name),source=fs.readFileSync(filename,'utf8');
 const result=ts.transpileModule(source,{fileName:filename,reportDiagnostics:true,
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const errors=(result.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error);
 assert.equal(errors.length,0,`${name}: ${ts.formatDiagnosticsWithColorAndContext(errors,{getCanonicalFileName:x=>x,getCurrentDirectory:()=>process.cwd(),getNewLine:()=>"\n"})}`);
 return {source,output:result.outputText};
}
const scripts=['vida38-fungi-morphology-38-2m.ts','vida38-fungi-preview-38-2m.ts',
'vida38-species-visual-preview-scene.ts','life-species-visual-preview.ts','vida38-fungi-38-2m.spec.ts'];
for (const filename of scripts) transpile(filename);
const source=transpile(scripts[0]).output;
const mod={exports:{}};new Function('module','exports',source)(mod,mod.exports);
const {deriveVida38FungalMorphology38M:derive,VIDA38_FUNGAL_FORMS_38M:forms}=mod.exports;
const fungi=(id)=>({speciesId:id,variantSeedUint32:128373,appearanceFingerprint:'audit',bodyLengthMeters:1.72,
 morphology:{group:'FUNGI',bodyPlan:'FILAMENTOUS',covering:'FIBROUS'},
 ecology:{habitat:'SURFACE_WET_MARGIN'},pigmentation:{primaryColorHex:'#a07385',secondaryColorHex:'#a2c4b1'}});
const samples=new Map();
for(let i=0;i<800;i++){
 const c=fungi(`ct0:fungus:${i}`),m=derive(c);
 assert.deepEqual(m,derive(c));
 assert.deepEqual(m,derive({...c,pigmentation:{primaryColorHex:'#ffffff',secondaryColorHex:'#000000'}}));
 assert.ok(Number.isFinite(m.widthFactor) && Number.isFinite(m.heightFactor));
 assert.equal(m.provenance,'ARTISTIC_HYPOTHESIS_NOT_OBSERVED');
 samples.set(m.form,(samples.get(m.form)||0)+1);
}
assert.equal(samples.size,8);
assert.deepEqual([...forms].sort(),[...samples.keys()].sort());
const scene=transpile('vida38-species-visual-preview-scene.ts').source;
assert.match(scene,/createVida38FungalPreview38M\(subject, contract, options\.humanoidQuality \?\? 'HIGH'\)/);
assert.doesNotMatch(scene,/function createFungalCluster\(/);
assert.match(scene,/descriptor\.family !== 'FUNGAL_CLUSTER'/);
const render=transpile('vida38-fungi-preview-38-2m.ts').source;
for(const form of ['AGARICOID','BOLETOID','BRACKET','CORAL','GASTEROID','CUP','GELATINOUS','ROSETTE'])
 assert.match(render,new RegExp(`case '${form}'`));
assert.doesNotMatch(render,/Math\.random\(/);
console.log(`GENESIS_38_2M_AUDIT_OK: 800 perfiles, ${samples.size} familias, sintaxis TS verificada, integración aislada. Distribución: ${JSON.stringify(Object.fromEntries(samples))}`);
