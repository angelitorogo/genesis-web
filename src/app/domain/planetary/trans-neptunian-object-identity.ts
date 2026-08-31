import type { SystemLocator } from '../generation/procedural-locator';
import type { SystemSeed } from '../seed/hierarchical-seeds';
const ID=/^[0-9A-F]{32}$/;
export class TransNeptunianObjectIdentity {
  constructor(readonly systemLocator:SystemLocator, readonly systemSeed:SystemSeed, readonly objectOrdinal:number, readonly proceduralId:string){
    if(systemSeed.kind!=='system') throw new RangeError('TransNeptunianObjectIdentity requires the canonical parent SystemSeed.');
    if(!Number.isInteger(objectOrdinal)||objectOrdinal<=0) throw new RangeError('objectOrdinal must be a positive integer.');
    if(!ID.test(proceduralId)) throw new RangeError('TNO proceduralId must be an uppercase 128-bit hexadecimal value.');
  }
  get localDesignation():string { return `TNO-${String(this.objectOrdinal).padStart(3,'0')}`; }
}
