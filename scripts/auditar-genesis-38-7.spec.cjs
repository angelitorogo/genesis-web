/** GENESIS 38.7 — Auditoría portátil de autorización biológica de escenas 3D.
 * Solo lee archivos. No toca IndexedDB, semilla ni geometrías existentes. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const get=(name)=>fs.readFileSync(path.join(root,'src/app/presentation',name),'utf8');
let checks=0;
function check(name,fn){try{fn();checks++;}catch(error){console.error('FAIL 38.7:',name);throw error;}}
const source={
  visuals:get('system/system-scene-civilization-visuals.ts'),
  page:get('system/system.ts'),
  scene:get('system/system-scene.ts'),
  source:get('system/system-scene-civilization-visuals.data-source.ts'),
  37:get('system/system-technosignature-37a.data-source.ts'),
  species:get('life-species-visual/vida38-species-visual-preview-scene.ts'),
  visualContract:get('life-species-visual/vida38-species-visual-contract.ts'),
  authorize:get('life-species-detail/vida38-acceso-ficha-38-5.ts'),
  detail:get('life-species-detail/life-species-detail.ts'),
  flora:get('system/system-scene-planet-surface-texture.ts'),
  vegetation:get('planet-detail/planet-vegetation-preview-profile-visbio.ts'),
};
const compile=(code)=>{
  const result=ts.transpileModule(code,{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  if(errors.length)throw Error(errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('\n'));
  return result.outputText;
};
function isolate(sourceText,names){
  const sf=ts.createSourceFile('isolated.ts',sourceText,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS);
  const members=names.map(name=>{
    const node=sf.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name);
    assert.ok(node,`Missing exported function ${name}`);
    const text=node.getText(sf);
    return text.startsWith('export ') ? text : `export ${text}`;
  });
  const module={exports:{}};
  new Function('module','exports',compile(members.join('\n'))) (module,module.exports);
  return module.exports;
}
// Executed runtime check of the real decorator, with only the enum dependency stubbed.
const stubRequire=(id)=>{
  if(id.includes('archive-stellar-system-card'))return {ArchiveStellarSystemKnowledgeLevel:{CONFIRMED:'CONFIRMED'}};
  if(id.includes('domain/discovery/discovery-state'))return {DiscoveryState:{CONFIRMED:{code:5}}};
  throw Error('Unexpected dependency '+id);
};
const moduleVisual={exports:{}};
new Function('require','module','exports',compile(source.visuals))(stubRequire,moduleVisual,moduleVisual.exports);
const decorator=moduleVisual.exports.decorateSystemSceneSnapshotWithCivilizationTiers;
const strip=moduleVisual.exports.stripSystemSceneBiologyVisuals387;
const known=moduleVisual.exports.civilizationVisualMapOf([{bodyIndex:'0',tier:'VERY_ADVANCED',vegetationProfile:{floraSpeciesCount:5}}]);
for(const level of ['DETECTED','IDENTIFIED','CATALOGUED']){
  const planet=Object.freeze({id:'planet-1',visualCivilizationTier:'ADVANCED',visualVegetationProfile:{floraSpeciesCount:2}});
  const before=Object.freeze({knowledgeLevel:level,discoveryStateCode:4,planets:Object.freeze([planet]),stars:[]});
  const after=decorator(before,known);
  check(`${level}: sin civilización`,()=>assert.equal(after.planets[0].visualCivilizationTier,null));
  check(`${level}: sin vegetación privada`,()=>assert.equal(after.planets[0].visualVegetationProfile,null));
  check(`${level}: instantánea original intacta`,()=>assert.equal(planet.visualCivilizationTier,'ADVANCED'));
}
check('estado CONFIRMED anterior no filtra mientras se valida identidad',()=>{
  const previous={knowledgeLevel:'CONFIRMED',discoveryStateCode:5,planets:[{id:'planet-1',visualCivilizationTier:'ADVANCED',visualVegetationProfile:{floraSpeciesCount:3}}]};
  const safe=strip(previous);
  assert.equal(safe.planets[0].visualCivilizationTier,null);
  assert.equal(safe.planets[0].visualVegetationProfile,null);
});
check('CONFIRMED: sigue autorizando visuales',()=>{
  const snapshot={knowledgeLevel:'CONFIRMED',discoveryStateCode:5,stars:[],planets:[{id:'planet-1'}]};
  const result=decorator(snapshot,known);
  assert.equal(result.planets[0].visualCivilizationTier,'VERY_ADVANCED');
});
check('un escenario con etiqueta CONFIRMED y código no confirmado nunca filtra',()=>{
  const suspect={knowledgeLevel:'CONFIRMED',discoveryStateCode:4,stars:[],planets:[{id:'planet-1',visualCivilizationTier:'ADVANCED',visualVegetationProfile:{floraSpeciesCount:5}}]};
  const safe=decorator(suspect,known);
  assert.equal(safe.planets[0].visualCivilizationTier,null);
  assert.equal(safe.planets[0].visualVegetationProfile,null);
});
const identity=isolate(source.page,['systemSceneBiologyIdentity387']).systemSceneBiologyIdentity387;
const address={universeSeed:'S',generatorVersionCode:3,galaxyIndex:1n,sectorKey:2n,galacticObjectIndex:3n};
const id=identity(address);
for(const changed of [{universeSeed:'T'},{generatorVersionCode:2},{galaxyIndex:4n},{sectorKey:5n},{galacticObjectIndex:6n}]){
  check('identidad asíncrona distinta',()=>assert.notEqual(identity({...address,...changed}),id));
}
check('sin identidad al faltar sistema',()=>assert.equal(identity(null),null));
const tiers=isolate(source.species,['vida38CanonicalCivilizationTier387','civilizationLevelFrom']);
for(const tier of ['PRIMITIVE','ADVANCED','VERY_ADVANCED']){
  check('civilización canónica '+tier,()=>assert.equal(tiers.vida38CanonicalCivilizationTier387({intelligence:{lineage:'REPTILIAN',civilizationTier:tier}}),tier));
}
check('inteligencia sin civilización',()=>assert.equal(tiers.civilizationLevelFrom({intelligence:{lineage:'REPTILIAN',civilizationTier:null}}),null));
check('señal tecnológica no eleva civilización',()=>assert.equal(tiers.civilizationLevelFrom({intelligence:{lineage:'REPTILIAN',civilizationTier:null,civilizationLevel:'VERY_ADVANCED',technosignature:'CANDIDATE'}}),null));
check('sin inteligencia = sin civilización',()=>assert.equal(tiers.civilizationLevelFrom({intelligence:null}),null));
check('fixture antiguo reconoce nivel explícito, no infiere',()=>assert.equal(tiers.civilizationLevelFrom({intelligence:{lineage:'REPTILIAN',civilizationLevel:'ADVANCED'}}),'ADVANCED'));
check('fixture antiguo no inventa PRIMITIVE',()=>assert.equal(tiers.civilizationLevelFrom({intelligence:{lineage:'REPTILIAN'}}),null));
for(const [name,text] of Object.entries(source))check('sintaxis '+name,()=>{
  const sf=ts.createSourceFile(`${name}.ts`,text,ts.ScriptTarget.ES2022,true);
  assert.equal(sf.parseDiagnostics.length,0);
});
check('SystemScene no llama el renderer de especies privadas',()=>assert.ok(!source.scene.includes('createVida38SpeciesPreviewModelV1(')));
check('SystemScene no lee registros VIDA.9 privados',()=>assert.ok(!source.scene.includes('privateBiologicalRecordsVIDA9')));
check('consulta sistémica exige confirmado',()=>assert.match(source.source,/!request\.confirmed/));
check('consulta sistémica valida VIDA.9',()=>assert.match(source.source,/extractConfirmedCivilization\(/));
check('37.A no construye 3D de especies',()=>assert.ok(!source[37].includes('createVida38SpeciesPreviewModelV1(')));
check('ficha confirma identidad de destino',()=>assert.match(source.authorize,/record\.bodyStorageKey !== expectedBody/));
check('ficha confirma estado persistido',()=>assert.match(source.authorize,/DiscoveryState\.CONFIRMED\.code/));
check('ficha consume solo contrato autorizado',()=>assert.match(source.detail,/vida38AuthorizeSpeciesRoute385\(/));
check('reconstrucción no es imagen observada',()=>{
  assert.match(source.visualContract,/representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION'/);
  assert.match(source.visualContract,/observedImageAvailable: false/);
});
check('vegetación sin perfil VIDA no se genera',()=>assert.match(source.flora,/vegetationProfile === null \? \[\]/));
check('perfil vegetal exige plantas VIDA',()=>assert.match(source.vegetation,/!ecosystem\.effectiveGroups\.includes\('PLANTS_TREES'\)/));
check('resultados asíncronos vinculados a identidad exacta',()=>{
  assert.match(source.page,/sceneIdentity === this\.sceneCivilizationIdentity\(\)/);
  assert.match(source.page,/stripSystemSceneBiologyVisuals387\(snapshot\)/);
  assert.match(source.page,/requestId !== this\.civilizationVisualsRequestId/);
});
console.log(`PASS GENESIS 38.7: ${checks} comprobaciones portátiles · no filtración, procedencia, identidad asíncrona y niveles de conocimiento.`);
