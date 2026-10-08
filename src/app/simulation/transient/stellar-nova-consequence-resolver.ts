import { type NovaCanonicalEvent } from '../../domain/transient/nova-canonical-event';
import { NovaStellarConsequence } from '../../domain/transient/nova-stellar-consequence';

export class StellarNovaConsequenceResolver {
  private constructor() {}

  static resolveEvents(events: readonly NovaCanonicalEvent[]): readonly NovaStellarConsequence[] {
    return Object.freeze(events.map(event => {
      const preMass = event.profile.progenitor.whiteDwarfMassSolar;
      const retained = event.profile.retainedEnvelopeMassSolar;
      return new NovaStellarConsequence(
        event.componentLabel,
        event.profile.type,
        true,
        preMass,
        preMass + retained,
        event.profile.ejectaMassSolar,
        retained,
      );
    }));
  }
}
