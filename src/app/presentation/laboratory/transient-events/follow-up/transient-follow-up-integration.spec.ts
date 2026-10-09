import {
  TransientFollowUpClassification as Classification,
  TransientFollowUpFamily as Family,
  TransientFollowUpOrigin as Origin,
  TransientObservationSignature as Signature,
  TransientTemporalPhase as Phase,
  type TransientFollowUpInput,
} from '../../../../domain/transient/transient-follow-up-profile';
import { TransientFollowUpEngine } from '../../../../simulation/transient/transient-follow-up-engine';
import { TransientFollowUpAdapters } from '../../../../simulation/transient/transient-follow-up-adapters';
import { NOVA_LABORATORY_CASES } from '../novae/nova-laboratory-fixtures';
import { KILONOVA_LABORATORY_CASES } from '../kilonovae/kilonova-laboratory-fixtures';
import { GAMMA_RAY_BURST_LABORATORY_CASES, GammaRayBurstLaboratoryCaseId } from '../gamma-ray-bursts/gamma-ray-burst-laboratory-fixtures';
import { FAST_RADIO_BURST_LABORATORY_CASES, FastRadioBurstLaboratoryCaseId } from '../fast-radio-bursts/fast-radio-burst-laboratory-fixtures';
import { GREAT_STELLAR_FLARE_LABORATORY_CASES, GreatStellarFlareLaboratoryCaseId } from '../great-stellar-flares/great-stellar-flare-laboratory-fixtures';
import { TIDAL_DISRUPTION_LABORATORY_CASES, TidalDisruptionLaboratoryCaseId } from '../tidal-disruptions/tidal-disruption-laboratory-fixtures';

const ambiguous: TransientFollowUpInput = {
  id: 'OBS:1', family: Family.UNKNOWN, origin: Origin.OBSERVATIONAL_CANDIDATE,
  forecastDelayYears: null, modelMilestones: [],
  observations: [
    { id: 'opt', timeAfterObserverReferenceSeconds: 0, label: 'Optical data', signature: Signature.OPTICAL_BRIGHTENING },
  ],
};

