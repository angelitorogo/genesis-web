import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { CompactMergerCanonicalEvent } from '../../domain/transient/compact-merger-canonical-event';
import { CompactMergerProgenitorProfile } from '../../domain/transient/compact-merger-progenitor';
import { CompactMergerStellarLineageStage } from '../../domain/transient/compact-merger-stellar-lineage';
import { CompactMergerType } from '../../domain/transient/compact-merger-type';
import { CompactMergerEventEngine } from '../../simulation/transient/compact-merger-event-engine';
import { StellarGravitationalWaveScientificIntegration } from './stellar-gravitational-wave-scientific-integration';
import { StellarGravitationalWaveScientificPresentationAssembler } from './stellar-gravitational-wave-scientific-presentation';

function nsBhSnapshot() {
  const progenitor = new CompactMergerProgenitorProfile(
    CompactMergerType.NEUTRON_STAR_BLACK_HOLE, 1.42, 8.6, 12.2, 0.0082, 0.05, 4.2e7,
  );
  const event = new CompactMergerCanonicalEvent(
    StellarSystemComponentLabel.A,
    StellarSystemComponentLabel.B,
    'NS A',
    'BH B',
    CompactMergerStellarLineageStage.FUTURE_NS_BH_MERGER,
    4,
    4.2e7,
    4.042,
    CompactMergerEventEngine.deriveProfile(progenitor),
  );
  return StellarGravitationalWaveScientificIntegration.derive({ lineage: null, events: [event], consequences: [] });
}

describe('29.5 gravitational-wave scientific presentation', () => {
  it('exposes intrinsic frequencies and explicitly labels observer strain and ringdown as unresolved', () => {
    const model = StellarGravitationalWaveScientificPresentationAssembler.build(nsBhSnapshot());
    expect(model.catalogLabel).toContain('GW NS–BH');
    expect(model.catalogLabel).toContain('ISCO');
    expect(model.summary).toContain('strain observado permanece sin resolver');
    expect(model.entries[0]?.referenceFrequencyLabel).toContain('µHz');
    expect(model.entries[0]?.iscoFrequencyLabel).toContain('Hz');
    expect(model.entries[0]?.observerStrainLabel).toContain('distancia');
    expect(model.entries[0]?.postMergerLabel).toContain('Kerr');
  });

  it('returns an explicit empty-state label when 29.4 has no canonical merger', () => {
    const model = StellarGravitationalWaveScientificPresentationAssembler.build({ events: [] });
    expect(model.catalogLabel).toBe('Sin señal GW compacta');
    expect(model.signalCount).toBe(0);
  });
});
