'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'certificar-genesis-vida-f.cjs'),'utf8');
function simulate(args,platform='linux'){
  const commands=[];
  const saved=[];
  const errors=[];
  let exitCode=0;
  const proc={argv:['node','scripts/certificar-genesis-vida-f.cjs',...args],platform,execPath:platform==='win32'?'C:\\Program Files\\nodejs\\node.exe':'/usr/bin/node',
    exit(code){exitCode=code;throw new Error('EXIT_'+code);},get exitCode(){return exitCode;},set exitCode(v){exitCode=v;}};
  const fakeRequire=id=>id==='node:child_process'?{spawnSync(program,args,options){commands.push({program,args,options});return {status:0};}}:
    id==='node:fs'?{existsSync(){return true;},writeFileSync(filename,contents){saved.push(JSON.parse(contents));}}:
    id==='node:path'?path:require(id);
  const context={process:proc,require:fakeRequire,__dirname:path.resolve(__dirname),
    console:{log(){},error(...parts){errors.push(parts.join(' '));}},Date,JSON,String,Math};
  try{vm.runInNewContext(script,context,{filename:'certificar-genesis-vida-f.cjs'});}catch(err){
    if(!/^EXIT_\d+$/.test(err.message))throw err;
  }
  return {commands,saved,errors,exitCode};
}
test('VIDA.F: sin opciones ejecuta las ocho puertas de certificación',()=>{
  const r=simulate([]);
  assert.equal(r.exitCode,0);
  assert.equal(r.commands.length,8);
  assert.equal(r.saved.at(-1).conclusion,'SUITES_SUPERADAS_PENDIENTE_REVISION_CIENTIFICA');
});
test('VIDA.F: con muestra V3 ejecuta una novena puerta',()=>{
  const r=simulate(['--con-muestra-v3']);
  assert.equal(r.exitCode,0);
  assert.equal(r.commands.length,9);
  assert.equal(r.saved.at(-1).puertas.length,9);
});
test('VIDA.F: solo rechaza los argumentos de usuario desconocidos',()=>{
  const r=simulate(['--desconocida']);
  assert.equal(r.exitCode,2);
  assert.equal(r.commands.length,0);
  assert.match(r.errors.join(' '),/Opciones permitidas/);
});

test('VIDA.F: Windows ejecuta Node y npm/npx con rutas que contienen espacios, sin shell',()=>{
  const r=simulate([], 'win32');
  assert.equal(r.commands.length,8);
  for(const command of r.commands){
    assert.equal(command.program,'C:\\Program Files\\nodejs\\node.exe');
    assert.equal(command.options.shell,false);
    assert.ok(Array.isArray(command.args));
  }
  assert.match(r.commands[1].args[0],/npx-cli\.js$/);
  assert.match(r.commands[2].args[0],/npm-cli\.js$/);
});
