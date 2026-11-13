'use strict';
/**
 * GENESIS 38.2r — integración segura e idempotente en la escena científica de especies.
 * No sobrescribe el renderer completo ni toca especies animales existentes.
 */
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();
const scene=path.join(root,'src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts');
const importLine="import { createVida38CivilizedHumanoidPreview38R, isVida38VeryAdvancedHumanoid38R } from './vida38-civilized-humanoid-preview-38-2r';";
const callPattern=/case\s+'BIPED_BODY'\s*:\s*createBiped\s*\(\s*subject\s*,\s*contract\s*,\s*rng\s*,\s*options\.humanoidQuality\s*\?\?\s*'HIGH'\s*\)\s*;\s*break\s*;/;
const patchedCase=`case 'BIPED_BODY':
      if (isVida38VeryAdvancedHumanoid38R(contract)) {
        createVida38CivilizedHumanoidPreview38R(subject, contract, options.humanoidQuality ?? 'HIGH');
      } else {
        createBiped(subject, contract, rng, options.humanoidQuality ?? 'HIGH');
      }
      break;`;
function patchScene(text){
  if(text.includes('createVida38CivilizedHumanoidPreview38R(subject, contract')){
    if(!text.includes('vida38-civilized-humanoid-preview-38-2r'))throw Error('38.2r ya está parcialmente integrado: falta el import.');
    return text;
  }
  if(!callPattern.test(text))throw Error("No encuentro el caso BIPED_BODY original. No se ha cambiado la escena; envíame ese fragmento.");
  let updated=text.replace(callPattern,patchedCase);
  if(!updated.includes(importLine)){
    const first=updated.match(/^import .*;\s*$/m);
    if(!first)throw Error('No se encontró la sección de imports de la escena.');
    updated=updated.replace(first[0],`${first[0]}\n${importLine}`);
  }
  return updated;
}
function integrate(checkOnly=false){
  if(!fs.existsSync(scene))throw Error('Falta vida38-species-visual-preview-scene.ts en la ruta esperada.');
  const newModule=path.join(root,'src/app/presentation/life-species-visual/vida38-civilized-humanoid-preview-38-2r.ts');
  if(!fs.existsSync(newModule))throw Error('Aplica primero el ZIP incremental 38.2r.');
  const oldText=fs.readFileSync(scene,'utf8'),updated=patchScene(oldText);
  if(!checkOnly&&oldText!==updated){
    const backup=path.join(root,'docs/audits/38-2r/backup-vida38-species-visual-preview-scene.before-38-2r.ts.txt');
    fs.mkdirSync(path.dirname(backup),{recursive:true});
    if(!fs.existsSync(backup))fs.writeFileSync(backup,oldText);
    fs.writeFileSync(scene,updated);
  }
  return {changed:oldText!==updated,checkOnly,scene:path.relative(root,scene)};
}
if(require.main===module){
  try{console.log('GENESIS_38_2R_INTEGRATION_OK:',JSON.stringify(integrate(process.argv.includes('--check'))));}
  catch(e){console.error('GENESIS_38_2R_INTEGRATION_FAILED:',e.message);process.exitCode=1;}
}
module.exports={patchScene,integrate};
