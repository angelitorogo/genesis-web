import type { PlanetarySystem } from './planetary-system'; import type { RelevantInterstellarObject } from './relevant-interstellar-object';
export class InterstellarObjectSystem {
  readonly relevantObjects:readonly RelevantInterstellarObject[];
  constructor(readonly hostPlanetarySystem:PlanetarySystem, readonly encounterSupportIndex01:number, readonly instantaneousEncounterProbability01:number, objects:readonly RelevantInterstellarObject[]){
    for(const [n,v] of [['encounterSupportIndex01',encounterSupportIndex01],['instantaneousEncounterProbability01',instantaneousEncounterProbability01]] as const) if(!Number.isFinite(v)||v<0||v>1) throw new RangeError(`${n} must be inside [0,1].`);
    if(instantaneousEncounterProbability01>0.05) throw new RangeError('Point-22.8 V1 interstellar encounter probability must remain very rare.');
    if(objects.length>1) throw new RangeError('Point-22.8 V1 materializes at most one relevant interstellar encounter per system snapshot.');
    objects.forEach((o,i)=>{if(o.encounterOrdinal!==i+1||o.identity.encounterSystemLocator!==hostPlanetarySystem.locator||o.identity.encounterSystemSeed!==hostPlanetarySystem.seed||o.isBound) throw new RangeError('Interstellar objects must preserve encounter context, contiguous ordinals and unbound status.');});
    this.relevantObjects=Object.freeze([...objects]);
  }
  get relevantObjectCount(){return this.relevantObjects.length;} get hasRelevantObject(){return this.relevantObjectCount===1;} get relevantObject(){return this.relevantObjects[0]??null;}
}
