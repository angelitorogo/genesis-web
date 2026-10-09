import { KilonovaCanonicalEvent } from '../../domain/transient/kilonova-canonical-event';
import { type KilonovaStellarLineage } from '../../domain/transient/kilonova-stellar-lineage';

export class StellarKilonovaCanonicalEventResolver {
  private constructor() {}
  static resolve(lineage: KilonovaStellarLineage | null): readonly KilonovaCanonicalEvent[] {
    if (lineage === null || lineage.progenitor === null || lineage.eventProfile === null) return Object.freeze([]);
    const mergerAge = lineage.currentStellarAgeBillionYears + lineage.progenitor.referenceInspiralYears / 1e9;
    return Object.freeze([new KilonovaCanonicalEvent(
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
