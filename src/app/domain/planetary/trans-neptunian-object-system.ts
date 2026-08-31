import type { PlanetarySystem } from './planetary-system';
import type { RelevantTransNeptunianObject } from './relevant-trans-neptunian-object';
import { TransNeptunianObjectDynamicalRegime as R } from './trans-neptunian-object-dynamical-regime';
export class TransNeptunianObjectSystem {
  readonly relevantObjects:readonly RelevantTransNeptunianObject[];
  constructor(readonly hostPlanetarySystem:PlanetarySystem, readonly sourceResidualDustMassEarth:number, readonly reservoirSupportIndex01:number, objects:readonly RelevantTransNeptunianObject[]){
    if(!Number.isFinite(sourceResidualDustMassEarth)||sourceResidualDustMassEarth<0) throw new RangeError('sourceResidualDustMassEarth must be non-negative.');
    if(!Number.isFinite(reservoirSupportIndex01)||reservoirSupportIndex01<0||reservoirSupportIndex01>1) throw new RangeError('reservoirSupportIndex01 must be inside [0,1].');
    if(sourceResidualDustMassEarth===0&&(reservoirSupportIndex01!==0||objects.length!==0)) throw new RangeError('Zero residual dust cannot support TNO analogues.');
    objects.forEach((o,i)=>{if(o.objectOrdinal!==i+1||o.identity.systemLocator!==hostPlanetarySystem.locator||o.identity.systemSeed!==hostPlanetarySystem.seed) throw new RangeError('TNOs must preserve host identity and contiguous ordinals.');});
    this.relevantObjects=Object.freeze([...objects]);
  }
  get relevantObjectCount(){return this.relevantObjects.length;} get hasRelevantObjects(){return this.relevantObjectCount>0;}
  get coldClassicalCount(){return this.relevantObjects.filter(o=>o.dynamicalRegime===R.COLD_CLASSICAL).length;}
  get hotClassicalCount(){return this.relevantObjects.filter(o=>o.dynamicalRegime===R.HOT_CLASSICAL).length;}
  get resonantCount(){return this.relevantObjects.filter(o=>o.dynamicalRegime===R.RESONANT).length;}
  get scatteredCount(){return this.relevantObjects.filter(o=>o.dynamicalRegime===R.SCATTERED).length;}
  get detachedCount(){return this.relevantObjects.filter(o=>o.dynamicalRegime===R.DETACHED).length;}
}
