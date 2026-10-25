#!/usr/bin/env node
'use strict';
/** PRE-33.01 — prueba integrada de solo lectura en generación pública V2. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { makeCandidates } = require('./pre33/pre33-audit-core.cjs');
function registerTS(){
  const ts = require('typescript');
  if (!require.extensions['.ts']) require.extensions['.ts']=(mod,file)=>{
    const output=ts.transpileModule(fs.readFileSync(file,'utf8'), {fileName:file,
      compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
        experimentalDecorators:true,useDefineForClassFields:false}}).outputText;
    mod._compile(output,file);
  };
}
function src(s){return require(path.resolve('src/app',s));}
function parse(argv){
  const out={seed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5', galaxies:[0,1,2], systems:6,
    out:'pre33-audit',strict:false};
  for (const arg of argv){
    if(arg==='--strict')out.strict=true;
    else if(arg.startsWith('--seed='))out.seed=arg.slice(7);
    else if(arg.startsWith('--galaxies='))out.galaxies=arg.slice(11).split(',').map(Number);
    else if(arg.startsWith('--systems-per-galaxy='))out.systems=Number(arg.slice(21));
    else if(arg.startsWith('--out='))out.out=arg.slice(6);
    else throw Error(`Flag desconocido: ${arg}`);
  }
  if(!Number.isSafeInteger(out.systems)||out.systems<1||out.systems>100 ||
    !out.galaxies.length||out.galaxies.some(v=>!Number.isSafeInteger(v)||v<0))
    throw Error('Índices o muestra incorrectos');
  return out;
}
function counters(){return {planets:0,moons:0,identityOnly:0,
  pressureDivergences:0,conditionalPlanetPressure:0,independentMoonPressure:0,
  moonOceanPresent:0,moonOceanAbsent:0,moonOceanUnresolved:0,
  chemicalPowerResolved:0,doseResolved:0,errors:[],sampleSystems:[]};}
function countContract(dto,c){
  if(dto.lifeEvaluated!==false||dto.perspective!=='INTERNAL_SIMULATED_REALITY'||dto.epoch!=='CT0')
    c.errors.push(`Contract violated: ${dto.bodyKey}`);
  if(dto.bodyKind==='PLANET'){
    c.planets++;
    if(dto.atmosphere.columnRelation==='DIVERGENT')c.pressureDivergences++;
    if(dto.atmosphere.retainedSurfacePressurePascal.state==='CONDITIONAL_SCENARIO')c.conditionalPlanetPressure++;
  }else{
    c.moons++;
    if(dto.materialization==='IDENTITY_ONLY')c.identityOnly++;
    if(dto.atmosphere.physicallySupportedSurfacePressurePascal.state==='MODELLED_CT0')c.independentMoonPressure++;
    const state=dto.water.subsurfaceOceanState;
    if(state.value==='PRESENT')c.moonOceanPresent++;
    if(state.value==='ABSENT')c.moonOceanAbsent++;
    if(state.state==='UNRESOLVED')c.moonOceanUnresolved++;
  }
  if(dto.energy.extractableChemicalPowerWatts.state==='MODELLED_CT0')c.chemicalPowerResolved++;
  if(dto.radiation.surfaceIonizingDoseGrayPerYear.state==='MODELLED_CT0')c.doseResolved++;
}
function main(){
  const options=parse(process.argv.slice(2));registerTS();
  const {UniverseSeed}=src('domain/universe/universe-seed.ts');
  const {UniverseGenerationKey}=src('domain/generation/universe-generation-key.ts');
  const {GeneratorVersion}=src('domain/generation/generator-version.ts');
  const {GalaxyGenerator}=src('simulation/universe/galaxy-generator.ts');
  const {GalaxySectorGridGenerator}=src('simulation/sector/galaxy-sector-grid-generator.ts');
  const {GalaxySectorContentGenerator}=src('simulation/sector/galaxy-sector-content-generator.ts');
  const {GalaxySectorCoordinates}=src('domain/sector/galaxy-sector-coordinates.ts');
  const {StellarMultihostFormation}=src('simulation/stellar/stellar-multihost-formation.ts');
  const {multihostPhysicalSourceKey}=src('simulation/stellar/stellar-multihost-physical-source-key.ts');
  const {EnvironmentalPhysicalProjectionPRE3301: projection}=src('simulation/planetary/environmental-physical-projection-pre33-01.ts');
  const k=new UniverseGenerationKey(UniverseSeed.parse(options.seed),GeneratorVersion.V2);
  const results=[];
  for (const index of options.galaxies){
    const galaxy=GalaxyGenerator.generate(k,BigInt(index));
    const grid=GalaxySectorGridGenerator.generate(galaxy);
    const candidates=makeCandidates(options.seed,index,grid.halfExtentInSectors,Math.max(1500,options.systems*100));
    const c=counters();const sourceKey=multihostPhysicalSourceKey(k);
    for (const pos of candidates){
      if(c.sampleSystems.length>=options.systems)break;
      const coords=new GalaxySectorCoordinates(pos.x,pos.y);
      const sector=GalaxySectorContentGenerator.generate(galaxy,coords);
      if(!sector.systemLocators.length)continue;
      const indexHash=crypto.createHash('sha256').update(`${index}:${pos.x}:${pos.y}`).digest('hex');
      const loc=sector.systemLocators[parseInt(indexHash.slice(0,8),16)%sector.systemLocators.length];
      try{
        const mult=StellarMultihostFormation.generateOrNull(k,loc);
        const hosts=mult?.components??[StellarMultihostFormation.generateV2SingleOrNull(k,loc)];
        if(hosts.some(h=>!h))throw Error('Host generator returned null');
        const planets=mult?.publicPlanets?.map(x=>({p:x.planet,a:x.atmosphere,m:x.moonSystem}))??
          hosts.flatMap(h=>h.planets.map((p,i)=>({p,a:h.atmospheres[i],m:h.moonSystems[i]})));
        for (const {p,a,m} of planets){
          countContract(projection.planet(p,a),c);
          const characterized=new Set(m.relevantMoons.map(x=>x.moonOrdinal));
          for (const moon of m.relevantMoons)countContract(projection.moon(moon,p),c);
          for (const identity of m.moonIdentities)if(!characterized.has(identity.moonOrdinal))
            countContract(projection.moonIdentityOnly(identity),c);
          if(m.moonCount!==m.moonIdentities.length) c.errors.push(`Identity count mismatch planet ${p.name}`);
        }
        c.sampleSystems.push({sector:`${pos.x},${pos.y}`,planets:planets.length});
      }catch(e){c.errors.push(`${pos.x},${pos.y}: ${e.stack||e}`);}
    }
    if(c.sampleSystems.length<options.systems)c.errors.push('Insufficient systems materialized');
    results.push({galaxy:index,name:galaxy.designation.name,...c});
    console.log(`PRE-33.01 ${galaxy.designation.name}: ${c.sampleSystems.length} sistemas, ${c.planets} planetas, ${c.moons} lunas, ${c.errors.length} errores`);
  }
  const verdict=results.some(r=>r.errors.length)?'CONTRACT_VALIDATION_FAILED':'INTERNAL_CONTRACT_SAMPLE_PASSED_WITH_GAPS';
  const report={contract:'PRE-33.01/CT0/v1',seed:options.seed,galaxies:results,verdict};
  fs.mkdirSync(options.out,{recursive:true});
  const file=path.join(options.out,'pre33-01-contrato.json');
  fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n','utf8');
  console.log(`PRE-33.01: ${verdict}; ${file}`);
  if(options.strict&&verdict==='CONTRACT_VALIDATION_FAILED')process.exitCode=1;
}
try{main();}catch(e){console.error(e.stack||e);process.exitCode=1;}
