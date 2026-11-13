'use strict';
/**
 * GENESIS 38.2s5: integración explícita de REPTILIAN+ADVANCED en el selector
 * del modelo 3D REAL, antes del switch general. No modifica ningún renderer
 * VERY_ADVANCED ni su orden interno.
 *
 * --check: solo inspección, no escritura. Por defecto realiza un backup.
 * Idempotente. Falla sin escribir si la escena no tiene estructura conocida.
 */
const fs=require('node:fs');
const path=require('node:path');
const SCENE='src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts';
const PREVIEW='src/app/presentation/life-species-visual/vida38-advanced-reptilian-preview-38-2s2.ts';
const IMPORT="import { createVida38AdvancedReptilianPreview38S2, isVida38AdvancedReptilian38S } from './vida38-advanced-reptilian-preview-38-2s2';";
const REPLACE_MARKER='// 38.2s5: garantía de selección directa del renderer ADVANCED';
const START='  switch (descriptor.family) {';
const END='  if (descriptor.bioluminescent) {';

function patchScene(source){
  if(typeof source!=='string'||source.length<500)throw new Error('38.2s5: escena fuente no válida');
  const functionStart=source.indexOf('export function createVida38SpeciesPreviewModelV1(');
  if(functionStart<0)throw new Error('38.2s5: no se reconoce createVida38SpeciesPreviewModelV1; escena intacta');
  let next=source;
  if(!next.includes(IMPORT)){
    if(next.includes("from './vida38-advanced-reptilian-preview-38-2s2'")) {
      throw new Error('38.2s5: import 38.2s2 parcial, revisar manualmente');
    }
    const importPlace=next.indexOf('\n',next.indexOf("import * as THREE from 'three';"));
    if(importPlace<0)throw new Error('38.2s5: no se reconoce cabecera de importaciones; escena intacta');
    next=next.slice(0,importPlace+1)+IMPORT+'\n'+next.slice(importPlace+1);
  }
  if(next.includes(REPLACE_MARKER)){
    if(!next.includes('if (isVida38AdvancedReptilian38S(contract)) {\n    createVida38AdvancedReptilianPreview38S2'))
      throw new Error('38.2s5: selección parcial detectada');
    return next;
  }
  const func=next.indexOf('export function createVida38SpeciesPreviewModelV1(');
  const start=next.indexOf(START,func);
  const end=next.indexOf(END,start);
  if(start<0||end<0||end<=start||end-start>13000)
    throw new Error('38.2s5: switch descriptor.family o fin del bloque no reconocidos; no se escribe');
  const existing=next.slice(start,end);
  // Solo permitimos sustituir el bloque switch de la función de escena.
  if(!existing.includes("case 'BIPED_BODY':")||!existing.includes("case 'QUADRUPED_BODY':"))
    throw new Error('38.2s5: switch incompleto; escena intacta');
  const body=existing.trimEnd();
  const replacement=
    `  ${REPLACE_MARKER}\n`+
    `  // Este desvío se ejecuta ANTES de familyFrom y del resto de renderers.\n`+
    `  // El guard exige REPTILES + lineage REPTILIAN + civilizationTier ADVANCED.\n`+
    `  if (isVida38AdvancedReptilian38S(contract)) {\n`+
    `    createVida38AdvancedReptilianPreview38S2(subject, contract, options.humanoidQuality ?? 'HIGH');\n`+
    `  } else {\n${body}\n  }\n\n`;
  return next.slice(0,start)+replacement+next.slice(end);
}
function integrate({checkOnly=false,root=process.cwd()}={}){
  const scenePath=path.resolve(root,SCENE),rendererPath=path.resolve(root,PREVIEW);
  if(!fs.existsSync(scenePath))throw new Error(`38.2s5: falta ${SCENE}`);
  if(!fs.existsSync(rendererPath))throw new Error(`38.2s5: falta ${PREVIEW}; aplica antes 38.2s4`);
  const before=fs.readFileSync(scenePath,'utf8');
  const after=patchScene(before);
  const changed=before!==after;
  if(changed&&!checkOnly){
    const backup=path.resolve(root,'docs/audits/38-2s5/backup-vida38-species-visual-preview-scene.before-38-2s5.ts.txt');
    fs.mkdirSync(path.dirname(backup),{recursive:true});
    if(!fs.existsSync(backup))fs.writeFileSync(backup,before,'utf8');
    fs.writeFileSync(scenePath,after,'utf8');
  }
  return {status:'GENESIS_38_2S5_INTEGRATION_OK',changed,checkOnly,
    note:'Selección directa solo REPTILIAN/ADVANCED; los otros linajes y niveles conservan sus ramas'};
}
if(require.main===module){
  try{
    const result=integrate({checkOnly:process.argv.includes('--check')});
    console.log(result.status+': '+JSON.stringify(result));
  }catch(error){console.error('GENESIS_38_2S5_INTEGRATION_FAILED: '+error.message);process.exitCode=1;}
}
module.exports={patchScene,integrate,REPLACE_MARKER};