describe('TransientFollowUpEngine 29.10', () => {
  it('reads real 29.2 nova temporal anchors without equating them to observer timestamps', () => {
    const physical = NOVA_LABORATORY_CASES[0].profile;
    const result = TransientFollowUpEngine.characterize(TransientFollowUpAdapters.nova('N', physical));
    expect(result.classification).toBe(Classification.INTRINSIC_ONLY);
    expect(result.modelMilestones.find(item => item.id === 'nova-peak')?.timeAfterOnsetSeconds)
      .toBe(physical.riseTimeDays * 86400);
    expect(result.observations).toHaveLength(0);
    expect(result.observedEpoch).toBeNull();
    expect(result.luminosityDistanceParsec).toBeNull();
  });

  it('29.3 preserves blue then red intrinsic peak ordering with no detected kilonova', () => {
    const physical = KILONOVA_LABORATORY_CASES[0].profile;
    const result = TransientFollowUpEngine.characterize(TransientFollowUpAdapters.kilonova('K', physical));
    const blue = result.modelMilestones.find(item => item.id === 'blue-peak')!;
    const red = result.modelMilestones.find(item => item.id === 'red-peak')!;
    expect(blue.timeAfterOnsetSeconds).toBeLessThan(red.timeAfterOnsetSeconds);
    expect(result.observations).toEqual([]);
  });

  it('29.7 uses only explicit motor/breakout anchors, never observed T90', () => {
    const physical = GAMMA_RAY_BURST_LABORATORY_CASES.find(item => item.id === GammaRayBurstLaboratoryCaseId.LONG_COLLAPSAR_ON_AXIS)!.profile;
    const result = TransientFollowUpEngine.characterize(TransientFollowUpAdapters.gammaRayBurst('G', physical));
    expect(result.modelMilestones.find(item => item.id === 'breakout')?.timeAfterOnsetSeconds)
      .toBe(physical.stellarBreakoutTimeSeconds);
    expect(result.observations).toHaveLength(0);
  });

  it('29.8 confirmed repeater must not generate a periodic or second burst', () => {
    const physical = FAST_RADIO_BURST_LABORATORY_CASES.find(item => item.id === FastRadioBurstLaboratoryCaseId.MAGNETAR_REPEATER)!.profile;
    const result = TransientFollowUpEngine.characterize(TransientFollowUpAdapters.fastRadioBurst('F', physical));
    expect(result.modelMilestones).toHaveLength(2);
    expect(result.modelMilestones[1].timeAfterOnsetSeconds).toBe(0.003);
    expect(result.observations).toHaveLength(0);
  });

  it('29.9 retains an explicit flare duration but never schedules the next one', () => {
    const physical = GREAT_STELLAR_FLARE_LABORATORY_CASES.find(item => item.id === GreatStellarFlareLaboratoryCaseId.M_DWARF_SUPERFLARE)!.profile;
    const result = TransientFollowUpEngine.characterize(TransientFollowUpAdapters.greatStellarFlare('S', physical));
    expect(result.modelMilestones.map(item => item.id)).toEqual(['flare', 'flare-end']);
    expect(result.modelMilestones[1].timeAfterOnsetSeconds).toBe(3600);
  });

  it('29.9 activity statistics cannot become a future flare schedule', () => {
    const physical = GREAT_STELLAR_FLARE_LABORATORY_CASES.find(item => item.id === GreatStellarFlareLaboratoryCaseId.STATISTICAL_ACTIVITY_ONLY)!.profile;
    const result = TransientFollowUpEngine.characterize(TransientFollowUpAdapters.greatStellarFlare('S', physical));
    expect(result.classification).toBe(Classification.STATISTICAL_ONLY);
    expect(result.modelMilestones).toHaveLength(0);
    expect(result.inventedEventCount).toBe(0);
  });

  it('29.6 return of bound debris is a physical reference, not an observed luminosity peak', () => {
    const physical = TIDAL_DISRUPTION_LABORATORY_CASES.find(item => item.id === TidalDisruptionLaboratoryCaseId.SOLAR_SMBH)!.profile;
    const result = TransientFollowUpEngine.characterize(TransientFollowUpAdapters.tidalDisruption('T', physical));
    expect(result.modelMilestones[1].timeAfterOnsetSeconds).toBe(physical.mostBoundFallbackTimeSeconds);
    expect(result.modelMilestones[1].phase).toBe(Phase.REFERENCE);
  });

  it('optical brightening alone stays ambiguous and cannot identify a progenitor', () => {
    const result = TransientFollowUpEngine.characterize(ambiguous);
    expect(result.classification).toBe(Classification.OBSERVATION_AMBIGUOUS);
    expect(result.compatibleFamilies).toContain(Family.NOVA);
    expect(result.compatibleFamilies).toContain(Family.SUPERNOVA);
    expect(result.modelMilestones).toHaveLength(0);
  });

  it('GW plus chromatic counterpart is compatible but does not produce a GRB or FRB', () => {
    const result = TransientFollowUpEngine.characterize({ ...ambiguous,
      observations: [
        { id: 'gw', timeAfterObserverReferenceSeconds: 0, label: 'GW', signature: Signature.GW_CHIRP },
        { id: 'multi', timeAfterObserverReferenceSeconds: 30, label: 'Kilonova candidate', signature: Signature.RED_BLUE_KILONOVA },
      ],
    });
    expect(result.classification).toBe(Classification.OBSERVATION_COMPATIBLE);
    expect(result.compatibleFamilies).toContain(Family.COMPACT_MERGER);
    expect(result.compatibleFamilies).toContain(Family.KILONOVA);
    expect(result.compatibleFamilies).not.toContain(Family.GAMMA_RAY_BURST);
    expect(result.compatibleFamilies).not.toContain(Family.FAST_RADIO_BURST);
    expect(result.inventedEventCount).toBe(0);
  });

  it('strictly sorts explicit observations and model milestones without mutating input', () => {
    const input: TransientFollowUpInput = { id: 'ORDER', family: Family.NOVA, origin: Origin.INTRINSIC_EXPLICIT,
      forecastDelayYears: null,
      modelMilestones: [
        { id: 'end', timeAfterOnsetSeconds: 30, label: 'End', phase: Phase.END },
        { id: 'start', timeAfterOnsetSeconds: 0, label: 'Start', phase: Phase.ONSET },
      ], observations: [
        { id: 'late', timeAfterObserverReferenceSeconds: 10, label: 'Late', signature: Signature.NOVA_SPECTRUM },
        { id: 'early', timeAfterObserverReferenceSeconds: 0, label: 'Early', signature: Signature.NOVA_SPECTRUM },
      ],
    };
    const first = TransientFollowUpEngine.characterize(input);
    const second = TransientFollowUpEngine.characterize(input);
    expect(first).toEqual(second);
    expect(first.modelMilestones.map(item => item.id)).toEqual(['start', 'end']);
    expect(first.observations.map(item => item.id)).toEqual(['early', 'late']);
    expect(input.modelMilestones[0].id).toBe('end');
    expect(TransientFollowUpEngine.modelPhaseAt(first, 29)?.id).toBe('start');
    expect(TransientFollowUpEngine.modelPhaseAt(first, 30)?.id).toBe('end');
  });

  it('future canonical event cannot masquerade as observation', () => {
    const future: TransientFollowUpInput = { id: 'FUTURE', family: Family.COMPACT_MERGER,
      origin: Origin.CANONICAL_FUTURE, forecastDelayYears: 1e7, modelMilestones: [], observations: [] };
    expect(TransientFollowUpEngine.characterize(future).classification).toBe(Classification.CANONICAL_FUTURE);
    expect(() => TransientFollowUpEngine.characterize({ ...future, observations: ambiguous.observations })).toThrow(RangeError);
    expect(() => TransientFollowUpEngine.characterize({ ...future, forecastDelayYears: null })).toThrow(RangeError);
  });

  it('rejects statistical event histories and ungrounded intrinsic events', () => {
    const milestone = { id: 'fake', timeAfterOnsetSeconds: 0, label: 'Fake', phase: Phase.ONSET };
    expect(() => TransientFollowUpEngine.characterize({ ...ambiguous, family: Family.STELLAR_FLARE, origin: Origin.STATISTICAL_ONLY,
      observations: [], modelMilestones: [milestone] })).toThrow(RangeError);
    expect(() => TransientFollowUpEngine.characterize({ ...ambiguous, family: Family.NOVA, origin: Origin.INTRINSIC_EXPLICIT,
      observations: [], modelMilestones: [] })).toThrow(RangeError);
  });

  it('rejects NaN, negative times, duplicate identity and invalid frames', () => {
    const milestone = { id: 'rise', timeAfterOnsetSeconds: -1, label: 'Rise', phase: Phase.RISE };
    expect(() => TransientFollowUpEngine.characterize({ ...ambiguous, family: Family.NOVA, origin: Origin.INTRINSIC_EXPLICIT,
      observations: [], modelMilestones: [milestone] })).toThrow(RangeError);
    expect(() => TransientFollowUpEngine.characterize({ ...ambiguous, observations: [
      { ...ambiguous.observations[0], timeAfterObserverReferenceSeconds: Number.NaN },
    ] })).toThrow(RangeError);
    expect(() => TransientFollowUpEngine.characterize({ ...ambiguous,
      observations: [ambiguous.observations[0], ambiguous.observations[0]] })).toThrow(RangeError);
    expect(() => TransientFollowUpEngine.modelPhaseAt(TransientFollowUpEngine.characterize(ambiguous), -1)).toThrow(RangeError);
  });
});
