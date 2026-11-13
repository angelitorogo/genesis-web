'use strict';
/**
 * GENESIS 38.2s6: punto de control POST-RENDER para REPTILIAN/ADVANCED.
 * Se integra DESPUÉS del switch del modelo de producción (no depende de las
 * ramas familyFrom, createBiped ni del parche 38s2/38s5).
 * Cero cambios a los otros tipos/niveles; backup, --check e idempotencia.
 */
const fs=require('node:fs');
const path=require('node:path');
const sceneRel='src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts';
const runtimeRel='src/app/presentation/life-species-visual/vida38-advanced-reptilian-runtime-38-2s6.ts';
const marker='// GENESIS 38.2s6 POST-RENDER: garantiza vestuario real REPTILIAN/ADVANCED';
const imported="import { enforceVida38AdvancedReptilianVisibleRenderer38S6 } from './vida38-advanced-reptilian-runtime-38-2s6';";
const injected=`  ${marker}\n  // No cambia las ramas VERY_ADVANCED; solo repara el modelo ADVANCED si se dibujó el antiguo.\n  enforceVida38AdvancedReptilianVisibleRenderer38S6(subject, contract, options.humanoidQuality ?? 'HIGH');\n`;
function patchScene(before){
  if(typeof before!=='string'||before.length<500)throw Error('38.2s6: escena de especies inválida');
  const func=before.indexOf('export function createVida38SpeciesPreviewModelV1(');
  if(func<0)throw Error('38.2s6: no se encuentra la fábrica de modelos de producción');
  const markerMatches=before.split(marker).length-1;
  if(markerMatches>1)throw Error('38.2s6: marcador duplicado; revisa el código antes de integrar');
  if(markerMatches===1){
    if(!before.includes(imported)||!before.includes('enforceVida38AdvancedReptilianVisibleRenderer38S6(subject, contract,'))
      throw Error('38.2s6: integración parcial, no se ha escrito nada');
    return before;
  }
  const afterStart=before.slice(func);
  const match=/^\s{2}normalizeSubject\(subject\);\s*$/m.exec(afterStart);
  if(!match)throw Error('38.2s6: no se encuentra la llamada normalizeSubject(subject) dentro del constructor');
  const anchor=func+match.index;
  const anchorAfter=afterStart.slice(match.index+match[0].length);
  if(!anchorAfter.includes('const restingHeight'))
    throw Error('38.2s6: normalizeSubject no parece corresponder al modelo esperado');
  const originalLine='  normalizeSubject(subject);';
  let out=before.slice(0,anchor)+injected+originalLine+before.slice(anchor+match[0].length);
  if(!out.includes(imported)){
    const three=out.indexOf("import * as THREE from 'three';");
    if(three<0)throw Error('38.2s6: falta import de Three.js; escena incompatible');
    const eol=out.indexOf('\n',three);
    out=out.slice(0,eol+1)+imported+'\n'+out.slice(eol+1);
  }
  return out;
}
function integrate({root=process.cwd(),checkOnly=false}={}){
  const target=path.resolve(root,sceneRel);
  if(!fs.existsSync(target))throw Error(`38.2s6: falta ${sceneRel}`);
  if(!fs.existsSync(path.resolve(root,runtimeRel)))throw Error(`38.2s6: falta ${runtimeRel}. Aplica el ZIP primero.`);
  const before=fs.readFileSync(target,'utf8');
  const after=patchScene(before);
  const changed=after!==before;
  if(changed&&!checkOnly){
    const backup=path.resolve(root,'docs/audits/38-2s6/backup-vida38-species-visual-preview-scene.before-38-2s6.ts.txt');
    fs.mkdirSync(path.dirname(backup),{recursive:true});
    if(!fs.existsSync(backup))fs.writeFileSync(backup,before);
    fs.writeFileSync(target,after);
  }
  return {status:'GENESIS_38_2S6_INTEGRATION_OK',changed,checkOnly,
    guard:'ONLY REPTILES/REPTILIAN/ADVANCED',
    markerApplied:after.includes(marker),
    factory:'createVida38SpeciesPreviewModelV1',
    warning:'La integración de código debe validarse con Vitest y WebGL'};
}
if(require.main===module){
  try{console.log(JSON.stringify(integrate({checkOnly:process.argv.includes('--check')})));}
  catch(err){console.error('GENESIS_38_2S6_INTEGRATION_FAILED: '+err.message);process.exitCode=1;}
}
module.exports={patchScene,integrate,marker};
