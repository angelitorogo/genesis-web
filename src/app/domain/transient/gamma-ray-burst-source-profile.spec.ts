import {
  GammaRayBurstJetState,
  GammaRayBurstProgenitorKind,
  GammaRayBurstSourceProfile,
} from './gamma-ray-burst-source-profile';

describe('GammaRayBurstSourceProfile 29.7', () => {
  it('does not let an unresolved jet hide guessed opening-angle or Lorentz parameters', () => {
    expect(() => new GammaRayBurstSourceProfile(
      GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_NS,
      GammaRayBurstJetState.JET_LAUNCH_UNRESOLVED,
      null,
      8,
      100,
      null,
      null,
      null,
    )).toThrowError(/cannot fabricate opening angle or Lorentz factor/i);
  });

  it('keeps compact-merger channels free of a fabricated stellar-envelope breakout geometry', () => {
    expect(() => new GammaRayBurstSourceProfile(
      GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_BH,
      GammaRayBurstJetState.JET_LAUNCH_UNRESOLVED,
      null,
      null,
      null,
      null,
      1,
      0.2,
    )).toThrowError(/cannot carry a stellar-envelope breakout geometry/i);
  });

  it('requires collapsars to expose the stellar radius and jet-head propagation speed explicitly', () => {
    expect(() => new GammaRayBurstSourceProfile(
      GammaRayBurstProgenitorKind.COLLAPSAR_STRIPPED_STAR,
      GammaRayBurstJetState.RELATIVISTIC_JET_CONFIRMED,
      30,
      6,
      100,
      null,
      null,
      null,
    )).toThrowError(/requires an explicit stellar radius and jet-head velocity/i);
  });
});
