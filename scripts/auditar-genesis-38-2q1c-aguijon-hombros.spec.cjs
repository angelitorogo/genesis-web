'use strict';
/**
 * Auditoría de seguridad geométrica 38.2q1c sin necesidad de WebGL.
 * Para comprobar luz y vista desde todos los ángulos ejecutar también Vitest.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = process.cwd();
const base = path.join(root, 'src/app/presentation/life-species-visual');
const paths = [
  'vida38-civilized-insectoid-preview-38-2q.ts',
  'vida38-civilized-insectoid-organic-anatomy-38-2q1b.ts',
  'vida38-civilized-insectoid-38-2q1c.spec.ts',
];
const sources = {};
for (const name of paths) {
  const file = path.join(base, name);
  assert(fs.existsSync(file), `Falta ${file}`);
  const source = fs.readFileSync(file, 'utf8');
  sources[name] = source;
  const { diagnostics } = ts.transpileModule(source, {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  assert.equal(diagnostics?.length ?? 0, 0, `La sintaxis TypeScript falla en ${name}`);
}
const anatomy = sources[paths[1]], preview = sources[paths[0]];
for (const symbol of [
  'curve.computeFrenetFrames(rows, false)',
  'triangles.push(a, b, c, b, d, c)',
  'vida38StingerContinuity38Q1C',
  'deriveVida38InsectoidTorsoSideRadius38Q1C',
  'deriveVida38InsectoidShoulderFrame38Q1C',
]) assert(anatomy.includes(symbol), `Falta ${symbol}`);
for (const symbol of [
  'deriveVida38InsectoidShoulderFrame38Q1C(plan,index,side)',
  "'VIDA38_Q1C_INTEGRATED_THORACIC_COXA'",
  "'vida38InsectoidJointFixRevision38Q1C'",
  'Math.max((.44+index*.045)*plan.armLengthScale,frame.torsoRadius+.145)',
]) assert(preview.includes(symbol), `Falta la integración ${symbol}`);
const stingerStart = anatomy.indexOf('export function buildVida38InsectoidStinger38Q1B(');
const stingerSource = anatomy.slice(stingerStart);
assert(stingerStart > 0);
assert(!stingerSource.includes('TorusGeometry'), 'Prohibido anillo de aguijón');
assert(!stingerSource.includes('CylinderGeometry'), 'Prohibido cilindro concéntrico');
assert(!anatomy.includes('Math.random('), 'La anatomía debe ser determinista');

// Comprobación independiente de la orientación de las caras:
// un tubo parametrizado en dirección -Z, radio Y cos(theta)+X sin(theta)
// debe tener (P[ángulo+]-P[ángulo])×(P[t+]-P[t]) orientado a +Y.
const a = [0, 1, 0], b = [.1, 1, 0], c = [0, 1, -.1];
const cross = (u,v) => [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
const diff = (u,v) => u.map((q,i)=>q-v[i]);
const normal = cross(diff(b,a),diff(c,a));
assert(normal[1]>0, 'Sentido exterior de las caras mal definido');

class Vec {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
}
const mock = {Vector3:Vec};
const memo = new Map();
function load(name){
  if (memo.has(name)) return memo.get(name);
  if (name === 'vida38-species-visual-contract.ts') return {VIDA38_SPECIES_VISUAL_REVISION:'AUDIT_ONLY'};
  const file = path.join(base,name);
  const module = {exports:{}};
  memo.set(name,module.exports);
  const js = ts.transpileModule(fs.readFileSync(file,'utf8'),{
    fileName:file,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
  }).outputText;
  vm.runInNewContext(js,{
    module,exports:module.exports,
    require(id){
      if(id==='three')return mock;
      if(id.startsWith('./'))return load(id.slice(2)+'.ts');
      throw new Error(`Módulo inesperado: ${id}`);
    },
    Math, Object, Set, Map, console,
  },{filename:name});
  return module.exports;
}
const { deriveVida38CivilizedInsectoidPlan38Q } = load(paths[0]);
const { deriveVida38InsectoidShoulderFrame38Q1C, deriveVida38InsectoidStingerBase38Q1B } = load(paths[1]);
const { buildVida38InsectoidGallery38Q } = load('vida38-civilized-insectoid-fixtures-38-2q.ts');
const gallery = buildVida38InsectoidGallery38Q(24);
assert.equal(gallery.length,24);
let count=0,shoulderCount=0,stingerCount=0,smallestPenetration=Infinity;
const contracts = gallery.map(entry=>entry.contract);
for(let i=1;i<=4096;i++){
  contracts.push({
    speciesId:`Q1C-TEST-${i}`,appearanceFingerprint:`Q1C-COLOR-${i}`,variantSeedUint32:i,
    morphology:{group:'INSECTS',appendagePairs:i%8===0?4:3,bodyPlan:i%5===0?'WINGED':'TETRAPOD'},
    intelligence:{lineage:'INSECTOID',civilizationLevel:'VERY_ADVANCED'},
    locomotion:i%7===0?'FLYING':'WALKING',
    pigmentation:{primaryColorHex:'#61887d',secondaryColorHex:'#9cb9aa'},
  });
}
for(const contract of contracts){
  const p=deriveVida38CivilizedInsectoidPlan38Q(contract);
  for(let arm=0;arm<p.armPairs;arm++)for(const side of [-1,1]){
    const frame=deriveVida38InsectoidShoulderFrame38Q1C(p,arm,side);
    const embed=frame.torsoRadius-Math.abs(frame.inside.x);
    assert(embed>.025,`Hombro sin penetración de piel en ${p.speciesId}/${arm}/${side}: ${embed}`);
    assert(Math.abs(frame.outside.x)>frame.torsoRadius, 'Manguito no alcanza el exterior');
    assert(Number.isFinite(frame.inside.x)&&Number.isFinite(frame.torsoRadius));
    smallestPenetration=Math.min(smallestPenetration,embed);
    shoulderCount++;
  }
  if(p.stinger!=='NONE'){
    const base=deriveVida38InsectoidStingerBase38Q1B(p);
    assert(base.z<-.08 && base.z>-.60,`Raíz del aguijón fuera de abdomen: ${base.z}`);
    assert(Math.abs(base.y-1.08)<.00001);
    stingerCount++;
  }
  count++;
}
assert(stingerCount>50);
assert(shoulderCount>count*2);
console.log(`GENESIS_38_2Q1C_AUDIT_OK: ${count} contratos, ${shoulderCount} hombros embebidos, ${stingerCount} raíces abdominales, penetración mínima ${smallestPenetration.toFixed(3)} m`);
