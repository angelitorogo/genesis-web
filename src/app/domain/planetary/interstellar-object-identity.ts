import type { SystemLocator } from '../generation/procedural-locator';
import type { SystemSeed } from '../seed/hierarchical-seeds';
const ID=/^[0-9A-F]{32}$/;
export class InterstellarObjectIdentity {
  constructor(readonly encounterSystemLocator:SystemLocator, readonly encounterSystemSeed:SystemSeed, readonly encounterOrdinal:number, readonly proceduralId:string){
    if(encounterSystemSeed.kind!=='system') throw new RangeError('InterstellarObjectIdentity requires the canonical encounter-context SystemSeed.');
    if(!Number.isInteger(encounterOrdinal)||encounterOrdinal<=0) throw new RangeError('encounterOrdinal must be a positive integer.');
    if(!ID.test(proceduralId)) throw new RangeError('Interstellar proceduralId must be an uppercase 128-bit hexadecimal value.');
  }
  get localDesignation():string { return `ISO-${String(this.encounterOrdinal).padStart(3,'0')}`; }
}
