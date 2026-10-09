import { CompactMergerCanonicalEvent } from '../../domain/transient/compact-merger-canonical-event';
import { type CompactMergerStellarLineage } from '../../domain/transient/compact-merger-stellar-lineage';

export class StellarCompactMergerCanonicalEventResolver {
  private constructor() {}
  static resolve(lineage: CompactMergerStellarLineage | null): readonly CompactMergerCanonicalEvent[] {
    if (lineage === null) return Object.freeze([]);
    const mergerAge = lineage.currentStellarAgeBillionYears + lineage.progenitor.referenceInspiralYears / 1e9;
    return Object.freeze([new CompactMergerCanonicalEvent(
      lineage.primaryComponentLabel,
      lineage.secondaryComponentLabel,
      lineage.primaryDesignation,
      lineage.secondaryDesignation,
      lineage.stage,
      lineage.currentStellarAgeBillionYears,
      lineage.progenitor.referenceInspiralYears,
      mergerAge,
      lineage.eventProfile,
    )]);
  }
}
