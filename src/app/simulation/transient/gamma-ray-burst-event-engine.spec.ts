import {
  GammaRayBurstFamily,
  GammaRayBurstObserverPromptStatus,
  GammaRayBurstOutcome,
} from '../../domain/transient/gamma-ray-burst-event-profile';
import {
  GammaRayBurstJetState,
  GammaRayBurstProgenitorKind,
  GammaRayBurstSourceProfile,
} from '../../domain/transient/gamma-ray-burst-source-profile';
import { GammaRayBurstEventEngine } from './gamma-ray-burst-event-engine';

describe('GammaRayBurstEventEngine 29.7', () => {
  it('derives an intrinsic short-GRB jet from an explicit NS-NS jet without inventing observer quantities', () => {
    const profile = GammaRayBurstEventEngine.deriveProfile(
      new GammaRayBurstSourceProfile(
        GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_NS,
        GammaRayBurstJetState.RELATIVISTIC_JET_CONFIRMED,
        0.45,
        8,
        120,
        null,
        null,
        null,
      ),
    );

    expect(profile.family).toBe(GammaRayBurstFamily.SHORT_MERGER);
    expect(profile.outcome).toBe(GammaRayBurstOutcome.SUCCESSFUL_SHORT_GRB_ENGINE);
    expect(profile.observerPromptStatus).toBe(
      GammaRayBurstObserverPromptStatus.ORIENTATION_UNRESOLVED,
    );
    expect(profile.twoSidedJetSkyFraction).toBeCloseTo(1 - Math.cos(8 * Math.PI / 180), 12);
    expect(profile.relativisticBeamingHalfAngleDegrees).toBeCloseTo(180 / Math.PI / 120, 12);
    expect(profile.observedT90Seconds).toBeNull();
    expect(profile.isotropicEquivalentGammaEnergyJoules).toBeNull();
    expect(profile.observedPeakFluxWattsPerSquareMeter).toBeNull();
  });

  it('keeps an NS-BH GRB unresolved when jet launch is not known', () => {
    const profile = GammaRayBurstEventEngine.deriveProfile(
      new GammaRayBurstSourceProfile(
        GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_BH,
        GammaRayBurstJetState.JET_LAUNCH_UNRESOLVED,
        null,
        null,
        null,
        null,
        null,
        null,
      ),
    );

    expect(profile.family).toBe(GammaRayBurstFamily.UNRESOLVED);
    expect(profile.outcome).toBe(GammaRayBurstOutcome.JET_LAUNCH_UNRESOLVED);
    expect(profile.twoSidedJetSkyFraction).toBeNull();
    expect(profile.observerPromptStatus).toBe(
      GammaRayBurstObserverPromptStatus.ENGINE_UNRESOLVED,
    );
  });

  it('derives a successful long-GRB collapsar only when the engine outlives breakout', () => {
    const profile = GammaRayBurstEventEngine.deriveProfile(
      new GammaRayBurstSourceProfile(
        GammaRayBurstProgenitorKind.COLLAPSAR_STRIPPED_STAR,
        GammaRayBurstJetState.RELATIVISTIC_JET_CONFIRMED,
        35,
        6,
        150,
        3,
        1.1,
        0.25,
      ),
    );

    expect(profile.family).toBe(GammaRayBurstFamily.LONG_COLLAPSAR);
    expect(profile.outcome).toBe(GammaRayBurstOutcome.SUCCESSFUL_LONG_GRB_ENGINE);
    expect(profile.stellarBreakoutTimeSeconds).not.toBeNull();
    expect(profile.stellarBreakoutTimeSeconds!).toBeLessThan(35);
    expect(profile.sourceFrameExternalJetActivitySeconds).toBeCloseTo(
      35 - profile.stellarBreakoutTimeSeconds!,
      12,
    );
    expect(profile.observerPromptStatus).toBe(
      GammaRayBurstObserverPromptStatus.ON_AXIS_PROMPT_GEOMETRY,
    );
  });

  it('keeps an explicit off-axis source distinct from an absent intrinsic jet', () => {
    const profile = GammaRayBurstEventEngine.deriveProfile(
      new GammaRayBurstSourceProfile(
        GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_NS,
        GammaRayBurstJetState.RELATIVISTIC_JET_CONFIRMED,
        0.7,
        7,
        100,
        25,
        null,
        null,
      ),
    );

    expect(profile.outcome).toBe(GammaRayBurstOutcome.SUCCESSFUL_SHORT_GRB_ENGINE);
    expect(profile.observerPromptStatus).toBe(
      GammaRayBurstObserverPromptStatus.OFF_AXIS_PROMPT_SUPPRESSED,
    );
  });

  it('classifies an engine that dies before stellar breakout as a choked collapsar with no classical prompt GRB', () => {
    const profile = GammaRayBurstEventEngine.deriveProfile(
      new GammaRayBurstSourceProfile(
        GammaRayBurstProgenitorKind.COLLAPSAR_STRIPPED_STAR,
        GammaRayBurstJetState.CHOKED_JET_CONFIRMED,
        4,
        10,
        null,
        null,
        1.8,
        0.18,
      ),
    );

    expect(profile.family).toBe(GammaRayBurstFamily.NO_CLASSICAL_GRB);
    expect(profile.outcome).toBe(GammaRayBurstOutcome.CHOKED_COLLAPSAR_NO_CLASSICAL_GRB);
    expect(profile.stellarBreakoutTimeSeconds!).toBeGreaterThan(4);
    expect(profile.sourceFrameExternalJetActivitySeconds).toBeNull();
    expect(profile.observerPromptStatus).toBe(
      GammaRayBurstObserverPromptStatus.NO_CLASSICAL_PROMPT,
    );
  });
});
