import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { NovaCanonicalEvent } from '../../domain/transient/nova-canonical-event';
import { NovaEventProfile } from '../../domain/transient/nova-event-profile';
import { NovaProgenitorProfile, NovaWhiteDwarfComposition } from '../../domain/transient/nova-progenitor';
import { NovaStellarConsequence } from '../../domain/transient/nova-stellar-consequence';
import { NovaStellarLineage, NovaStellarLineageStage } from '../../domain/transient/nova-stellar-lineage';
import { NovaType } from '../../domain/transient/nova-type';
import { StellarNovaScientificPresentationAssembler } from './stellar-nova-scientific-presentation';

describe('29.2 nova scientific presentation', () => {
  it('renders a recurrent nova without describing it as a supernova or destroying the white dwarf', () => {
    const progenitor = new NovaProgenitorProfile(
      1.28, 1.1, 1, 0.15, 1e-7, 5e-6, NovaWhiteDwarfComposition.CARBON_OXYGEN,
    );
    const profile = new NovaEventProfile(
      NovaType.RECURRENT, progenitor, 2.5e-6, 2.5e-6, 7e37, 4_200,
      1e32, -9, 11_000, 1, 8, 22, 110, 50,
    );
    const lineage = new NovaStellarLineage(
      StellarSystemComponentLabel.A, 'Fixture A', NovaStellarLineageStage.RECURRENT_NOVA_CHANNEL,
      2, progenitor, profile, StellarSystemComponentLabel.B,
    );
    const event = new NovaCanonicalEvent(
      StellarSystemComponentLabel.A, StellarSystemComponentLabel.B, 'Fixture A',
      NovaStellarLineageStage.RECURRENT_NOVA_CHANNEL, 2, 50,
      1.99999998, 2.00000003, profile,
    );
    const consequence = new NovaStellarConsequence(
      StellarSystemComponentLabel.A, NovaType.RECURRENT, true, 1.28, 1.2800025, 2.5e-6, 2.5e-6,
    );

    const model = StellarNovaScientificPresentationAssembler.build({
      lineages: [lineage], events: [event], consequences: [consequence],
    });

    expect(model.catalogLabel).toContain('Nova Recurrente');
    expect(model.entries[0]?.typeLabel).toBe('Nova recurrente');
    expect(model.entries[0]?.consequenceLabel).toContain('sobrevive');
    expect(model.entries[0]?.consequenceLabel).not.toContain('supernova');
  });

  it('reports no nova channel when no white dwarf binary qualifies', () => {
    const model = StellarNovaScientificPresentationAssembler.build({
      lineages: [new NovaStellarLineage(
        StellarSystemComponentLabel.A, 'Fixture A', NovaStellarLineageStage.INELIGIBLE,
        1, null, null, null,
      )],
      events: [],
      consequences: [],
    });

    expect(model.canonicalEventCount).toBe(0);
    expect(model.catalogLabel).toBe('Sin canal de nova');
    expect(model.entries).toHaveLength(0);
  });
});
