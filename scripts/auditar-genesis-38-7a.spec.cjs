/** GENESIS 38.7a — Hotfix contract for Angular TS2345 / TS2339. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const visualPath = 'src/app/presentation/system/system-scene-civilization-visuals.ts';
const systemPath = 'src/app/presentation/system/system.ts';
const testsPath = 'src/app/presentation/system/system-scene-civilization-visuals.spec.ts';
const visual = read(visualPath);
const system = read(systemPath);
const tests = read(testsPath);
let passed = 0;
const check = (name, action) => { action();passed++;};
for (const [name,body] of [[visualPath,visual],[systemPath,system],[testsPath,tests]]) {
  check('TypeScript parse '+name,()=>{
    const source=ts.createSourceFile(name,body,ts.ScriptTarget.ES2022,true);
    assert.equal(source.parseDiagnostics.length,0);
  });
}
const visualsAst=ts.createSourceFile(visualPath,visual,ts.ScriptTarget.ES2022,true);
const interfaceNode=visualsAst.statements.find(node=>ts.isInterfaceDeclaration(node) && node.name.text==='SystemSceneCivilizationVisualRecord');
check('record interface exists',()=>assert.ok(interfaceNode));
const tier=interfaceNode.members.find(member=>ts.isPropertySignature(member) && member.name?.getText(visualsAst)==='tier');
check('tier property exists',()=>assert.ok(tier));
check('tier is a union including null',()=>{
 assert.ok(ts.isUnionTypeNode(tier.type));
 assert.ok(tier.type.types.some(t=>t.kind===ts.SyntaxKind.NullKeyword || (ts.isLiteralTypeNode(t)&&t.literal.kind===ts.SyntaxKind.NullKeyword)));
 assert.ok(tier.type.types.some(t=>ts.isTypeReferenceNode(t) && t.typeName.getText(visualsAst)==='Vida7CivilizationTier'));
});
check('strict nullable data-source record is assignable',()=>{
 const virtualFile='/__genesis387a_contract_check.ts';
 const contract=`
   type Vida7CivilizationTier='PRIMITIVE'|'ADVANCED'|'VERY_ADVANCED';
   type SystemScenePlanetVegetationProfileV1={coverageFraction01:number};
   type Vida38InfrastructurePlan386={readonly id:string};
   ${interfaceNode.getText(visualsAst)}
   declare const record: Readonly<{
      universeSeed:string;generatorVersionCode:number;systemKey:string;
      bodyIndex:string;moonIndex:string|null;
      tier:Vida7CivilizationTier|null;
      infrastructurePlans:readonly Vida38InfrastructurePlan386[];
      vegetationProfile:SystemScenePlanetVegetationProfileV1|null;
   }>;
   const collected:SystemSceneCivilizationVisualRecord[]=[];
   collected.push(Object.freeze(record));
 `;
 const compilerOptions={strict:true,noEmit:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,types:[]};
 const host=ts.createCompilerHost(compilerOptions);
 const originalGetSourceFile=host.getSourceFile.bind(host);
 const originalFileExists=host.fileExists.bind(host);
 const originalReadFile=host.readFile.bind(host);
 host.fileExists=f=>f===virtualFile||originalFileExists(f);
 host.readFile=f=>f===virtualFile?contract:originalReadFile(f);
 host.getSourceFile=(f,l,onError,newFile)=>f===virtualFile
   ?ts.createSourceFile(f,contract,l,true)
   :originalGetSourceFile(f,l,onError,newFile);
 const program=ts.createProgram([virtualFile],compilerOptions,host);
 const errors=ts.getPreEmitDiagnostics(program).filter(d=>d.category===ts.DiagnosticCategory.Error);
 assert.equal(errors.length,0,errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('\n'));
});
const systemAst=ts.createSourceFile(systemPath,system,ts.ScriptTarget.ES2022,true);
const systemClass=systemAst.statements.find(node=>ts.isClassDeclaration(node)&&node.name?.text==='SystemPage');
check('system class remains intact',()=>assert.ok(systemClass));
const property=systemClass.members.find(node=>node.name?.getText(systemAst)==='orbitalInfrastructureDebug');
check('missing template binding exists',()=>{
 assert.ok(property);
 assert.ok(ts.isGetAccessorDeclaration(property) || ts.isPropertyDeclaration(property));
});
check('debug flag uses the existing query parameter',()=>assert.ok(system.includes("queryParamMap.get('debugOrbital') === '1'")));
check('safe default and no changes to detection',()=>{
 assert.ok(system.includes('stripSystemSceneBiologyVisuals387(snapshot)'));
 assert.ok(system.includes('systemSceneBiologyIdentity387(model)'));
});
const mockLevels = {CONFIRMED:'CONFIRMED',CATALOGUED:'CATALOGUED'};
const source=ts.transpileModule(visual,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const compiledModule={exports:{}};
const mockRequire=name=>{
 if(name.includes('archive-stellar-system-card')) return {ArchiveStellarSystemKnowledgeLevel:mockLevels};
 if(name.includes('discovery-state')) return {DiscoveryState:{CONFIRMED:{code:5}}};
 throw new Error('unexpected runtime dependency '+name);
};
new Function('module','exports','require',source)(compiledModule,compiledModule.exports,mockRequire);
const api=compiledModule.exports;
const profile={floraSpeciesCount:3,coverageFraction01:.4,lushness01:.5,paletteHexes:['#64ae49']};
const recs=api.civilizationVisualMapOf([{bodyIndex:'0',tier:null,vegetationProfile:profile}]);
const base={knowledgeLevel:'CONFIRMED',discoveryStateCode:5,planets:[{id:'planet-1',visualCivilizationTier:null,visualVegetationProfile:null}],stars:[]};
check('confirmed no-civilization biosphere remains available',()=>{
 const res=api.decorateSystemSceneSnapshotWithCivilizationTiers(base,recs);
 assert.equal(res.planets[0].visualCivilizationTier,null);
 assert.equal(res.planets[0].visualVegetationProfile,profile);
});
for(const [level,code] of [['CATALOGUED',4],['CONFIRMED',4]]){
 check('blocked biology for '+level+'/'+code,()=>{
  const res=api.decorateSystemSceneSnapshotWithCivilizationTiers({...base,knowledgeLevel:level,discoveryStateCode:code},recs);
  assert.equal(res.planets[0].visualCivilizationTier,null);
  assert.equal(res.planets[0].visualVegetationProfile,null);
 });
}
check('VIDA.7 explicit tier is still supported',()=>{
 const res=api.decorateSystemSceneSnapshotWithCivilizationTiers(base,
   api.civilizationVisualMapOf([{bodyIndex:'0',tier:'ADVANCED',vegetationProfile:profile}]));
 assert.equal(res.planets[0].visualCivilizationTier,'ADVANCED');
});
check('tests cover null tier and blocking',()=>{
 assert.ok(tests.includes('tier: null'));
 assert.ok(tests.includes('blocks even a vegetation-only record'));
});
console.log(`PASS GENESIS 38.7a — ${passed} verificaciones portátiles de tipado estructural y aislamiento biológico.`);
