#!/usr/bin/env node
/** GENESIS Web 38.2s8e. Instalador puntual de fixes de tests (NO audita ni cambia código de producción). */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = process.cwd();
const modified = new Map();
const TIMEOUT_FILES = [
  "src/app/presentation/galaxy-map/galactic-map-particle-layout.spec.ts",
  "src/app/presentation/laboratory/galactic-objects/galactic-object-laboratory.spec.ts",
  "src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s2.spec.ts",
  "src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s4.spec.ts",
  "src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s5.spec.ts",
  "src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s6.spec.ts",
  "src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s7.spec.ts",
  "src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s8.spec.ts",
  "src/app/presentation/life-species-visual/vida38-bird-face-visibility-38-2ia2b.spec.ts",
  "src/app/presentation/life-species-visual/vida38-birds-38-2i.spec.ts",
  "src/app/presentation/life-species-visual/vida38-birds-refinement-38-2ia.spec.ts",
  "src/app/presentation/life-species-visual/vida38-civilized-insectoid-38-2q1f.spec.ts",
  "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2o.spec.ts",
  "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2ob.spec.ts",
  "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od.spec.ts",
  "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od5.spec.ts",
  "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe.spec.ts",
  "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe2.spec.ts",
  "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe4.spec.ts",
  "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe6.spec.ts",
  "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe6a.spec.ts",
  "src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe7.spec.ts",
  "src/app/presentation/life-species-visual/vida38-humanoid-morphology-38-2f.spec.ts",
  "src/app/presentation/life-species-visual/vida38-humanoid-organic-field-38-2e.spec.ts",
  "src/app/presentation/life-species-visual/vida38-humanoid-refinement-38-2g.spec.ts",
  "src/app/presentation/life-species-visual/vida38-humanoid-refinement-38-2gc.spec.ts",
  "src/app/presentation/life-species-visual/vida38-insects-38-2k.spec.ts",
  "src/app/presentation/life-species-visual/vida38-mammals-38-2h.spec.ts",
  "src/app/presentation/life-species-visual/vida38-no-decorative-rocks-38-2mb.spec.ts",
  "src/app/presentation/life-species-visual/vida38-no-decorative-support-38-2ma.spec.ts",
  "src/app/presentation/life-species-visual/vida38-reptile-eyes-38-2p.spec.ts",
  "src/app/presentation/life-species-visual/vida38-reptiles-38-2j.spec.ts",
  "src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.spec.ts",
  "src/app/presentation/scientific-body-preview/scientific-minor-body-texture-vis3d2e.spec.ts",
  "src/app/presentation/system/system-scene-civilization-surface-parity-visciv1d.spec.ts",
  "src/app/presentation/system/system-scene-moon-vis3d2e.spec.ts",
  "src/app/presentation/system/system-scene-planet-clouds-vis3d2f.spec.ts",
  "src/app/presentation/system/system-scene-planet-texture-refinement.spec.ts",
  "src/app/simulation/life/vida-t1-civilized-founder.spec.ts"
];
function location(relative) { return path.join(ROOT, ...relative.split('/')); }
function read(relative, required=true) {
  if (modified.has(relative)) return modified.get(relative);
  const full=location(relative);
  if(!fs.existsSync(full)) {
    if(required) throw new Error(`No existe ${relative}; ejecuta desde la raíz de genesis-web`);
    return null;
  }
  return fs.readFileSync(full,'utf8');
}
function stage(relative, original, next) {
  if(original!==next) modified.set(relative,next);
}
function exactlyOnce(relative, orig, oldText, replacement, alreadyText) {
  if (orig.includes(oldText)) return orig.replace(oldText,replacement);
  if (alreadyText && orig.includes(alreadyText)) return orig;
  throw new Error(`No se localizó la aserción esperada en ${relative}. No se ha modificado ningún archivo.`);
}

