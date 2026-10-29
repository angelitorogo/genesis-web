/** VIDA.9: background materialization after the public catalogue returns.
 * Runs only on CONFIRMED V3 generated bodies, independently of individual detail visits.
 * No discovery state mutation, no real-time timestamps, no fake physics on minor moons.
 */
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import type { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import type { GalaxyKnowledgePlanetMoonCatalogSnapshot } from './galaxy-planet-moon-catalog-snapshot.runtime';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieVida9BiologyExplorationRepository } from '../../data/local/repository/dexie-vida9-biology-exploration.repository';
import type { PlanetScientificResolvedTarget } from '../../simulation/planetary/planet-scientific-target-resolver';
import { vida9V3ConfirmedPhysicalTargets, type Vida9V3ConfirmedPhysicalTargets } from './vida9-v3-confirmed-physical-targets';
import { Vida2PhysicalInput } from '../../simulation/life/life-plausibility-physical-adapter-vida2';
import { ProceduralMicrobialLifeVIDA3 } from '../../simulation/life/procedural-microbial-life-vida3';
import { ProceduralEcologyVIDA4 } from '../../simulation/life/procedural-ecology-vida4';
import { Vida5aEcologyAtmosphere } from '../../simulation/life/vida5a-ecology-atmosphere';
import { Vida5bEcologicalMaturation } from '../../simulation/life/vida5b-ecological-maturation';
import { Vida5cAdvancedBiospheres } from '../../simulation/life/vida5c-advanced-biospheres';
import { Vida6EcosystemsSpecies } from '../../simulation/life/vida6-ecosystems-species';
import { Vida7IntelligenceCivilizations } from '../../simulation/life/vida7-intelligence-civilizations';
import { Vida8TechnologicalColonization } from '../../simulation/life/vida8-technological-colonization';
import { Vida8LocalOriginDiscovery } from '../../simulation/life/vida8-local-origin-discovery';
import { Vida9BiologyExploration } from '../../simulation/life/vida9-biology-exploration';
import type { Vida3BodyIdentity } from '../../domain/life/procedural-microbial-vida3';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';

export interface Vida9IndexResult { readonly indexed:number; readonly withoutPhysicalModel:number;
  readonly civilizationBodyKeys?:readonly string[]; }

