import type { TransNeptunianObjectIdentity } from './trans-neptunian-object-identity';
import type { TransNeptunianObjectProperties } from './trans-neptunian-object-properties';
export class RelevantTransNeptunianObject {
  constructor(readonly identity:TransNeptunianObjectIdentity, readonly properties:TransNeptunianObjectProperties){ if(identity.objectOrdinal!==properties.objectOrdinal) throw new RangeError('TNO identity and properties must share the same ordinal.'); }
  get objectOrdinal(){return this.identity.objectOrdinal;} get proceduralId(){return this.identity.proceduralId;} get localDesignation(){return this.identity.localDesignation;} get dynamicalRegime(){return this.properties.dynamicalRegime;} get diameterKilometers(){return this.properties.diameterKilometers;} get isDiscoverable(){return true;}
}
