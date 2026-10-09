import { type StellarSystemComponentLabel } from '../stellar/stellar-system-component-label';
import { type CompactMergerEventProfile } from './compact-merger-event-profile';
import { CompactMergerStellarLineageStage, type CompactMergerStellarLineageStage as CompactMergerStellarLineageStageValue } from './compact-merger-stellar-lineage';
import { CompactMergerType } from './compact-merger-type';

export const COMPACT_MERGER_CANONICAL_EVENT_VERSION = 'COMPACT_MERGER_CANONICAL_EVENT_V1' as const;

export class CompactMergerCanonicalEvent {
  readonly version = COMPACT_MERGER_CANONICAL_EVENT_VERSION;
  constructor(
    readonly primaryComponentLabel: StellarSystemComponentLabel,
    readonly secondaryComponentLabel: StellarSystemComponentLabel,
    readonly primaryDesignation: string,
    readonly secondaryDesignation: string,
    readonly sourceLineageStage: CompactMergerStellarLineageStageValue,
    readonly currentStellarAgeBillionYears: number,
    readonly mergerDelayYears: number,
    readonly mergerStellarAgeBillionYears: number,
    readonly profile: CompactMergerEventProfile,
  ) {
    if (!Number.isFinite(currentStellarAgeBillionYears) || currentStellarAgeBillionYears < 0 ||
        !Number.isFinite(mergerDelayYears) || mergerDelayYears <= 0 ||
        !Number.isFinite(mergerStellarAgeBillionYears) || mergerStellarAgeBillionYears <= currentStellarAgeBillionYears) {
      throw new RangeError('Canonical compact merger must be one future merger.');
    }
    const expectedMergerAge = currentStellarAgeBillionYears + mergerDelayYears / 1e9;
    if (Math.abs(expectedMergerAge - mergerStellarAgeBillionYears) > 1e-9) {
      throw new RangeError('Canonical compact-merger age must equal current age plus the merger delay.');
    }
    const stageMatchesType =
      sourceLineageStage === CompactMergerStellarLineageStage.FUTURE_NS_NS_MERGER &&
        profile.type === CompactMergerType.NEUTRON_STAR_NEUTRON_STAR ||
      sourceLineageStage === CompactMergerStellarLineageStage.FUTURE_NS_BH_MERGER &&
        profile.type === CompactMergerType.NEUTRON_STAR_BLACK_HOLE ||
      sourceLineageStage === CompactMergerStellarLineageStage.FUTURE_BH_BH_MERGER &&
        profile.type === CompactMergerType.BLACK_HOLE_BLACK_HOLE;
    if (!stageMatchesType) {
      throw new RangeError('Canonical compact merger requires a lineage stage matching its merger family.');
    }
  }
  get eventKey(): string { return `COMPACT_MERGER:${this.primaryComponentLabel.name}-${this.secondaryComponentLabel.name}`; }
}