export class Vida9ConfirmedSystemBiologyIndexer {
  private readonly repository:DexieVida9BiologyExplorationRepository;
  constructor(database:GenesisIndexedDb){ this.repository=new DexieVida9BiologyExplorationRepository(database); }
  async ensureConfirmedCatalog(generationKey:UniverseGenerationKey,
    catalogue:GalaxyKnowledgePlanetMoonCatalogSnapshot):Promise<Vida9IndexResult>{
    if(generationKey.generatorVersion!==GeneratorVersion.V3)return {indexed:0,withoutPhysicalModel:0};
    const seed=generationKey.universeSeed.serialize();
    let indexed=0,withoutPhysicalModel=0;
    const civilizationBodyKeys:string[]=[];
    const originsKey=(loc:BodyLocator)=>({universeSeed:seed,generatorVersionCode:3,
      galaxyIndex:String(loc.galaxyIndex),sectorKey:String(loc.sectorKey),
      galacticObjectIndex:String(loc.galacticObjectIndex)});
    // Each CONFIRMED system resolves ONE physical V3 adapter. Public ordinals
    // (especially B/C/P in a multiple) must never reach the legacy V1 resolver.
    const systems=new Map<string,Vida9V3ConfirmedPhysicalTargets|null>();
    const systemKey=(loc:BodyLocator)=>[loc.galaxyIndex,loc.sectorKey,loc.galacticObjectIndex].join('/');
    const sourceForSystem=(loc:BodyLocator):Vida9V3ConfirmedPhysicalTargets|null=>{
      const id=systemKey(loc);
      if(systems.has(id))return systems.get(id)!;
      const source=vida9V3ConfirmedPhysicalTargets(generationKey,
        new SystemLocator(loc.galaxyIndex,loc.sectorKey,loc.galacticObjectIndex));
      systems.set(id,source);
      return source;
    };
    // Known physical nonconvergence is local to a body. A corruption of seed,
    // identity or stored record must still fail rather than be silently hidden.
    const physicalOrNull=<T>(evaluate:()=>T):T|null=>{
      try{return evaluate();}catch(error){
        if(error instanceof Error && error.message.includes('NON_CONVERGED_PHASE_MODEL'))return null;
        throw error;
      }
    };
    const planetFor=(loc:BodyLocator)=>physicalOrNull(()=>sourceForSystem(loc)?.resolvePlanet(loc)??null);
    const originSources=new Map<string,ReturnType<typeof Vida8LocalOriginDiscovery.findInSystem>>();
    const sourcesFor=(loc:BodyLocator)=>{
      const systemId=systemKey(loc);
      const cached=originSources.get(systemId);
      if(cached)return cached;
      const adapter=sourceForSystem(loc);
      if(!adapter)return [];
      const resolved=Vida8LocalOriginDiscovery.findInSystem(
        originsKey(loc),adapter.planetCount,(i)=>planetFor(new BodyLocator(
          loc.galaxyIndex,loc.sectorKey,loc.galacticObjectIndex,i)),true);
      originSources.set(systemId,resolved);
      return resolved;
    };
    const makeIdentity=(loc:BodyLocator,kind:'PLANET'|'MOON',moonIndex:string|null):Vida3BodyIdentity=>({
      ...originsKey(loc),kind,bodyIndex:String(loc.bodyIndex),moonIndex});
    const build=(id:Vida3BodyIdentity,physical:ReturnType<typeof Vida2PhysicalInput.planet>,
      source:ReturnType<typeof sourcesFor>,solidSurface:boolean,
      planetTarget:PlanetScientificResolvedTarget|null):Vida9BiologyRecord=>{
      const micro=ProceduralMicrobialLifeVIDA3.evaluate(id,physical);
      const ecological=ProceduralEcologyVIDA4.evaluate(micro);
      const coupling=id.kind==='PLANET' && planetTarget &&
        Array.isArray(planetTarget.detail.atmosphere.retainedGasComposition)
        ? Vida5aEcologyAtmosphere.evaluate(ecological,planetTarget):null;
      const mature=coupling?Vida5bEcologicalMaturation.evaluate(coupling):null;
      const calibrated=id.kind==='PLANET' && planetTarget && mature
        ? Vida5cAdvancedBiospheres.evaluate(micro,ecological,mature,planetTarget):undefined;
      const ecosystem=Vida6EcosystemsSpecies.evaluate(micro,ecological,calibrated);
      const intelligence=Vida7IntelligenceCivilizations.evaluate(ecosystem,calibrated);
      const colonial=Vida8TechnologicalColonization.evaluate({ecosystem,nativeCivilization:intelligence,
        physical,solidSurface},source);
      return Vida9BiologyExploration.evaluate(ecosystem,intelligence,colonial);
    };
    const planets=[...catalogue.planets].filter(p=>p.locator!==null && p.stateName==='CONFIRMED')
      .sort((a,b)=>a.id.localeCompare(b.id));
    const moons=[...catalogue.moons].filter(m=>m.stateName==='CONFIRMED')
      .sort((a,b)=>a.id.localeCompare(b.id));
    const hostCache=new Map<string,PlanetScientificResolvedTarget|null>();
    // The VIDA.9 table is immutable: do not rebuild an existing body merely
    // because the catalogue now uses a different V3 physical projection.
    // Validate the stored record first; an invalid digest must still fail.
    const existingFor=async(id:Vida3BodyIdentity)=>this.repository.get(
      id.universeSeed,id.generatorVersionCode,ProceduralMicrobialLifeVIDA3.bodyStorageKey(id));
    for(const planet of planets){
      const loc=planet.locator;
      if(!loc)continue;
      const identity=makeIdentity(loc,'PLANET',null);
      const stored=await existingFor(identity);
      if(stored){
        if(stored.nativeCivilizationPresent)civilizationBodyKeys.push(stored.bodyStorageKey);
        indexed++;
        if(indexed%8===0)await new Promise<void>(resolve=>setTimeout(resolve,0));
        continue;
      }
      const target=planetFor(loc);
      hostCache.set([loc.galaxyIndex,loc.sectorKey,loc.galacticObjectIndex,loc.bodyIndex].join('/'),target);
      if(!target){withoutPhysicalModel++;continue;}
      const record=physicalOrNull(()=>build(identity,Vida2PhysicalInput.planet(target),
        sourcesFor(loc),target.detail.surface.hasDefinedSolidSurfaceBase,target));
      if(!record){withoutPhysicalModel++;continue;}
      const saved=await this.repository.getOrInsertPreservingExisting(record);
      if(saved.nativeCivilizationPresent)civilizationBodyKeys.push(saved.bodyStorageKey);
      indexed++;
      if(indexed%8===0) await new Promise<void>(resolve=>setTimeout(resolve,0));
    }
    for(const moon of moons){
      const loc=moon.locator;
      const parent=new BodyLocator(loc.galaxyIndex,loc.sectorKey,loc.galacticObjectIndex,loc.bodyIndex);
      const identity=makeIdentity(parent,'MOON',String(loc.moonIndex));
      if(await existingFor(identity)){
        indexed++;
        if(indexed%8===0)await new Promise<void>(resolve=>setTimeout(resolve,0));
        continue;
      }
      const target=physicalOrNull(()=>sourceForSystem(parent)?.resolveMoon(parent,loc.moonIndex)??null);
      if(!target){withoutPhysicalModel++;continue;}
      const hostKey=[loc.galaxyIndex,loc.sectorKey,loc.galacticObjectIndex,loc.bodyIndex].join('/');
      const host=hostCache.has(hostKey)?hostCache.get(hostKey):planetFor(parent);
      const record=physicalOrNull(()=>build(identity,Vida2PhysicalInput.moon(target),
        host?sourcesFor(parent):[],true,null));
      if(!record){withoutPhysicalModel++;continue;}
      await this.repository.getOrInsertPreservingExisting(record);indexed++;
      if(indexed%8===0) await new Promise<void>(resolve=>setTimeout(resolve,0));
    }
    return {indexed,withoutPhysicalModel,civilizationBodyKeys};
  }
}
