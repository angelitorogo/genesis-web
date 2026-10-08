import { NOVA_CANONICAL_EVENT_VERSION, NovaCanonicalEvent } from '../../domain/transient/nova-canonical-event';
import { NovaProgenitorProfile, NovaWhiteDwarfComposition } from '../../domain/transient/nova-progenitor';
import { NovaStellarLineageStage } from '../../domain/transient/nova-stellar-lineage';
import { SUPERNOVA_CANONICAL_EVENT_VERSION } from '../../domain/transient/supernova-canonical-event';
import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { NovaEventEngine } from './nova-event-engine';
import { StellarNovaConsequenceResolver } from './stellar-nova-consequence-resolver';

describe('29.2 regression closure', () => {
  it('keeps nova persistence identity separate from 29.1 supernova events', () => {
    expect(NOVA_CANONICAL_EVENT_VERSION).toBe('NOVA_CANONICAL_EVENT_V1');
    expect(NOVA_CANONICAL_EVENT_VERSION).not.toBe(SUPERNOVA_CANONICAL_EVENT_VERSION);
  });

  it('keeps the white dwarf after a canonical nova and changes no orbital architecture', () => {
    const progenitor = new NovaProgenitorProfile(
      1.18, 0.96, 1, 0.21, 3.5e-8, 7e-6, NovaWhiteDwarfComposition.CARBON_OXYGEN,
    );
    const profile = NovaEventEngine.deriveProfile(progenitor);
    const event = new NovaCanonicalEvent(
      StellarSystemComponentLabel.A,
      StellarSystemComponentLabel.B,
      'Closure A',
      profile.recurrenceIntervalYears <= 100
        ? NovaStellarLineageStage.RECURRENT_NOVA_CHANNEL
        : NovaStellarLineageStage.CLASSICAL_NOVA_CHANNEL,
      4,
      profile.recurrenceIntervalYears,
      3.99999,
      4.00001,
      profile,
    );

    const [consequence] = StellarNovaConsequenceResolver.resolveEvents([event]);
    expect(event.eventKey).toBe('NOVA:A');
    expect(consequence.whiteDwarfSurvives).toBe(true);
    expect(consequence.ejectedMassSolar).toBe(profile.ejectaMassSolar);
    expect(consequence.postEventWhiteDwarfMassSolar).toBeGreaterThanOrEqual(
      consequence.preEventWhiteDwarfMassSolar,
    );
  });
});
