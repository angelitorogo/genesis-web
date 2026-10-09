import { type CompactMergerCanonicalEvent } from '../../domain/transient/compact-merger-canonical-event';
import { CompactMergerStellarConsequence } from '../../domain/transient/compact-merger-stellar-consequence';

export class StellarCompactMergerConsequenceResolver {
  private constructor() {}
  static resolveEvents(events: readonly CompactMergerCanonicalEvent[]): readonly CompactMergerStellarConsequence[] {
    if (events.length > 1) throw new RangeError('29.4 supports one canonical inner A-B compact merger per system.');
    return Object.freeze(events.map(event => new CompactMergerStellarConsequence(
      event.eventKey,
      event.profile.type,
      event.profile.remnantKind,
      event.profile.remnantMassSolar,
      event.profile.counterpartKind,
      event.profile.massBudgetResolution,
      event.mergerStellarAgeBillionYears,
    )));
  }
}
