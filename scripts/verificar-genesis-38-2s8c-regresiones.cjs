#!/usr/bin/env node
/**
 * GENESIS 38.2s8c — ejecución secuencial, reproducible y con logs COMPLETOS.
 * No modifica src/, no relaja los tests, no altera package.json.
 *
 * Grupos: --group=reconciled|pending|timeouts|orbital|all|full
 * Los tiempos de ejecución se miden en la máquina que ejecuta el script.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=process.cwd();
const out=path.join(root,'docs','audits','38-2s8c','runs');
fs.mkdirSync(out,{recursive:true});
const suites=[
  {
    "file": "src/app/presentation/galaxy-map/galactic-map-particle-layout.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 3
  },
  {
    "file": "src/app/presentation/laboratory/galactic-objects/galactic-object-laboratory.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s4.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s7.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s8.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-bird-face-visibility-38-2ia2b.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-birds-38-2i.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-birds-refinement-38-2ia.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-insectoid-38-2q1a.spec.ts",
    "types": [
      "assertion"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2o.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od2.spec.ts",
    "types": [
      "assertion"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od3.spec.ts",
    "types": [
      "assertion"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od5.spec.ts",
    "types": [
      "assertion",
      "timeout"
    ],
    "failures": 2
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe.spec.ts",
    "types": [
      "assertion",
      "timeout"
    ],
    "failures": 2
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe2.spec.ts",
    "types": [
      "assertion"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe4.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe6.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe6a.spec.ts",
    "types": [
      "assertion"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe7.spec.ts",
    "types": [
      "execution"
    ],
    "failures": 2
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe7b.spec.ts",
    "types": [
      "assertion"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe7c.spec.ts",
    "types": [
      "assertion"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe8.spec.ts",
    "types": [
      "assertion"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-humanoid-morphology-38-2f.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-humanoid-organic-field-38-2e.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-humanoid-refinement-38-2g.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-humanoid-refinement-38-2gc.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-insects-38-2k.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 2
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-mammals-38-2h.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-no-decorative-rocks-38-2mb.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-no-decorative-support-38-2ma.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-plant-canopy-support-38-2la.spec.ts",
    "types": [
      "assertion"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-reptile-dentition-38-2jb.spec.ts",
    "types": [
      "assertion"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-reptile-eyes-38-2p.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-reptiles-38-2j.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-reptilian-cultural-diversity-38-2oe9.spec.ts",
    "types": [
      "assertion"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-reptilian-wardrobe-38-2oe8b.spec.ts",
    "types": [
      "execution"
    ],
    "failures": 2
  },
  {
    "file": "src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.spec.ts",
    "types": [
      "assertion",
      "timeout"
    ],
    "failures": 4
  },
  {
    "file": "src/app/presentation/scientific-body-preview/scientific-minor-body-texture-vis3d2e.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/system/system-scene-artificial-satellites-visciv2.spec.ts",
    "types": [
      "assertion"
    ],
    "failures": 2
  },
  {
    "file": "src/app/presentation/system/system-scene-civilization-surface-parity-visciv1d.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/system/system-scene-planet-clouds-vis3d2f.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/presentation/system/system-scene-planet-texture-refinement.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  },
  {
    "file": "src/app/simulation/life/vida-t1-civilized-founder.spec.ts",
    "types": [
      "timeout"
    ],
    "failures": 1
  }
];
const reconciled=new Set([
  "vida38-civilized-insectoid-38-2q1a.spec.ts",
  "vida38-civilized-reptilian-38-2od2.spec.ts",
  "vida38-civilized-reptilian-38-2od3.spec.ts",
  "vida38-civilized-reptilian-38-2od5.spec.ts",
  "vida38-civilized-reptilian-38-2oe.spec.ts",
  "vida38-civilized-reptilian-38-2oe2.spec.ts",
  "vida38-civilized-reptilian-38-2oe6a.spec.ts",
  "vida38-civilized-reptilian-38-2oe7.spec.ts",
  "vida38-civilized-reptilian-38-2oe7b.spec.ts",
  "vida38-civilized-reptilian-38-2oe7c.spec.ts",
  "vida38-civilized-reptilian-38-2oe8.spec.ts",
  "vida38-reptilian-cultural-diversity-38-2oe9.spec.ts",
  "vida38-reptilian-fixtures-regression-38-2s8c.spec.ts",
  "vida38-reptilian-wardrobe-38-2oe8b.spec.ts",
  "vida38-species-visual-preview-scene.spec.ts"
]);
const group=(process.argv.find(v=>v.startsWith('--group='))||'--group=reconciled').split('=')[1];
const limitArg=process.argv.find(v=>v.startsWith('--limit='));
const limit=limitArg?Number(limitArg.split('=')[1]):Infinity;
if(!['reconciled','pending','timeouts','orbital','all','full'].includes(group)||!(limit>0)){
  process.stderr.write('Uso: node scripts/verificar-genesis-38-2s8c-regresiones.cjs --group=reconciled|pending|timeouts|orbital|all|full [--limit=N]\n');
  process.exit(2);
}
const orbital='src/app/presentation/system/system-scene-artificial-satellites-visciv2.spec.ts';
const extra='src/app/presentation/life-species-visual/vida38-reptilian-fixtures-regression-38-2s8c.spec.ts';
let selected=[];
if(group==='full'){
  selected=[
    {label:'architecture',binary:'npm',args:['run','test:architecture']},
    {label:'unit-coverage',binary:'npm',args:['run','test:unit:coverage']},
    {label:'worker',binary:'npm',args:['run','test:worker']},
    {label:'e2e-typecheck',binary:'npm',args:['run','test:e2e:typecheck']},
    {label:'ng-build',binary:'npx',args:['ng','build']},
    {label:'e2e',binary:'npm',args:['run','test:e2e']},
  ];
}else{
  const candidates=suites.map(item=>item.file);
  if(group==='reconciled'||group==='all')candidates.push(extra);
  const includes=f=>group==='all'||group==='reconciled'&&(reconciled.has(path.basename(f))||f===extra)
    ||group==='pending'&&!reconciled.has(path.basename(f))
    ||group==='timeouts'&&suites.find(item=>item.file===f)?.types.includes('timeout')
    ||group==='orbital'&&f===orbital;
  selected=[...new Set(candidates.filter(includes))].map(file=>({label:file,binary:'npx',args:['ng','test','--watch=false',`--include=${file}`]}));
}
if(Number.isFinite(limit))selected=selected.slice(0,limit);
const summary={revision:'38.2s8c',group,started:new Date().toISOString(),results:[]};
for(let i=0;i<selected.length;i++){
  const task=selected[i];
  if(group!=='full'&&!fs.existsSync(path.join(root,task.label))){
    summary.results.push({file:task.label,ok:false,skipped:true,error:'Falta archivo en el proyecto'});
    continue;
  }
  const safe=task.label.replace(/[^a-zA-Z0-9_.-]+/g,'_');
  process.stdout.write(`[${i+1}/${selected.length}] ${task.label}\n`);
  const before=Date.now();
  const command=process.platform==='win32'?task.binary+'.cmd':task.binary;
  const outcome=spawnSync(command,task.args,{cwd:root,encoding:'utf8',shell:process.platform==='win32',maxBuffer:64*1024*1024,
    env:{...process.env,FORCE_COLOR:'0'}});
  const log=((outcome.stdout??'')+'\n'+(outcome.stderr??'')+(outcome.error?'\n'+String(outcome.error):''));
  fs.writeFileSync(path.join(out,safe+'.log'),log,'utf8');
  const result={file:task.label,ok:outcome.status===0,exitCode:outcome.status,seconds:Math.round((Date.now()-before)/1000),
    log:path.relative(root,path.join(out,safe+'.log')),error:outcome.error?String(outcome.error):null};
  summary.results.push(result);
  process.stdout.write(`   ${result.ok?'OK':'FALLO'} (${result.seconds} s), log: ${result.log}\n`);
}
summary.ended=new Date().toISOString();
summary.passed=summary.results.filter(r=>r.ok).length;
summary.failed=summary.results.filter(r=>!r.ok).length;
const dest=path.join(out,`resultado-${group}.json`);
fs.writeFileSync(dest,JSON.stringify(summary,null,2)+'\n');
console.log(`GENESIS_38_2S8C_RETEST: ${summary.passed} correctos, ${summary.failed} fallidos; ${dest}`);
if(summary.failed)process.exitCode=1;
