import { describe, expect, it, vi } from 'vitest';
import {
  TransientFollowUpFamily as Family, TransientFollowUpOrigin as Origin,
  TransientTemporalPhase as Phase, TransientObservationSignature as Signature,
} from '../../domain/transient/transient-follow-up-profile';
import type { TransientScheduledProjection, TransientUpdateClock } from '../../domain/transient/transient-time-control-profile';
import { TransientFollowUpEngine } from './transient-follow-up-engine';
import { TransientTimeControlEngine as Engine } from './transient-time-control-engine';

const intrinsic = TransientFollowUpEngine.characterize({
  id: 'nova-source', family: Family.NOVA, origin: Origin.INTRINSIC_EXPLICIT,
  forecastDelayYears: null,
  modelMilestones: [
    {id:'end',timeAfterOnsetSeconds:100,phase:Phase.END,label:'End model'},
    {id:'peak',timeAfterOnsetSeconds:20,phase:Phase.PEAK,label:'Peak model'},
    {id:'onset',timeAfterOnsetSeconds:0,phase:Phase.ONSET,label:'Onset model'},
  ],
  observations: [{ id:'obs',timeAfterObserverReferenceSeconds:10,signature:Signature.OPTICAL_BRIGHTENING,label:'Instrumental observation' }],
});
const nova: TransientScheduledProjection = {
  id:'nova', assessment:intrinsic,sourceOnsetSimulationSeconds:10,dueSimulationSeconds:null,
};
const future: TransientScheduledProjection = {
  id:'future', assessment:TransientFollowUpEngine.characterize({
    id:'future-source',family:Family.COMPACT_MERGER,origin:Origin.CANONICAL_FUTURE,
    modelMilestones:[],observations:[],forecastDelayYears:1,
  }),sourceOnsetSimulationSeconds:null,dueSimulationSeconds:25,
};
const candidate: TransientScheduledProjection = {
  id:'candidate',assessment:TransientFollowUpEngine.characterize({
    id:'candidate-source',family:Family.UNKNOWN,origin:Origin.OBSERVATIONAL_CANDIDATE,
    modelMilestones:[],forecastDelayYears:null,
    observations:[{id:'o',timeAfterObserverReferenceSeconds:600,label:'Radio sample',signature:Signature.RADIO_MILLISECOND_PULSE}],
  }),sourceOnsetSimulationSeconds:null,dueSimulationSeconds:null,
};
const statistics: TransientScheduledProjection = {
  id:'stats',assessment:TransientFollowUpEngine.characterize({
    id:'stats-source',family:Family.STELLAR_FLARE,origin:Origin.STATISTICAL_ONLY,
    forecastDelayYears:null,modelMilestones:[],observations:[],
  }),sourceOnsetSimulationSeconds:null,dueSimulationSeconds:null,
};
const manual = (simulationSeconds:number): Extract<TransientUpdateClock, { mode: 'SIMULATED' }> => ({mode:'SIMULATED',simulationSeconds});

