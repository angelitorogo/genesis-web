import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { KilonovaCanonicalEvent } from '../../domain/transient/kilonova-canonical-event';
import { KilonovaProgenitorProfile } from '../../domain/transient/kilonova-progenitor';
import { KilonovaStellarLineage, KilonovaStellarLineageStage } from '../../domain/transient/kilonova-stellar-lineage';
import { KilonovaType } from '../../domain/transient/kilonova-type';
import { KilonovaEventEngine } from '../../simulation/transient/kilonova-event-engine';
import { StellarKilonovaScientificPresentationAssembler } from './stellar-kilonova-scientific-presentation';

describe('29.3 kilonova scientific presentation', () => {
  it('exposes a compact catalogue label and future merger consequence', () => {
    const profile = KilonovaEventEngine.deriveProfile(new KilonovaProgenitorProfile(
      KilonovaType.BINARY_NEUTRON_STAR, 1.38, 1.27, 12.1, 0.0018, 0.08, 2e8, null, null,
    ));
    const event = new KilonovaCanonicalEvent(StellarSystemComponentLabel.A, StellarSystemComponentLabel.B,
      'A', 'B', KilonovaStellarLineageStage.FUTURE_NS_NS_MERGER, 5, 2e8, 5.2, profile);
    const model = StellarKilonovaScientificPresentationAssembler.build({ lineage: null, events: [event], consequences: [] });
    expect(model.catalogLabel).toContain('Kilonova NS–NS');
    expect(model.entries[0]?.rProcessMassLabel).toContain('M☉');
    expect(model.entries[0]?.remnantLabel.length).toBeGreaterThan(0);
  });


  it('surfaces NS-BH as spin-unresolved without inventing a canonical event', () => {
    const lineage = new KilonovaStellarLineage(
      KilonovaStellarLineageStage.NS_BH_SPIN_UNRESOLVED,
      StellarSystemComponentLabel.A,
      StellarSystemComponentLabel.B,
      'A',
      'B',
      5,
      null,
      null,
    );
    const model = StellarKilonovaScientificPresentationAssembler.build({ lineage, events: [], consequences: [] });
    expect(model.catalogLabel).toBe('Candidato NS–BH · spin no resuelto');
    expect(model.summary).toContain('no puede resolverse sin spin');
    expect(model.canonicalEventCount).toBe(0);
  });

  it('labels empty systems without inventing a merger', () => {
    expect(StellarKilonovaScientificPresentationAssembler.build({ lineage: null, events: [], consequences: [] }).catalogLabel)
      .toBe('Sin canal de kilonova');
  });
});