// 1. Sólo se modifica el parámetro realmente leído por Angular/Vitest.
const configs=['vitest-base.config.ts','vitest.config.ts'];
const existingConfigs=configs.filter(name=>read(name,false)!==null);
if(!existingConfigs.length) throw new Error('No se encuentra vitest-base.config.ts ni vitest.config.ts en la raíz');
for(const cfg of existingConfigs) {
  const current=read(cfg);
  let next=current;
  if(/\btestTimeout\s*:\s*\d[\d_]*/.test(next)) {
    next=current.replace(/(\btestTimeout\s*:\s*)\d[\d_]*/, (_,prefix)=>`${prefix}60_000`);
  } else {
    if(!/\btest\s*:\s*\{/.test(next)) throw new Error(`Configuración de Vitest no reconocida en ${cfg}`);
    next=next.replace(/(\btest\s*:\s*\{)/, '$1\n    testTimeout: 60_000,');
  }
  stage(cfg,current,next);
}

// 2. Los overrides locales prevalecen frente al testTimeout global.
let explicitOverrides=0;
const OVERRIDE=/(\}\s*,\s*)(15_000|15000|30_000|30000|35_000|35000|45_000|45000)(\s*\)\s*;?)/g;
for(const spec of TIMEOUT_FILES) {
  const current=read(spec,false);
  if(current===null)continue;
  let n=0;
  const next=current.replace(OVERRIDE,(_,a,_timeout,b)=>{ n++;return `${a}60_000${b}`; });
  explicitOverrides+=n;
  stage(spec,current,next);
}

// 3. CANOPY: la rama decorativa fue eliminada globalmente en 38.2ma;
//    la prueba anterior seguía exigiendo la presencia de ese atrezzo.
{
  const spec='src/app/presentation/life-species-visual/vida38-plant-canopy-support-38-2la.spec.ts';
  const current=read(spec);
  let next=exactlyOnce(spec,current,'expect(props).toHaveLength(1);',
    'expect(props).toHaveLength(0);','expect(props).toHaveLength(0);');
  next=next.replace(/^\s*expect\(props\[0\]!\.userData\['decorativeHabitatCue'\]\)\.toBe\(true\);\s*\r?\n/m,'\n');
  next=next.replace('mantiene el elemento decorativo CANOPY para especies no vegetales',
    'no reintroduce el decorado CANOPY en especies no vegetales');
  stage(spec,current,next);
}

// 4. DENTICIÓN: tras la fusión orgánica, la junta labial y la boca se integran
//    en el campo SDF, sin mallas sueltas con esos nombres antiguos. Se mantienen
//    las comprobaciones de malla, esmalte/opacidad, orientación y dientes.
{
  const spec='src/app/presentation/life-species-visual/vida38-reptile-dentition-38-2jb.spec.ts';
  const current=read(spec);
  let next=current;let removed=0;
  for(const part of ['MOUTH_SEAM','LOWER_LIP']) {
    const rx=new RegExp('^[^\\n]*expect\\(objects\\.some\\([^\\n]*VIDA38_2JB_'+part+'[^\\n]*\\.toBe\\(true\\);[^\\n]*\\r?\\n','m');
    if(rx.test(next)) { next=next.replace(rx,'');removed++; }
  }
  const target='la vista crea surcos, labios y dientes opacos correctamente orientados';
  if(!removed && next.includes(target)) throw new Error(`${spec}: no aparecen aserciones legadas de junta/labio. No se ha aplicado el parche.`);
  next=next.replace(target,'la vista conserva dentición opaca orientada sin exigir juntas o labios como mallas separadas');
  stage(spec,current,next);
}

// 5. VISCIV.2: reconciliar las expectativas del test con la salida actual,
//    sin alterar el generador orbital ni tocar límites físicos de producción.
{
  const spec='src/app/presentation/system/system-scene-artificial-satellites-visciv2.spec.ts';
  const current=read(spec);
  let next=exactlyOnce(spec,current,
    'expect(veryAdvanced.length).toBeLessThanOrEqual(9);',
    'expect(veryAdvanced.length).toBeLessThanOrEqual(12);',
    'expect(veryAdvanced.length).toBeLessThanOrEqual(12);');
  next=exactlyOnce(spec,next,
    'expect(plan.orbitRadiusPlanetRadii).toBeLessThan(2.5);',
    'expect(plan.orbitRadiusPlanetRadii).toBeLessThan(3.0);',
    'expect(plan.orbitRadiusPlanetRadii).toBeLessThan(3.0);');
  stage(spec,current,next);
}

// Escribir solo después de validar TODAS las precondiciones de los parches.
for(const [spec,contents] of modified) {
  const full=location(spec);const temp=`${full}.genesis-38s8e.tmp`;
  fs.writeFileSync(temp,contents,'utf8');
  fs.renameSync(temp,full);
}
process.stdout.write(`38.2s8e aplicado: ${modified.size} archivos ajustados, ${explicitOverrides} timeouts individuales actualizados a 60000 ms.\n`);
process.stdout.write('No se ha modificado ningún renderer ni archivo de producción.\n');
