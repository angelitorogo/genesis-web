#!/usr/bin/env node
'use strict';
/** GENESIS 38.2i.a — auditoría CPU, geometría, morfología y determinismo. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
let ts;try{ts=require('typescript');}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');}
const root='src/app/presentation/life-species-visual';
for(const f of ['vida38-bird-morphology-38-2i.ts','vida38-bird-organic-field-38-2i.ts',
    'vida38-bird-materials-38-2i.ts','vida38-birds-refinement-38-2ia.spec.ts']){
  const file=`${root}/${f}`;
  const result=ts.transpileModule(fs.readFileSync(file,'utf8'),
    {fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,`Sintaxis inválida ${file}`);
}
const previous=require.extensions['.ts'];
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),
  {fileName:f,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,f);
try{
  const {VIDA38_BIRD_ARCHETYPES,deriveVida38BirdMorphology38I}=require(`${process.cwd()}/${root}/vida38-bird-morphology-38-2i.ts`);
  const {buildVida38BirdRawMeshV1,auditVida38BirdRawMeshV1,
    deriveVida38BirdLegLandmarks38IA,deriveVida38BirdLandmarks38I}=require(`${process.cwd()}/${root}/vida38-bird-organic-field-38-2i.ts`);
  const c={speciesId:'GENESIS:38.2i.a:sample',variantSeedUint32:0x63abcd90,
    morphology:{group:'BIRDS',bodyPlan:'WINGED',covering:'FEATHERS',appendagePairs:2},
    ecology:{habitat:'SURFACE_AIR',nutrition:'OMNIVORE',niche:'SURFACE_AIR/OMNIVORE'},
    locomotion:'FLYING',bodyLengthMeters:.92,
    pigmentation:{primaryColorHex:'#998877',secondaryColorHex:'#556677',pattern:'MOTTLED'},adaptations:['AERIAL_STABILITY']};
  const profiles={};let triangles=0;
  for(const archetype of VIDA38_BIRD_ARCHETYPES){
    const v={...c,speciesId:`GENESIS:bird:${archetype}`};
    const m=deriveVida38BirdMorphology38I(v,archetype);
    assert.deepEqual(m,deriveVida38BirdMorphology38I(v,archetype));
    assert.deepEqual(m,deriveVida38BirdMorphology38I({...v,pigmentation:{...v.pigmentation,primaryColorHex:'#000000'}},archetype));
    assert.equal(m.sourceLengthMeters,c.bodyLengthMeters);
    assert.ok(m.revision.includes('38.2i.a'));
    const leg=deriveVida38BirdLegLandmarks38IA(m,-1);
    assert.ok(leg.hip[1]>leg.knee[1] && leg.knee[1]>leg.hock[1] && leg.hock[1]>leg.ankle[1],`${archetype}: articulación vertical`);
    assert.ok(leg.hock[2]<leg.knee[2],`${archetype}: flexión de corvejón`);
    assert.equal(leg.frontToes.length,3);
    assert.ok(leg.frontToes.every(t=>t[2]>leg.ankle[2]));
    assert.ok(leg.hallux[2]<leg.ankle[2]);
    const raw=buildVida38BirdRawMeshV1(m,'LOW');
    const audit=auditVida38BirdRawMeshV1(raw);
    for(const k of ['invalid','boundaryEdges','nonManifoldEdges','inconsistentEdges'])assert.equal(audit[k],0,`${archetype}: ${k}`);
    assert.equal(audit.components,1,`${archetype}: malla desconectada`);
    profiles[archetype]=m;triangles+=audit.triangleCount;
  }
  const wader=profiles.WADER,passerine=profiles.PASSERINE,glider=profiles.GLIDER,heavy=profiles.HEAVY,cursorial=profiles.CURSORIAL;
  assert.ok(wader.legLength>heavy.legLength*1.5);
  assert.ok(wader.billLength>passerine.billLength*1.8);
  assert.ok(glider.wingSpan>cursorial.wingSpan*2);
  assert.ok(deriveVida38BirdLandmarks38I(glider).wingTipX>deriveVida38BirdLandmarks38I(heavy).wingTipX*1.75);
  const material=fs.readFileSync(`${root}/vida38-bird-materials-38-2i.ts`,'utf8');
  assert.ok(material.includes('const secondaries=') && material.includes('const primaries='));
  assert.ok(material.includes('const streamers='));
  assert.ok(material.includes('fwidth') && !material.includes('gl_FragCoord'));
  console.log(`GENESIS_38_2IA_AUDIT_OK | arquetipos=7 | triangulos=${triangles} | pies 3+1 | SDF cerrado | determinista`);
}finally{if(previous)require.extensions['.ts']=previous;else delete require.extensions['.ts'];}
