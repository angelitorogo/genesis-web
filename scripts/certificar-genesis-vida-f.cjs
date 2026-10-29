#!/usr/bin/env node
'use strict';
/** Certificacion VIDA.F: ejecuta TODAS las puertas del repositorio original.
 * No edita package.json ni scripts PowerShell; los procesos hijos solo ejecutan tests/build.
 * Nunca afirma cierre cuando hay fallos o alguna puerta sin ejecutar.
 */
const cp=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const win=process.platform==='win32';
// Never use shell:true: on Windows it splits "C:\Program Files\nodejs\node.exe"
// and may concatenate unescaped arguments in cmd.exe (DEP0190).
// npm/npx are JavaScript CLI entrypoints distributed with Node on Windows.
function executable(name, args) {
  if (!win) return { program:name, args };
  const bin = path.join(path.dirname(process.execPath),'node_modules','npm','bin',name+'-cli.js');
  if (!fs.existsSync(bin)) {
    throw new Error('No se encuentra el ejecutable '+name+' en '+bin+'; revisar instalación de Node/npm.');
  }
  return { program:process.execPath, args:[bin,...args] };
}
const output=path.join(root,'auditoria-vida-f-certificacion.json');
const include=['src/app/simulation/life/vida-f-closure-audit.spec.ts',
  'src/app/simulation/life/vida6-ecosystems-species.spec.ts',
  'src/app/simulation/life/vida7-intelligence-civilizations.spec.ts',
  'src/app/simulation/life/vida8-technological-colonization.spec.ts',
  'src/app/simulation/life/vida9-biology-exploration.spec.ts',
  'src/app/simulation/life/vida5-biogenic-atmosphere.spec.ts',
  'src/app/presentation/scientific/vida9a-physical-biology-coherence.spec.ts',
  'src/app/data/local/repository/dexie-vida9-biology-exploration.repository.spec.ts'];
const argumentos=process.argv.slice(2);
const withSample=argumentos.includes('--con-muestra-v3');
if(argumentos.some(x=>x!=='--con-muestra-v3')){
  console.error('Opciones permitidas: --con-muestra-v3');process.exit(2);
}
const nodeGate=(name,args)=>[name,{program:process.execPath,args}];
const npmGate=(name,command,args)=>[name,{program:command,args,cli:true}];
const gates=[
  nodeGate('Contratos Node',['--test','scripts/auditar-genesis-vida-f.spec.cjs']),
  npmGate('Unitarios VIDA.F y regresion','npx',['ng','test','--watch=false',...include.map(x=>'--include='+x)]),
  npmGate('Arquitectura','npm',['run','test:architecture']),
  npmGate('Cobertura unitaria completa','npm',['run','test:unit:coverage']),
  npmGate('Worker / tipado','npm',['run','test:worker']),
  npmGate('Tipado E2E','npm',['run','test:e2e:typecheck']),
  npmGate('Build','npx',['ng','build']),
  npmGate('E2E','npm',['run','test:e2e']),
];
if(withSample)gates.push(nodeGate('Muestra fisica V3',
  ['scripts/auditar-genesis-vida-f.cjs','--limit-systems=100','--max-moons-per-planet=4']));
const result={revision:'VIDA.F/cierre-auditable/v1',
  alcance:withSample?'SUITES_Y_MUESTRA_V3':'SUITES',
  conclusion:'NO_EJECUTADO',puertas:[]};
const save=()=>fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n','utf8');
for(const [name,gate] of gates){
  console.log('\n============================================================');
  console.log('VIDA.F — '+name+'\n'+gate.program+' '+gate.args.join(' '));
  console.log('============================================================\n');
  const start=Date.now();
  let child;
  try {
    const command=gate.cli?executable(gate.program,gate.args):gate;
    child=cp.spawnSync(command.program,command.args,{cwd:root,stdio:'inherit',shell:false});
  } catch(error) {
    child={status:1,error};
  }
  const status=child.error||child.signal||child.status!==0?'FALLIDA':'SUPERADA';
  result.puertas.push({nombre:name,estado:status,codigoSalida:child.status,
    duracionSegundos:Math.round((Date.now()-start)/1000),
    ...(child.error?{error:String(child.error.message)}:{})});
  result.conclusion='INCOMPLETO';save();
  if(status==='FALLIDA')console.error('ATENCION — puerta no superada: '+name);
}
const failed=result.puertas.filter(g=>g.estado!=='SUPERADA');
result.conclusion=failed.length===0?'SUITES_SUPERADAS_PENDIENTE_REVISION_CIENTIFICA':
  'CIERRE_NO_CERTIFICADO';
save();
console.log(`\nVIDA.F: ${result.puertas.length-failed.length}/${result.puertas.length} puertas superadas.`);
console.log(`CONCLUSION: ${result.conclusion}\nINFORME: ${output}`);
if(failed.length)process.exitCode=1;
