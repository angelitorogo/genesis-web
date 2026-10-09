import { type KilonovaCanonicalEvent } from '../../domain/transient/kilonova-canonical-event';
import { KilonovaStellarConsequence } from '../../domain/transient/kilonova-stellar-consequence';

export class StellarKilonovaConsequenceResolver {
  private constructor() {}
  static resolveEvents(events: readonly KilonovaCanonicalEvent[]): readonly KilonovaStellarConsequence[] {
    if (events.length > 1) throw new RangeError('29.3 supports one canonical inner A-B kilonova per system.');
    return Object.freeze(events.map(event => new KilonovaStellarConsequence(
      event.eventKey,
      event.profile.type,
      event.profile.remnantKind,
      event.profile.remnantMassSolar,
      event.profile.totalEjectaMassSolar,
      event.profile.rProcessMassSolar,
      event.mergerStellarAgeBillionYears,
    )));
  }
}
