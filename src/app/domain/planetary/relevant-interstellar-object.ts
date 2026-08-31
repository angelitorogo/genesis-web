import type { InterstellarObjectIdentity } from './interstellar-object-identity'; import type { InterstellarObjectProperties } from './interstellar-object-properties'; import type { InterstellarObjectTrajectory } from './interstellar-object-trajectory';
export class RelevantInterstellarObject {
  constructor(readonly identity:InterstellarObjectIdentity, readonly properties:InterstellarObjectProperties, readonly trajectory:InterstellarObjectTrajectory){ if(identity.encounterOrdinal!==properties.encounterOrdinal) throw new RangeError('Interstellar identity and properties must share the same ordinal.'); }
  get encounterOrdinal(){return this.identity.encounterOrdinal;} get proceduralId(){return this.identity.proceduralId;} get localDesignation(){return this.identity.localDesignation;} get compositionRegime(){return this.properties.compositionRegime;} get diameterKilometers(){return this.properties.diameterKilometers;} get isBound(){return false;} get isDiscoverable(){return true;}
}
