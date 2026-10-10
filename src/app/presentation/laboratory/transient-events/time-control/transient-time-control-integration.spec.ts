import { describe, it, expect } from 'vitest';
import { TransientTimeControlEngine as Clock } from '../../../../simulation/transient/transient-time-control-engine';
import { TRANSIENT_TIME_CONTROL_LABORATORY_CASES as cases } from './transient-time-control-laboratory-fixtures';
import { TransientHistoricalEffectsEngine } from '../../../../simulation/transient/transient-historical-effects-engine';

const find = (id: string) => cases.find(item => item.id === id)!;
describe('29.12 — real 29.10/29.11 integration boundary', () => {
  it('references genuine 29.10 fixtures without changing classifications', () => {
    expect(cases).toHaveLength(11);
    for (const item of cases) {
      const before=item.scheduled.map(s=>({classification:s.assessment.classification,
        count:s.assessment.observations.length,modelCount:s.assessment.modelMilestones.length}));
      Clock.update(Clock.seekSimulation(0),item.scheduled);
      Clock.update(Clock.seekSimulation(1e15),item.scheduled);
      expect(item.scheduled.map(s=>({classification:s.assessment.classification,
        count:s.assessment.observations.length,modelCount:s.assessment.modelMilestones.length}))).toEqual(before);
    }
  });
  it('keeps the future compact-merger canonical after its simulated due instant', () => {
    const future=find('future').scheduled[0];
    const evaluated=Clock.update(Clock.seekSimulation(future.dueSimulationSeconds!),[future]).entries[0];
    expect(evaluated.state).toBe('FUTURE_DUE_UNCONFIRMED');
    expect(evaluated.classification).toBe('CANONICAL_FUTURE');
    expect(evaluated.observationCount).toBe(0);
  });
  it('does not transform 29.11 exposure history into a mutable effect while time advances', () => {
    const target={id:'planet',label:'test planet',kind:'PLANET' as const,separationAu:1,effectiveOpticalDepth:0,biosphereCharacterized:true};
    const events=[{id:'flare',label:'observed prior flare',family:'STELLAR_FLARE' as const,
      state:'PAST_INTRINSIC_EXPLICIT' as const,yearsBeforeReference:12,
      photonEnergyJoules:1e25,band:'UV' as const,geometry:'ISOTROPIC_TOTAL' as const,sourceDurationSeconds:3600}];
    const original=TransientHistoricalEffectsEngine.assess(target,events);
    Clock.update(Clock.seekSimulation(1e12),find('combined').scheduled);
    const replay=TransientHistoricalEffectsEngine.assess(target,events);
    expect(replay).toEqual(original);
    expect(replay.alteredBiospheres).toBe(0);
    expect(replay.alteredAtmospheres).toBe(0);
  });
});
