'use strict';
/**
 * GENESIS 38.2s2: integrar renderer de REPTILIAN + ADVANCED.
 * No modifica las implementaciones ya aprobadas VERY_ADVANCED.
 * Idempotente, --check no escribe, y backup automático antes del primer cambio.
 */
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();
const relative='src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts';
const target=path.join(root,relative);
const moduleRelative='./vida38-advanced-reptilian-preview-38-2s2';
const importLine=`import { createVida38AdvancedReptilianPreview38S2, isVida38AdvancedReptilian38S } from '${moduleRelative}';`;
const familyGuard="if (isVida38AdvancedReptilian38S(contract)) return 'BIPED_BODY';";
const bipedGuard="if (isVida38AdvancedReptilian38S(contract)) return createVida38AdvancedReptilianPreview38S2(subject, contract, quality);";
function insertInsideFunction(text,name,guard){
  const pattern=new RegExp(`\\bfunction\\s+${name}\\s*\\([\\s\\S]*?\\)\\s*:\\s*[^{}]*\\{`,'m');
  const match=pattern.exec(text);
  if(!match)throw Error(`38.2s2: no se encontró función ${name} compatible; escena intacta`);
  const start=match.index+match[0].length;
  const end=text.indexOf('\n}',start);
  if(end<0)throw Error(`38.2s2: no se encontró cierre de ${name}; escena intacta`);
  if(text.slice(start,end).includes(guard))return text;
  return text.slice(0,start)+`\n  ${guard}\n`+text.slice(start);
}
function patchScene(original){
  let next=original;
  if(!next.includes(importLine)){
    if(next.includes(moduleRelative))throw Error('38.2s2: import parcial detectado, inspección manual requerida');
    const importMatch=/^import\s+[^\n]+;\s*$/m.exec(next);
    if(!importMatch)throw Error('38.2s2: imports no reconocidos; escena intacta');
    next=next.slice(0,importMatch.index+importMatch[0].length)+`\n${importLine}`+next.slice(importMatch.index+importMatch[0].length);
  }
  next=insertInsideFunction(next,'familyFrom',familyGuard);
  next=insertInsideFunction(next,'createBiped',bipedGuard);
  return next;
}
function integrate(options={}){
  if(!fs.existsSync(target))throw Error(`38.2s2: falta ${relative}`);
  const modulePath=path.join(root,'src/app/presentation/life-species-visual/vida38-advanced-reptilian-preview-38-2s2.ts');
  if(!fs.existsSync(modulePath))throw Error('38.2s2: aplica primero el ZIP incremental');
  const old=fs.readFileSync(target,'utf8'),updated=patchScene(old);
  const changed=old!==updated;
  if(changed && !options.checkOnly){
    const backup=path.join(root,'docs/audits/38-2s2/backup-vida38-species-visual-preview-scene.before-38-2s2.ts.txt');
    fs.mkdirSync(path.dirname(backup),{recursive:true});
    if(!fs.existsSync(backup))fs.writeFileSync(backup,old);
    fs.writeFileSync(target,updated);
  }
  return {changed,checkOnly:!!options.checkOnly,relative,
    guarded:['REPTILIAN/ADVANCED -> BIPED_BODY','REPTILIAN/ADVANCED -> renderer 38.2s2']};
}
if(require.main===module){
  try{console.log('GENESIS_38_2S2_INTEGRATION_OK:',JSON.stringify(integrate({checkOnly:process.argv.includes('--check')})));}
  catch(error){console.error('GENESIS_38_2S2_INTEGRATION_FAILED:',error.message);process.exitCode=1;}
}
module.exports={patchScene,integrate};
