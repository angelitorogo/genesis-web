import { type CompactMergerCounterpartKind, type CompactMergerMassBudgetResolution, type CompactMergerRemnantKind } from './compact-merger-event-profile';
import { type CompactMergerType } from './compact-merger-type';

export class CompactMergerStellarConsequence {
  constructor(
    readonly sourceEventKey: string,
    readonly type: CompactMergerType,
    readonly remnantKind: CompactMergerRemnantKind,
    readonly remnantMassSolar: number | null,
    readonly counterpartKind: CompactMergerCounterpartKind,
    readonly massBudgetResolution: CompactMergerMassBudgetResolution,
    readonly mergerStellarAgeBillionYears: number,
  ) {
    if (!sourceEventKey || !Number.isFinite(mergerStellarAgeBillionYears) || mergerStellarAgeBillionYears <= 0 ||
        (remnantMassSolar !== null && (!Number.isFinite(remnantMassSolar) || remnantMassSolar <= 0))) {
      throw new RangeError('Invalid compact-merger consequence.');
    }
  }
}
