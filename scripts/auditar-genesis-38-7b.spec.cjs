/** GENESIS 38.7b — portable audit of 38.6/38.7 types and Three.js negative test. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname,'..');
const recPath = 'src/app/presentation/system/system-scene-civilization-visuals.ts';
const testPath = 'src/app/presentation/infrastructure/colvis3-native-terrain-t7i.spec.ts';
const regPath = 'src/app/presentation/system/system-scene-civilization-visuals-38-7b.spec.ts';
const records = fs.readFileSync(path.join(root,recPath),'utf8');
const test = fs.readFileSync(path.join(root,testPath),'utf8');
const regression = fs.readFileSync(path.join(root,regPath),'utf8');
let passed = 0;
const check = (name, fn) => {fn();passed++;};
for(const [filename,source] of [[recPath,records],[testPath,test],[regPath,regression]]) {
  check(`TS parse ${filename}`,()=>{
    const parsed=ts.createSourceFile(filename,source,ts.ScriptTarget.ES2022,true);
    assert.equal(parsed.parseDiagnostics.length,0);
  });
}
const parsed=ts.createSourceFile(recPath,records,ts.ScriptTarget.ES2022,true);
const iface=parsed.statements.find(node=>ts.isInterfaceDeclaration(node) && node.name.text==='SystemSceneCivilizationVisualRecord');
check('Record interface preserved',()=>assert.ok(iface));
for(const field of ['bodyIndex','tier','vegetationProfile','universeSeed','generatorVersionCode','systemKey','moonIndex','infrastructurePlans']) {
  check(`Record.${field}`,()=>assert.ok(iface.members.some(m=>ts.isPropertySignature(m)&&m.name?.getText(parsed)===field)));
}
check('VIDA.8 infrastructure type sourced from the plan',()=>{
  assert.ok(records.includes("import type { Vida38InfrastructurePlan386 } from '../infrastructure/vida38-infrastructure-plan-38-6'"));
  assert.ok(records.includes('readonly infrastructurePlans?: readonly Vida38InfrastructurePlan386[]'));
});
check('Confirmed no-civilization biology retained',()=>assert.ok(records.includes('Vida7CivilizationTier | null')));
check('Fail closed for nonconfirmed scenes retained',()=>{
 assert.ok(records.includes('snapshot.knowledgeLevel !== ArchiveStellarSystemKnowledgeLevel.CONFIRMED'));
 assert.ok(records.includes('snapshot.discoveryStateCode !== DiscoveryState.CONFIRMED.code'));
});
check('Invalid-material test uses separate Mesh (no invalid assignment)',()=>{
  assert.ok(test.includes('const unsupportedSurface=new THREE.Mesh(surface.geometry,unsupportedMaterial);'));
  assert.ok(test.includes('attachColvis3NativeTerrainT7i(unsupportedSurface,site,1,true,.001,1)'));
  assert.ok(!test.includes('surface.material=new THREE.MeshBasicMaterial()'));
});
check('Invalid-material test preserves the existing physical material',()=>{
  assert.ok(test.includes('unsupportedMaterial.dispose();'));
  assert.ok(test.includes('surface.geometry.dispose();original.dispose();'));
});
check('Runtime does not infer civilization from signal',()=>{
  assert.ok(!records.includes('tier: \'PRIMITIVE\''));
});
check('Regression suite covers native and extended contracts',()=>{
  assert.ok(regression.includes('infrastructurePlans: Object.freeze([])'));
  assert.ok(regression.includes('tier: null'));
});
// Virtual strict TypeScript compilation of actual interface with the relevant
// exact structural assignments, independently of Angular/WebGL dependencies.
check('Strict TS validates extended record and preexisting minimal records',()=>{
  const virtual='/__genesis387b_typecheck.ts';
  const text=`
    type Vida7CivilizationTier = 'PRIMITIVE'|'ADVANCED'|'VERY_ADVANCED';
    type Vida38InfrastructurePlan386 = { readonly id: string };
    type SystemScenePlanetVegetationProfileV1 = { readonly floraSpeciesCount: number };
    ${iface.getText(parsed)}
    declare const full: Readonly<{
      universeSeed: string; generatorVersionCode: number; systemKey: string;
      bodyIndex: string; moonIndex: string|null;
      tier: Vida7CivilizationTier|null;
      vegetationProfile: SystemScenePlanetVegetationProfileV1|null;
      infrastructurePlans: readonly Vida38InfrastructurePlan386[];
    }>;
    const collected: SystemSceneCivilizationVisualRecord[]=[];
    collected.push(Object.freeze(full));
    collected.push({bodyIndex:'1',tier:'ADVANCED'});
    collected.push({bodyIndex:'2',tier:null});
    collected.push({bodyIndex:'3',tier:'VERY_ADVANCED',moonIndex:null,infrastructurePlans:[]});
  `;
  const options={strict:true,noEmit:true,target:ts.ScriptTarget.ES2022,types:[]};
  const host=ts.createCompilerHost(options);
  const priorSourceFile=host.getSourceFile.bind(host);
  const priorReadFile=host.readFile.bind(host);
  const priorFileExists=host.fileExists.bind(host);
  host.getSourceFile=(file,language,onError,newFile)=>file===virtual
    ? ts.createSourceFile(file,text,language,true)
    : priorSourceFile(file,language,onError,newFile);
  host.readFile=file=>file===virtual?text:priorReadFile(file);
  host.fileExists=file=>file===virtual||priorFileExists(file);
  const program=ts.createProgram([virtual],options,host);
  const errs=ts.getPreEmitDiagnostics(program).filter(e=>e.category===ts.DiagnosticCategory.Error);
  assert.equal(errs.length,0,errs.map(e=>ts.flattenDiagnosticMessageText(e.messageText,'\n')).join('\n'));
});
console.log(`PASS GENESIS 38.7b — ${passed} comprobaciones portátiles de contratos y compatibilidad`);