describe('29.12 — deterministic clock and temporal updates', () => {
  it('does not read wall time, timers, randomness or UTC while updating', () => {
    const now = vi.spyOn(Date,'now').mockImplementation(() => {throw new Error('FORBIDDEN browser clock');});
    const random = vi.spyOn(Math,'random').mockImplementation(() => {throw new Error('FORBIDDEN random');});
    try {
      const out=Engine.update(manual(30),[nova]);
      expect(out.entries[0].activeMilestone?.id).toBe('peak');
      expect(out.clockMode).toBe('SIMULATED');
      expect(out.persistedEvents).toBe(0);
      expect(now).not.toHaveBeenCalled();
      expect(random).not.toHaveBeenCalled();
    } finally { now.mockRestore(); random.mockRestore(); }
  });
  it('advances only by the explicit supplied delta and can deterministically replay', () => {
    const a=Engine.advanceSimulation(manual(30),80);
    expect(Engine.timeAt(a)).toBe(110);
    const b=Engine.update(a,[nova]);
    expect(b.entries[0].state).toBe('MODEL_END_REFERENCE');
    expect(b.entries[0].crossedMilestoneIds).toEqual(['onset','peak','end']);
    expect(Engine.update(manual(110),[nova])).toEqual(b);
    expect(Engine.update(Engine.seekSimulation(30),[nova]).entries[0].activeMilestone?.id).toBe('peak');
  });
  it('never assumes a not-yet-started model has occurred', () => {
    const event=Engine.update(manual(9),[nova]).entries[0];
    expect(event.state).toBe('MODEL_NOT_STARTED');
    expect(event.sourceAgeSeconds).toBeNull();
    expect(event.activeMilestone).toBeNull();
  });
  it('reaches forecast date without confirming a merger or synthesizing observations', () => {
    const a=Engine.update(manual(24.999),[future]).entries[0];
    const b=Engine.update(manual(25),[future]).entries[0];
    expect(a.state).toBe('FUTURE_PENDING');
    expect(b.state).toBe('FUTURE_DUE_UNCONFIRMED');
    expect(b.inventedEventCount).toBe(0);
    expect(b.observedEpoch).toBeNull();
    expect(b.sourceAgeSeconds).toBeNull();
  });
  it('preserves observer-frame evidence instead of turning it into source-frame model milestones', () => {
    const result=Engine.update(manual(100000),[candidate]).entries[0];
    expect(result.state).toBe('OBSERVATION_ONLY_UNALIGNED');
    expect(result.activeMilestone).toBeNull();
    expect(result.observationCount).toBe(1);
    expect(result.observationTimesReinterpreted).toBe(0);
  });
  it('never turns statistics into events on any time step', () => {
    const result=Engine.update(manual(1e12),[statistics]);
    expect(result.entries[0].state).toBe('NO_INDIVIDUAL_EVENT');
    expect(result.entries[0].crossedMilestoneIds).toEqual([]);
    expect(result.persistedEvents).toBe(0);
  });
  it('sorts projections deterministically and does not mutate its source arrays', () => {
    const list=[future, nova, candidate, statistics];
    const before=list.map(item=>item.id);
    const a=Engine.update(manual(60),list);
    expect(a.entries.map(item=>item.id)).toEqual(['candidate','future','nova','stats']);
    expect(list.map(item=>item.id)).toEqual(before);
    expect(Engine.update(manual(60),[statistics,candidate,nova,future])).toEqual(a);
  });
  it('requires explicit consent AND a supplied wall-clock sample, never samples internally', () => {
    const wall: TransientUpdateClock={mode:'EXPLICIT_WALL_SAMPLE',expresslyAuthorized:true,
      anchorSimulationSeconds:10,anchorEpochMilliseconds:1000,sampledEpochMilliseconds:6000,
      simulationSecondsPerWallSecond:2};
    const spy=vi.spyOn(Date,'now').mockImplementation(() => {throw new Error('Must not sample');});
    try { expect(Engine.timeAt(wall)).toBe(20); expect(spy).not.toHaveBeenCalled(); }
    finally {spy.mockRestore();}
    expect(() => Engine.timeAt({...wall,expresslyAuthorized:false} as unknown as TransientUpdateClock)).toThrow();
    expect(() => Engine.timeAt({...wall,sampledEpochMilliseconds:999})).toThrow();
    expect(() => Engine.timeAt({...wall,simulationSecondsPerWallSecond:0})).toThrow();
  });
  it.each([-1, Number.NaN, Infinity, -Infinity])('rejects invalid simulation times and increments: %s', (value) => {
    expect(() => Engine.timeAt(manual(value))).toThrow();
    expect(() => Engine.advanceSimulation(manual(0),value)).toThrow();
    expect(() => Engine.seekSimulation(value)).toThrow();
  });
  it('rejects attempts to assign fake onset/due dates to unconfirmed or statistical origins', () => {
    expect(() => Engine.update(manual(0),[{...candidate,sourceOnsetSimulationSeconds:0}])).toThrow();
    expect(() => Engine.update(manual(0),[{...statistics,dueSimulationSeconds:10}])).toThrow();
    expect(() => Engine.update(manual(0),[{...future,sourceOnsetSimulationSeconds:20}])).toThrow();
    expect(() => Engine.update(manual(0),[{...nova,sourceOnsetSimulationSeconds:null}])).toThrow();
    expect(() => Engine.update(manual(0),[nova,nova])).toThrow();
  });
});
