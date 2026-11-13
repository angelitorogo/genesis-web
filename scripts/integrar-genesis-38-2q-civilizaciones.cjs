'use strict';
/**
 * Integrador robusto 38.2q1:
 * - conecta el renderer insectoide civilizado al preview scene.
 * - corrige el acceso del Laboratorio para que la tarjeta pase a llamarse
 *   "Civilizaciones" y muestre 06 cuando aún siga en 05.
 * Puede ejecutarse varias veces sin duplicar cambios.
 */
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();
const scenePath=path.join(root,'src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts');
const insertImport="import { createVida38CivilizedInsectoidPreview38Q, isVida38VeryAdvancedInsectoid38Q } from './vida38-civilized-insectoid-preview-38-2q';";
const originalPattern=/case 'INSECT_BODY':\s*if \(contract\.morphology\.group === 'INSECTS'\)\s*createVida38InsectPreview38K\(subject, contract, options\.humanoidQuality \?\? 'HIGH'\);\s*break;/;
const patchedCase=`case 'INSECT_BODY':\n      if (contract.morphology.group === 'INSECTS') {\n        if (isVida38VeryAdvancedInsectoid38Q(contract))\n          createVida38CivilizedInsectoidPreview38Q(subject, contract, options.humanoidQuality ?? 'HIGH');\n        else\n          createVida38InsectPreview38K(subject, contract, options.humanoidQuality ?? 'HIGH');\n      }\n      break;`;
function walk(dir,out){
  if(!fs.existsSync(dir))return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name==='node_modules'||entry.name==='.angular')continue;
    const p=path.join(dir,entry.name);
    if(entry.isDirectory())walk(p,out);
    else if(/\.(ts|html)$/.test(entry.name)&&!entry.name.endsWith('.spec.ts'))out.push(p);
  }
}
function patchScene(source){
  if(source.includes('isVida38VeryAdvancedInsectoid38Q(contract)')){
    if(!source.includes('vida38-civilized-insectoid-preview-38-2q'))throw new Error('Hay selector 38q sin import: revisar manualmente.');
    return source;
  }
  if(!source.includes("import { createVida38InsectPreview38K }")||!originalPattern.test(source))throw new Error('Escena de especies incompatible: no encuentro el selector original de insectos.');
  let result=source.replace(originalPattern,patchedCase);
  const line=source.split('\n').find(l=>l.includes("import { createVida38InsectPreview38K }"));
  if(!line)throw new Error('Import de insectos no localizado.');
  result=result.replace(line,line+'\n'+insertImport);
  result=result.replace("contract.intelligence.lineage === 'INSECTOID'",
    "(contract.intelligence.lineage === 'INSECTOID' && !isVida38VeryAdvancedInsectoid38Q(contract))");
  return result;
}
function candidateLabFiles(){
  const files=[];walk(path.join(root,'src/app'),files);
  return files.filter(file=>{
    const x=fs.readFileSync(file,'utf8');
    return x.includes('Reptilianos civilizados')
      || x.includes('Galería comparativa de 12 o 24 especies muy avanzadas')
      || x.includes('>Civilizaciones</h3>')
      || x.includes('VIDA38_2OE5B_LAB_INDEX');
  });
}
function patchLabSource(source){
  let result=source;
  result=result.replace(/>Reptilianos civilizados<\/h3>/g,'>Civilizaciones</h3>');
  result=result.replace(/Reptilianos civilizados/g,'Civilizaciones');
  result=result.replace(/Galería comparativa de 12 o 24 especies muy avanzadas, con anatomía, trajes y accesorios deterministas\. Abre cada ejemplar en el visor 3D\./g,
    'Galerías comparativas de civilizaciones: reptilianos e insectoides muy avanzados, con anatomía, vestimentas y accesorios deterministas. Preparado para incorporar humanoides y otros niveles.');
  const anchor=result.indexOf('Civilizaciones');
  if(anchor>=0){
    const start=Math.max(0,anchor-500),end=Math.min(result.length,anchor+500);
    const fragment=result.slice(start,end);
    const fixed=fragment.replace(/>(?:0?5)</,'>06<');
    result=result.slice(0,start)+fixed+result.slice(end);
  }
  return result;
}
function integrate(checkOnly=false){
  for(const f of ['vida38-civilized-insectoid-preview-38-2q.ts','vida38-civilized-insectoid-gallery-38-2q.component.ts','vida38-reptilian-gallery-laboratory-38-2oe5b.component.ts']){
    if(!fs.existsSync(path.join(root,'src/app/presentation/life-species-visual',f)))throw new Error(`No está instalado ${f}: aplica el ZIP primero.`);
  }
  if(!fs.existsSync(scenePath))throw new Error('No existe el renderer de especies.');
  const scene=fs.readFileSync(scenePath,'utf8');
  const nextScene=patchScene(scene);
  const labFiles=candidateLabFiles();
  if(labFiles.length===0)throw new Error('No localizo ningún archivo candidato para la tarjeta de Civilizaciones.');
  const labPatches=labFiles.map(file=>{
    const before=fs.readFileSync(file,'utf8');
    const after=patchLabSource(before);
    return {file,before,after};
  }).filter(item=>item.before!==item.after);
  if(!checkOnly){
    const backup=path.join(root,'docs/audits/38-2q/backups');
    fs.mkdirSync(backup,{recursive:true});
    if(scene!==nextScene){
      const name=path.relative(root,scenePath).replaceAll(/[\\/]/g,'__')+'.before.txt';
      const dest=path.join(backup,name);if(!fs.existsSync(dest))fs.writeFileSync(dest,scene);
      fs.writeFileSync(scenePath,nextScene);
    }
    for(const item of labPatches){
      const name=path.relative(root,item.file).replaceAll(/[\\/]/g,'__')+'.before.txt';
      const dest=path.join(backup,name);if(!fs.existsSync(dest))fs.writeFileSync(dest,item.before);
      fs.writeFileSync(item.file,item.after);
    }
  }
  return {scene:path.relative(root,scenePath),indexes:labPatches.map(p=>path.relative(root,p.file)),changes:{scene:scene!==nextScene,index:labPatches.length},checkOnly};
}
if(require.main===module){
  try{console.log('GENESIS_38_2Q1_CIVILIZACIONES_OK:',JSON.stringify(integrate(process.argv.includes('--check'))));}
  catch(error){console.error('GENESIS_38_2Q1_NO_APLICADO:',error.message);process.exitCode=1;}
}
module.exports={integrate,patchScene,patchLabSource};
