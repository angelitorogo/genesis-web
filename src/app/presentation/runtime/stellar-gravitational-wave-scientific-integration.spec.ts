import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { CompactMergerCanonicalEvent } from '../../domain/transient/compact-merger-canonical-event';
import { CompactMergerProgenitorProfile } from '../../domain/transient/compact-merger-progenitor';
import { CompactMergerStellarLineageStage } from '../../domain/transient/compact-merger-stellar-lineage';
import { CompactMergerType } from '../../domain/transient/compact-merger-type';
import { CompactMergerEventEngine } from '../../simulation/transient/compact-merger-event-engine';
import { StellarGravitationalWaveScientificIntegration } from './stellar-gravitational-wave-scientific-integration';

function bhBhEvent(): CompactMergerCanonicalEvent {
  const progenitor = new CompactMergerProgenitorProfile(
    CompactMergerType.BLACK_HOLE_BLACK_HOLE, 32, 27, null, 0.014, 0.03, 6.8e8,
  );
  return new CompactMergerCanonicalEvent(
    StellarSystemComponentLabel.A,
    StellarSystemComponentLabel.B,
    'Compacto A',
    'Compacto B',
    CompactMergerStellarLineageStage.FUTURE_BH_BH_MERGER,
    5,
    6.8e8,
    5.68,
    CompactMergerEventEngine.deriveProfile(progenitor),
  );
}

describe('29.5 gravitational-wave scientific integration', () => {
  it('projects the persisted 29.4 event identity without creating a second canonical event', () => {
    const event = bhBhEvent();
    const snapshot = StellarGravitationalWaveScientificIntegration.derive({
      lineage: null,
      events: [event],
      consequences: [],
    });

    expect(snapshot.events).toHaveLength(1);
    expect(snapshot.events[0]?.eventKey).toBe(event.eventKey);
    expect(snapshot.events[0]?.mergerDelayYears).toBe(event.mergerDelayYears);
    expect(snapshot.events[0]?.profile.sourceMerger).toBe(event.profile);
    expect(snapshot.events[0]?.profile.observedStrain).toBeNull();
  });

  it('preserves the empty compact-merger state without synthetic GW signals', () => {
    const snapshot = StellarGravitationalWaveScientificIntegration.derive({
      lineage: null,
      events: [],
      consequences: [],
    });
    expect(snapshot.events).toEqual([]);
  });
});
