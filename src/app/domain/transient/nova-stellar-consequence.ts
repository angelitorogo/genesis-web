import { type StellarSystemComponentLabel } from '../stellar/stellar-system-component-label';
import { type NovaType } from './nova-type';

/** 29.2: a nova preserves the white dwarf; only the accumulated surface envelope erupts. */
export class NovaStellarConsequence {
  constructor(
    readonly componentLabel: StellarSystemComponentLabel,
    readonly type: NovaType,
    readonly whiteDwarfSurvives: boolean,
    readonly preEventWhiteDwarfMassSolar: number,
    readonly postEventWhiteDwarfMassSolar: number,
    readonly ejectedMassSolar: number,
    readonly retainedMassSolar: number,
  ) {
    if (!whiteDwarfSurvives) {
      throw new RangeError('A thermonuclear nova must preserve its white dwarf in 29.2.');
    }
    for (const [name, value] of Object.entries({
      preEventWhiteDwarfMassSolar,
      postEventWhiteDwarfMassSolar,
      ejectedMassSolar,
      retainedMassSolar,
    })) {
      if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and non-negative.`);
    }
  }
}
