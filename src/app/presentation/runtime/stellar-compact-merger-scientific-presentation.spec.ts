import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { CompactMergerCanonicalEvent } from '../../domain/transient/compact-merger-canonical-event';
import { CompactMergerProgenitorProfile } from '../../domain/transient/compact-merger-progenitor';
import { CompactMergerStellarLineageStage } from '../../domain/transient/compact-merger-stellar-lineage';
import { CompactMergerType } from '../../domain/transient/compact-merger-type';
import { CompactMergerEventEngine } from '../../simulation/transient/compact-merger-event-engine';
import { StellarCompactMergerScientificPresentationAssembler } from './stellar-compact-merger-scientific-presentation';

describe('29.4 compact-merger scientific presentation', () => {
  it('presents BH-BH as a merger while explicitly keeping the waveform and spin-dependent final mass unresolved', () => {
    const progenitor = new CompactMergerProgenitorProfile(
      CompactMergerType.BLACK_HOLE_BLACK_HOLE, 32, 27, null, 0.003, 0.03, 8e8,
    );
    const profile = CompactMergerEventEngine.deriveProfile(progenitor);
    const event = new CompactMergerCanonicalEvent(
      StellarSystemComponentLabel.A, StellarSystemComponentLabel.B, 'A', 'B',
      CompactMergerStellarLineageStage.FUTURE_BH_BH_MERGER, 5, 8e8, 5.8, profile,
    );
    const model = StellarCompactMergerScientificPresentationAssembler.build({ lineage: null, events: [event], consequences: [] });
    expect(model.catalogLabel).toContain('Fusión BH–BH');
    expect(model.summary).toContain('29.5');
    expect(model.entries[0]?.remnantLabel).toContain('masa final no resuelta');
    expect(model.entries[0]?.counterpartLabel).toContain('Sin contraparte electromagnética');
  });

  it('does not invent a merger for an empty system', () => {
    expect(StellarCompactMergerScientificPresentationAssembler.build({ lineage: null, events: [], consequences: [] }).catalogLabel)
      .toBe('Sin fusión compacta');
  });
});
