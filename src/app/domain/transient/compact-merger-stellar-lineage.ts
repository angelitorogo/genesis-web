import { type StellarSystemComponentLabel } from '../stellar/stellar-system-component-label';
import { type CompactMergerEventProfile } from './compact-merger-event-profile';
import { type CompactMergerProgenitorProfile } from './compact-merger-progenitor';

export const CompactMergerStellarLineageStage = Object.freeze({
  FUTURE_NS_NS_MERGER: 'FUTURE_NS_NS_MERGER',
  FUTURE_NS_BH_MERGER: 'FUTURE_NS_BH_MERGER',
  FUTURE_BH_BH_MERGER: 'FUTURE_BH_BH_MERGER',
} as const);
export type CompactMergerStellarLineageStage = typeof CompactMergerStellarLineageStage[keyof typeof CompactMergerStellarLineageStage];

export class CompactMergerStellarLineage {
  constructor(
    readonly stage: CompactMergerStellarLineageStage,
    readonly primaryComponentLabel: StellarSystemComponentLabel,
    readonly secondaryComponentLabel: StellarSystemComponentLabel,
    readonly primaryDesignation: string,
    readonly secondaryDesignation: string,
    readonly currentStellarAgeBillionYears: number,
    readonly progenitor: CompactMergerProgenitorProfile,
    readonly eventProfile: CompactMergerEventProfile,
  ) {
    if (!Number.isFinite(currentStellarAgeBillionYears) || currentStellarAgeBillionYears < 0) {
      throw new RangeError('currentStellarAgeBillionYears must be finite and non-negative.');
    }
    if (eventProfile.progenitor !== progenitor) {
      throw new RangeError('Compact-merger lineage must use one canonical progenitor profile instance.');
    }
  }
}
