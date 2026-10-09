import { GammaRayBurstOutcome } from '../../domain/transient/gamma-ray-burst-event-profile';
import {
  GammaRayBurstJetState,
  GammaRayBurstProgenitorKind,
  GammaRayBurstSourceProfile,
} from '../../domain/transient/gamma-ray-burst-source-profile';
import { GammaRayBurstEventEngine } from './gamma-ray-burst-event-engine';

describe('29.7 gamma-ray-burst architecture boundary', () => {
  it('does not include BH-BH as a prompt GRB progenitor channel', () => {
    expect(Object.values(GammaRayBurstProgenitorKind)).toEqual([
      GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_NS,
      GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_BH,
      GammaRayBurstProgenitorKind.COLLAPSAR_STRIPPED_STAR,
    ]);
  });

  it('does not promote the already-canonical NS-BH merger into a GRB without explicit jet physics', () => {
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
    expect(profile.outcome).toBe(GammaRayBurstOutcome.JET_LAUNCH_UNRESOLVED);
    expect(profile.jetHalfOpeningAngleDegrees).toBeNull();
    expect(profile.bulkLorentzFactor).toBeNull();
  });

  it('keeps distance, redshift, E_iso, fluence, flux and afterglow unresolved even for an intrinsic successful jet', () => {
    const profile = GammaRayBurstEventEngine.deriveProfile(
      new GammaRayBurstSourceProfile(
        GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_NS,
        GammaRayBurstJetState.RELATIVISTIC_JET_CONFIRMED,
        0.5,
        8,
        100,
        2,
        null,
        null,
      ),
    );
    expect(profile.luminosityDistanceParsec).toBeNull();
    expect(profile.sourceRedshift).toBeNull();
    expect(profile.isotropicEquivalentGammaEnergyJoules).toBeNull();
    expect(profile.observedFluenceJoulesPerSquareMeter).toBeNull();
    expect(profile.observedPeakFluxWattsPerSquareMeter).toBeNull();
    expect(profile.afterglowFluxResolved).toBeNull();
  });
});
