import { StellarActivityProfile } from '../stellar/stellar-activity-profile';
import { StellarActivityRegime } from '../stellar/stellar-activity-regime';
import {
  GreatStellarFlareEventState,
  GreatStellarFlareSourceKind,
  GreatStellarFlareSourceProfile,
} from './great-stellar-flare-source-profile';

describe('GreatStellarFlareSourceProfile 29.9', () => {
  const activity = new StellarActivityProfile(
    true,
    0.82,
    StellarActivityRegime.EXTREME,
    1.1,
    2e25,
    3.35e27,
  );

  it('accepts an explicit large flare inside the point-15.4 statistical energy envelope', () => {
    const source = new GreatStellarFlareSourceProfile(
      GreatStellarFlareSourceKind.ORDINARY_STAR,
      'Enana M activa',
      0.32,
      0.018,
      activity,
      GreatStellarFlareEventState.EXPLICIT_LARGE_FLARE,
      1e27,
      3600,
    );

    expect(source.flareEnergyJoules).toBe(1e27);
  });

  it('allows magnetic-activity statistics without fabricating an individual event', () => {
    const source = new GreatStellarFlareSourceProfile(
      GreatStellarFlareSourceKind.ORDINARY_STAR,
      'Enana M activa',
      0.32,
      0.018,
      activity,
      GreatStellarFlareEventState.STATISTICAL_ACTIVITY_ONLY,
      null,
      null,
    );

    expect(source.flareEnergyJoules).toBeNull();
    expect(source.sourceFrameDurationSeconds).toBeNull();
  });

  it('keeps compact remnants outside the ordinary stellar-flare contract', () => {
    const compactActivity = new StellarActivityProfile(false, null, null, null, null, null);
    const source = new GreatStellarFlareSourceProfile(
      GreatStellarFlareSourceKind.COMPACT_REMNANT_BOUNDARY,
      'Magnetar / estrella de neutrones',
      null,
      null,
      compactActivity,
      GreatStellarFlareEventState.ORDINARY_FLARE_MODEL_NOT_APPLICABLE,
      null,
      null,
    );

    expect(source.activityProfile.ordinaryFlareModelApplicable).toBe(false);
  });

  it('rejects a large flare above the frozen point-15.4 maximum for that source', () => {
    expect(() => new GreatStellarFlareSourceProfile(
      GreatStellarFlareSourceKind.ORDINARY_STAR,
      'Enana M activa',
      0.32,
      0.018,
      activity,
      GreatStellarFlareEventState.EXPLICIT_LARGE_FLARE,
      4e27,
      3600,
    )).toThrow(RangeError);
  });

  it('rejects partial event data and compact-remnant leakage', () => {
    expect(() => new GreatStellarFlareSourceProfile(
      GreatStellarFlareSourceKind.ORDINARY_STAR,
      'Enana M activa',
      0.32,
      0.018,
      activity,
      GreatStellarFlareEventState.EXPLICIT_LARGE_FLARE,
      1e27,
      null,
    )).toThrow(RangeError);

    expect(() => new GreatStellarFlareSourceProfile(
      GreatStellarFlareSourceKind.COMPACT_REMNANT_BOUNDARY,
      'Magnetar',
      0.00002,
      0.001,
      new StellarActivityProfile(false, null, null, null, null, null),
      GreatStellarFlareEventState.ORDINARY_FLARE_MODEL_NOT_APPLICABLE,
      null,
      null,
    )).toThrow(RangeError);
  });
});
