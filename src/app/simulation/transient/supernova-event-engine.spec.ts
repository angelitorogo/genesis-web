import {
  SupernovaCompactRemnantKind,
} from '../../domain/transient/supernova-event-profile';
import {
  SupernovaPhase,
} from '../../domain/transient/supernova-phase';
import {
  SupernovaProgenitorChannel,
  SupernovaProgenitorCompactRemnantHint,
  SupernovaProgenitorProfile,
} from '../../domain/transient/supernova-progenitor';
import {
  SupernovaType,
} from '../../domain/transient/supernova-type';
import {
  SupernovaEventEngine,
} from './supernova-event-engine';

describe('29.1A — SupernovaEventEngine', () => {
  const ia = new SupernovaProgenitorProfile(
    SupernovaProgenitorChannel.THERMONUCLEAR_WHITE_DWARF,
    5.2,
    1.38,
    1,
    0,
    0,
    1.38,
  );

  const ii = new SupernovaProgenitorProfile(
    SupernovaProgenitorChannel.CORE_COLLAPSE,
    18,
    13,
    1,
    0.46,
    0.28,
    null,
  );

  const ib = new SupernovaProgenitorProfile(
    SupernovaProgenitorChannel.CORE_COLLAPSE,
    22,
    6.5,
    1.2,
    0.02,
    0.34,
    null,
  );

  const ic = new SupernovaProgenitorProfile(
    SupernovaProgenitorChannel.CORE_COLLAPSE,
    30,
    7.5,
    0.8,
    0.005,
    0.025,
    null,
  );

  it('classifies Ia, II, Ib and Ic from physical progenitor envelopes', () => {
    expect(SupernovaEventEngine.deriveProfile(ia).type).toBe(SupernovaType.TYPE_IA);
    expect(SupernovaEventEngine.deriveProfile(ii).type).toBe(SupernovaType.TYPE_II);
    expect(SupernovaEventEngine.deriveProfile(ib).type).toBe(SupernovaType.TYPE_IB);
    expect(SupernovaEventEngine.deriveProfile(ic).type).toBe(SupernovaType.TYPE_IC);
  });

  it('destroys the thermonuclear white dwarf but leaves compact remnants after core collapse', () => {
    const iaProfile = SupernovaEventEngine.deriveProfile(ia);
    const iiProfile = SupernovaEventEngine.deriveProfile(ii);
    const icProfile = SupernovaEventEngine.deriveProfile(ic);

    expect(iaProfile.compactRemnantKind).toBe(SupernovaCompactRemnantKind.NONE);
    expect(iaProfile.compactRemnantMassSolar).toBeNull();
    expect(iiProfile.compactRemnantKind).toBe(SupernovaCompactRemnantKind.NEUTRON_STAR);
    expect(icProfile.compactRemnantKind).toBe(SupernovaCompactRemnantKind.STELLAR_BLACK_HOLE);
  });

  it('lets integrated stellar Ground Truth override only the compact-remnant heuristic', () => {
    const metallicityBoundary = new SupernovaProgenitorProfile(
      SupernovaProgenitorChannel.CORE_COLLAPSE,
      26,
      10.2,
      3,
      0.2,
      0.3,
      null,
      SupernovaProgenitorCompactRemnantHint.NEUTRON_STAR,
    );

    const profile = SupernovaEventEngine.deriveProfile(metallicityBoundary);

    expect(profile.compactRemnantKind).toBe(
      SupernovaCompactRemnantKind.NEUTRON_STAR,
    );
    expect(profile.type).toBe(SupernovaType.TYPE_II);
  });

  it('derives positive energetics and subluminal ejecta velocities from E and ejecta mass', () => {
    for (const progenitor of [ia, ii, ib, ic]) {
      const profile = SupernovaEventEngine.deriveProfile(progenitor);
      expect(profile.explosionEnergyJoules).toBeGreaterThan(0);
      expect(profile.ejectaMassSolar).toBeGreaterThan(0);
      expect(profile.characteristicEjectaVelocityKmS).toBeGreaterThan(1_000);
      expect(profile.characteristicEjectaVelocityKmS).toBeLessThan(299_792.458);
      expect(profile.peakBolometricLuminosityWatts).toBeGreaterThan(0);
    }
  });

  it('keeps Type II on a plateau while stripped-envelope events decline directly', () => {
    const iiProfile = SupernovaEventEngine.deriveProfile(ii);
    const ibProfile = SupernovaEventEngine.deriveProfile(ib);

    expect(iiProfile.plateauDurationDays).not.toBeNull();
    expect(ibProfile.plateauDurationDays).toBeNull();

    expect(
      SupernovaEventEngine.sample(iiProfile, 40).phase,
    ).toBe(SupernovaPhase.PLATEAU);
    expect(
      SupernovaEventEngine.sample(ibProfile, 40).phase,
    ).toBe(SupernovaPhase.DECLINE);
  });

  it('uses relative simulation time only and evolves reproducibly from precursor to remnant', () => {
    const profile = SupernovaEventEngine.deriveProfile(ia);
    const precursor = SupernovaEventEngine.sample(profile, -10);
    const peak = SupernovaEventEngine.sample(profile, profile.riseTimeDays);
    const remnant = SupernovaEventEngine.sample(profile, 500);

    expect(precursor.phase).toBe(SupernovaPhase.PRECURSOR);
    expect(peak.phase).toBe(SupernovaPhase.PEAK);
    expect(remnant.phase).toBe(SupernovaPhase.EARLY_REMNANT);
    expect(peak.bolometricLuminosityWatts).toBeGreaterThan(precursor.bolometricLuminosityWatts);
    expect(remnant.ejectaRadiusAu).toBeGreaterThan(peak.ejectaRadiusAu);
    expect(SupernovaEventEngine.sample(profile, 100)).toEqual(
      SupernovaEventEngine.sample(profile, 100),
    );
  });
});
