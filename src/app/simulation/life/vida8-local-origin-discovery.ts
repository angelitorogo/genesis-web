/** VIDA.8 — reconstruir UNICAMENTE civilizaciones nativas verificadas de planetas
 * del mismo sistema. Otras galaxias/sistemas requieren rutas reales de transporte,
 * por lo que no se inventan colonizadores interestelares en esta revision.
 */
import { Vida2PhysicalInput } from './life-plausibility-physical-adapter-vida2';
import { ProceduralMicrobialLifeVIDA3 } from './procedural-microbial-life-vida3';
import { ProceduralEcologyVIDA4 } from './procedural-ecology-vida4';
import { Vida5aEcologyAtmosphere } from './vida5a-ecology-atmosphere';
import { Vida5bEcologicalMaturation } from './vida5b-ecological-maturation';
import { Vida5cAdvancedBiospheres } from './vida5c-advanced-biospheres';
import { Vida6EcosystemsSpecies } from './vida6-ecosystems-species';
import { Vida7IntelligenceCivilizations } from './vida7-intelligence-civilizations';
import type { PlanetScientificResolvedTarget } from '../planetary/planet-scientific-target-resolver';
import type { Vida8CivilizationSource } from './vida8-technological-colonization';

export interface Vida8LocalSystemKey {
  readonly universeSeed:string; readonly generatorVersionCode:number;
  readonly galaxyIndex:string; readonly sectorKey:string; readonly galacticObjectIndex:string;
}
export class Vida8LocalOriginDiscovery {
  private constructor(){}
  /** Bounded deterministic cache for authorized default resolver; no DB and no RNG state. */
  private static readonly cache = new Map<string,readonly Vida8CivilizationSource[]>();
  /** Up to 64 planets, discovered through the SAME physical V3 resolver as the target. */
  static findInSystem(key:Vida8LocalSystemKey,planetCount:number,
    resolve:(planetIndex:bigint)=>PlanetScientificResolvedTarget|null,
    cacheDefaultResolver=false):readonly Vida8CivilizationSource[] {
    if(key.generatorVersionCode!==3 || !Number.isSafeInteger(planetCount) || planetCount<0 || planetCount>64)
      return [];
    const cacheKey=[key.universeSeed,key.generatorVersionCode,key.galaxyIndex,
      key.sectorKey,key.galacticObjectIndex,planetCount].join('|');
    if(cacheDefaultResolver){const cached=this.cache.get(cacheKey);if(cached)return cached;}
    const sources:Vida8CivilizationSource[]=[];
    for(let i=0;i<planetCount;i++){
      const physical=resolve(BigInt(i));
      if(!physical)continue;
      const micro=ProceduralMicrobialLifeVIDA3.evaluate({...key,kind:'PLANET',
        bodyIndex:String(i),moonIndex:null},Vida2PhysicalInput.planet(physical));
      const ecology=ProceduralEcologyVIDA4.evaluate(micro);
      const coupled=Array.isArray(physical.detail.atmosphere.retainedGasComposition)
        ? Vida5aEcologyAtmosphere.evaluate(ecology,physical):null;
      const matured=coupled ? Vida5bEcologicalMaturation.evaluate(coupled):null;
      const calibrated=matured ? Vida5cAdvancedBiospheres.evaluate(micro,ecology,matured,physical):undefined;
      const ecosystem=Vida6EcosystemsSpecies.evaluate(micro,ecology,calibrated);
      const civilization=Vida7IntelligenceCivilizations.evaluate(ecosystem,calibrated);
      if(civilization.civilization &&
          (civilization.civilization.tier==='ADVANCED'||civilization.civilization.tier==='VERY_ADVANCED'))
        sources.push({ecosystem,civilization});
    }
    const result=Object.freeze(sources);
    if(cacheDefaultResolver){
      this.cache.set(cacheKey,result);
      if(this.cache.size>24)this.cache.delete(this.cache.keys().next().value!);
    }
    return result;
  }
}
