import { type KilonovaRemnantKind } from './kilonova-event-profile';
import { type KilonovaType } from './kilonova-type';

export class KilonovaStellarConsequence {
  constructor(
    readonly sourceEventKey: string,
    readonly type: KilonovaType,
    readonly remnantKind: KilonovaRemnantKind,
    readonly remnantMassSolar: number,
    readonly ejectaMassSolar: number,
    readonly rProcessMassSolar: number,
    readonly mergerStellarAgeBillionYears: number,
  ) {
    if (!sourceEventKey || ![remnantMassSolar, ejectaMassSolar, rProcessMassSolar, mergerStellarAgeBillionYears]
      .every(value => Number.isFinite(value) && value > 0)) {
      throw new RangeError('Invalid kilonova consequence.');
    }
  }
}
