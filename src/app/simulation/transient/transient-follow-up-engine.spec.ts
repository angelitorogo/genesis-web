import {
  TransientFollowUpClassification as Classification,
  TransientFollowUpFamily as Family,
  TransientFollowUpOrigin as Origin,
  TransientObservationSignature as Signature,
  TransientTemporalPhase as Phase,
  type TransientFollowUpInput,
} from '../../domain/transient/transient-follow-up-profile';
import { TransientFollowUpEngine } from './transient-follow-up-engine';

const candidate: TransientFollowUpInput = {
  id: 'candidate', family: Family.UNKNOWN, origin: Origin.OBSERVATIONAL_CANDIDATE,
  forecastDelayYears: null, modelMilestones: [], observations: [
    { id: 'first', timeAfterObserverReferenceSeconds: 0, label: 'Optical measurement', signature: Signature.OPTICAL_BRIGHTENING },
  ],
};
describe('TransientFollowUpEngine 29.10 domain boundary', () => {
  it('preserves ambiguous evidence without generating physical events', () => {
    const result = TransientFollowUpEngine.characterize(candidate);
    expect(result.classification).toBe(Classification.OBSERVATION_AMBIGUOUS);
    expect(result.inventedEventCount).toBe(0);
    expect(result.modelMilestones).toHaveLength(0);
  });
  it('rejects future events masquerading as observations', () => {
    expect(() => TransientFollowUpEngine.characterize({
      ...candidate, family: Family.COMPACT_MERGER, origin: Origin.CANONICAL_FUTURE,
      forecastDelayYears: 1e8,
    })).toThrow(RangeError);
  });
  it('rejects ungrounded statistical milestones', () => {
    expect(() => TransientFollowUpEngine.characterize({
      ...candidate, family: Family.STELLAR_FLARE, origin: Origin.STATISTICAL_ONLY,
      observations: [], modelMilestones: [
        { id: 'invented', timeAfterOnsetSeconds: 0, label: 'Invented event', phase: Phase.ONSET },
      ],
    })).toThrow(RangeError);
  });
  it('sorts only within each frame and never converts between observer and source time', () => {
    const result = TransientFollowUpEngine.characterize({
      id: 'explicit', family: Family.NOVA, origin: Origin.INTRINSIC_EXPLICIT,
      forecastDelayYears: null,
      modelMilestones: [
        { id: 'peak', timeAfterOnsetSeconds: 60, label: 'Peak', phase: Phase.PEAK },
        { id: 'start', timeAfterOnsetSeconds: 0, label: 'Start', phase: Phase.ONSET },
      ], observations: [
        { id: 'observed', timeAfterObserverReferenceSeconds: 5, label: 'Observed spectrum', signature: Signature.NOVA_SPECTRUM },
      ],
    });
    expect(result.modelMilestones.map(item => item.id)).toEqual(['start', 'peak']);
    expect(result.observations[0].timeAfterObserverReferenceSeconds).toBe(5);
    expect(result.observerToSourceTimeConversion).toBeNull();
    expect(TransientFollowUpEngine.modelPhaseAt(result, 60)?.id).toBe('peak');
  });
});
