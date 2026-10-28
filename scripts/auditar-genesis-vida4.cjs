#!/usr/bin/env node
'use strict';
/** VIDA.4: sampled, read-only cumulative ecological regeneration. NOT a full census. */
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
function args(argv) {
  const o={seed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',galaxies:[0,1,2],systems:20,maxSectors:4000,out:'docs/audits/vida3'};
  for(const arg of argv){const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error(`Opción no válida ${arg}`);
    if(m[1]==='seed')o.seed=m[2].toUpperCase();else if(m[1]==='galaxies')o.galaxies=m[2].split(',').map(Number);
    else if(m[1]==='systems')o.systems=Number(m[2]);else if(m[1]==='max-sectors')o.maxSectors=Number(m[2]);
    else if(m[1]==='out')o.out=m[2];else throw Error(`Opción desconocida ${arg}`);}
  if(!/^[0-9A-F]{4}(?:-[0-9A-F]{4}){7}$/.test(o.seed)||
     !o.galaxies.length||o.galaxies.some(x=>!Number.isSafeInteger(x)||x<0)||
     !Number.isSafeInteger(o.systems)||o.systems<1||o.systems>200||
     !Number.isSafeInteger(o.maxSectors)||o.maxSectors<o.systems||o.maxSectors>20000)throw Error('Parámetros inválidos');
  return o;
}
function registerTs(){const ts=require('typescript'); if(!require.extensions['.ts']) require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);}
function candidateCoords(seed, galaxy, extent, count){
  const out=[],seen=new Set();let n=0;
  for(let i=0;i<count*8&&out.length<count;i++){
    const h=crypto.createHash('sha256').update(`${seed}|${galaxy}|VIDA3_SECTOR|${i}`).digest();
    const ring=(i%4+1)/4;
    const r=extent*(ring-0.2*Math.sqrt(h.readUInt32BE(0)/0x100000000));
    const angle=(i%4+h.readUInt32BE(4)/0x100000000)*Math.PI/2;
    const x=Math.round(Math.max(-extent,Math.min(extent,r*Math.cos(angle))));
    const y=Math.round(Math.max(-extent,Math.min(extent,r*Math.sin(angle))));
    const key=`${x}:${y}`; if(x===0&&y===0||seen.has(key))continue;
    seen.add(key);out.push({x,y});n++;
  }
  return out;
}
function run(o){
  registerTs();const load=n=>require(path.resolve('src/app',n));
  const {UniverseSeed}=load('domain/universe/universe-seed.ts');
  const {UniverseGenerationKey}=load('domain/generation/universe-generation-key.ts');
  const {GeneratorVersion}=load('domain/generation/generator-version.ts');
  const {GalaxyGenerator}=load('simulation/universe/galaxy-generator.ts');
  const {GalaxySectorGridGenerator}=load('simulation/sector/galaxy-sector-grid-generator.ts');
  const {GalaxySectorContentGenerator}=load('simulation/sector/galaxy-sector-content-generator.ts');
  const {GalaxySectorCoordinates}=load('domain/sector/galaxy-sector-coordinates.ts');
  const {StellarMultihostFormation}=load('simulation/stellar/stellar-multihost-formation.ts');
  const {PlanetScientificTargetResolver}=load('simulation/planetary/planet-scientific-target-resolver.ts');
  const {Vida2PhysicalInput}=load('simulation/life/life-plausibility-physical-adapter-vida2.ts');
  const {ProceduralMicrobialLifeVIDA3}=load('simulation/life/procedural-microbial-life-vida3.ts');
  const {ProceduralEcologyVIDA4}=load('simulation/life/procedural-ecology-vida4.ts');
  const gkey=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V3);
  const result={contract:'VIDA.4/sample/ecology/v1',seed:o.seed,systemsPerGalaxyRequested:o.systems,
    isFullGalacticCensus:false,galaxies:[],errors:[]};
  for(const gi of o.galaxies){
    const galaxy=GalaxyGenerator.generate(gkey,BigInt(gi));const grid=GalaxySectorGridGenerator.generate(galaxy);
    const sample={index:gi,name:galaxy.designation.name,systems:0,planets:0,moons:0,counts:[],physicalGaps:[],errors:[]};const snapshots=[];
    for(const pos of candidateCoords(o.seed,gi,grid.halfExtentInSectors,o.maxSectors)){
      if(sample.systems>=o.systems)break;
      try {
        const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
        if(!sector.systemLocators.length)continue;
        const hash=crypto.createHash('sha256').update(`${gi}|${pos.x}|${pos.y}|SYSTEM_INDEX`).digest();
        const loc=sector.systemLocators[hash.readUInt32BE(0)%sector.systemLocators.length];
        const multi=StellarMultihostFormation.generateOrNull(gkey,loc);
        const single=multi?null:StellarMultihostFormation.generateSingleOrNull(gkey,loc);
        if(!multi&&!single)continue;
        const worlds=multi?.publicPlanets??single.planets.map((planet,i)=>({planet,atmosphere:single.atmospheres[i],moonSystem:single.moonSystems[i]}));
        const systemSnap=[];
        for(let i=0;i<worlds.length;i++){
          const w=worlds[i],phys=w.planet,body=w.publicLocator??phys.locator;
          const v3=PlanetScientificTargetResolver.projectGenerated({locator:body,planetOrdinal:i+1,
            designation:`Mundo ${i+1}`,hostSystemDesignation:sample.name,
            orbitTopology:phys.hostPlanetarySystem.architecture.orbitTopology,hostPlanetCount:worlds.length},
            phys,w.atmosphere,w.moonSystem,undefined,undefined,3);
          const base={universeSeed:o.seed,generatorVersionCode:3,
            galaxyIndex:body.galaxyIndex.toString(),sectorKey:body.sectorKey.toString(),
            galacticObjectIndex:body.galacticObjectIndex.toString(),bodyIndex:body.bodyIndex.toString()};
          systemSnap.push(ProceduralEcologyVIDA4.evaluate(ProceduralMicrobialLifeVIDA3.evaluate({...base,kind:'PLANET',moonIndex:null},Vida2PhysicalInput.planet(v3))));
          for(const moon of v3.detail.moons.relevantMoons){
            // Minimal, typed data consumed by VIDA.2; no extra chemical/history calculation.
            const target={detail:{environment:moon,tides:{tidalHeatingIndex01:moon.tidalHeatingIndex01}}};
            systemSnap.push(ProceduralEcologyVIDA4.evaluate(ProceduralMicrobialLifeVIDA3.evaluate({...base,kind:'MOON',moonIndex:String(moon.moonIndex)},Vida2PhysicalInput.moon(target))));
          }
        }
        snapshots.push(...systemSnap);sample.systems++;
      } catch(error) {
        const issue={sector:`${pos.x}:${pos.y}`,message:String(error?.message??error)};
        // A non-convergent physical phase is a real coverage gap, not proof of sterile worlds.
        if (/NON_CONVERGED_PHASE_MODEL/.test(issue.message)) sample.physicalGaps.push(issue);
        else sample.errors.push({...issue,stack:String(error?.stack??error)});
      }
    }
    const unique=new Set(snapshots.map(s=>s.bodyStorageKey));if(unique.size!==snapshots.length)sample.errors.push({message:'DUPLICATED_IDENTITY'});
    sample.counts=ProceduralEcologyVIDA4.audit(snapshots);sample.planets=sample.counts[0].evaluated;
    sample.moons=sample.counts[1].evaluated;
    if(sample.systems!==o.systems)sample.errors.push({message:'INSUFFICIENT_SYSTEMS'});
    console.log(`${sample.name} (${gi}): ${sample.systems} sistemas, ${sample.planets} planetas, ${sample.moons} lunas; biosferas ${sample.counts.reduce((v,x)=>v+x.inhabited,0)} / complejas ${sample.counts.reduce((v,x)=>v+x.complexEstablished,0)}; huecosFisicos=${sample.physicalGaps.length}; errores=${sample.errors.length}`);
    result.galaxies.push(sample);result.errors.push(...sample.errors.map(e=>({galaxy:gi,...e})));
  }
  const markdown=['# VIDA.4 — Auditoría de jerarquía ecológica procedural',
    `Semilla: ${o.seed}. Muestra sectorial determinista, **no censo** de toda la galaxia.`,
    'Solo lectura; no modifica las partidas ni la IndexedDB. No valida detección de vida.',
    '', '| Galaxia | Sistemas | Vida planetaria | Vida lunar | Compleja planetaria | Compleja lunar | Preparados para civilización | Huecos físicos | Errores |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|'];
  for(const g of result.galaxies)markdown.push(`| ${g.name} | ${g.systems} | ${g.counts[0].inhabited} | ${g.counts[1].inhabited} | ${g.counts[0].complexEstablished} | ${g.counts[1].complexEstablished} | ${g.counts.reduce((n,x)=>n+x.fullEcosystem,0)} | ${g.physicalGaps.length} | ${g.errors.length} |`);
  markdown.push('', 'Los huecos físicos quedan excluidos, no etiquetados como mundos estériles. La tirada independiente de complejidad es del 30% entre biosferas microbianas. Los microhábitats lunares protegidos solo admiten microbios.');
  fs.mkdirSync(o.out,{recursive:true});fs.writeFileSync(path.join(o.out,'auditoria-vida4.json'),JSON.stringify(result,null,2));
  fs.writeFileSync(path.join(o.out,'auditoria-vida4.md'),markdown.join('\n')+'\n');
  if(result.errors.length)process.exitCode=1;
  return result;
}
if(require.main===module){try{run(args(process.argv.slice(2)));}catch(e){console.error(e);process.exitCode=1;}}
module.exports={args,candidateCoords,run};
