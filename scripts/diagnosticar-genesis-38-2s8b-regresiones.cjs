#!/usr/bin/env node
/**
 * GENESIS Web 38.2s8b — diagnóstico de 55 fallos registrados en el test unitario general.
 * NO modifica src/, los motores visuales, Vitest ni package.json.
 * Ejecuta los archivos fallidos UNO A UNO mediante el comando Angular existente.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const suites = [
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
const critical = [
  "src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s8.spec.ts",
  "src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s7.spec.ts",
  "src/app/presentation/life-species-visual/vida38-civilized-insectoid-38-2q1a.spec.ts",
  "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od5.spec.ts",
  "src/app/presentation/life-species-visual/vida38-reptilian-wardrobe-38-2oe8b.spec.ts",
  "src/app/presentation/system/system-scene-artificial-satellites-visciv2.spec.ts"
];
const group = process.argv.find(s => s.startsWith('--run='))?.slice(6) ?? 'list';
const valid = ['list','critical','assertions','timeouts','all'];
if (!valid.includes(group)) {
  console.error('Uso: node scripts/diagnosticar-genesis-38-2s8b-regresiones.cjs [--run=list|critical|assertions|timeouts|all]');
  process.exit(2);
}
let targets = group === 'critical' ? suites.filter(x => critical.includes(x.file))
  : group === 'assertions' ? suites.filter(x => x.types.some(t => t !== 'timeout'))
  : group === 'timeouts' ? suites.filter(x => x.types.includes('timeout')) : suites;
if (group === 'list') {
  console.log(`GENESIS 38.2s8b: ${suites.length} archivos / 55 fallos: 35 timeouts y 20 fallos de aserción/ejecución`);
  console.log(`Críticos=${critical.length}; no se modifica código productivo ni tests.`);
  for (const item of suites) console.log(`${item.types.join('+').padEnd(20)} ${item.file}`);
  console.log('Ejemplo: node scripts/diagnosticar-genesis-38-2s8b-regresiones.cjs --run=critical');
  process.exit(0);
}
console.log(`GENESIS_38_2S8B_ISOLATED_START: group=${group}; files=${targets.length}`);
const started = new Date().toISOString();
const results=[];
for (const [index, item] of targets.entries()) {
  console.log(`\n[${index+1}/${targets.length}] ${item.file}`);
  const t0=Date.now();
  const args=['ng','test','--watch=false',`--include=${item.file}`];
  const proc=spawnSync(process.platform==='win32'?'npx.cmd':'npx', args, {cwd:process.cwd(),shell:process.platform==='win32',stdio:'inherit'});
  const ok=proc.status===0 && !proc.error;
  results.push({file:item.file,types:item.types,ok,exitCode:proc.status,seconds:Math.round((Date.now()-t0)/1000),error:proc.error?.message ?? null});
  console.log(`GENESIS_38_2S8B_FILE_${ok?'PASS':'FAIL'}: ${item.file}`);
}
const report={version:'38.2s8b',group,started,ended:new Date().toISOString(),results};
const reportFile=path.join(process.cwd(),'docs','audits','38-2s8b',`resultado-aislado-${group}.json`);
fs.mkdirSync(path.dirname(reportFile),{recursive:true});
fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n','utf8');
const passed=results.filter(x=>x.ok).length;
console.log(`\nGENESIS_38_2S8B_ISOLATED_DONE: ${passed}/${results.length} archivos superados; informe=${reportFile}`);
if(passed!==results.length) process.exitCode=1;
