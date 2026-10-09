import { StellarActivityProfile } from '../../domain/stellar/stellar-activity-profile';
import { StellarActivityRegime } from '../../domain/stellar/stellar-activity-regime';
import { GreatStellarFlareOutcome } from '../../domain/transient/great-stellar-flare-event-profile';
import {
  GreatStellarFlareEventState,
  GreatStellarFlareSourceKind,
  GreatStellarFlareSourceProfile,
} from '../../domain/transient/great-stellar-flare-source-profile';
import { GreatStellarFlareEventEngine } from './great-stellar-flare-event-engine';

describe('29.9 great stellar flare integration closure', () => {
  it('keeps point-15.4 statistical activity distinct from a 29.9 individual event', () => {
    const activity = new StellarActivityProfile(
      true,
      0.80,
      StellarActivityRegime.EXTREME,
      1.5,
      2e25,
      3.28e27,
    );
    const profile = GreatStellarFlareEventEngine.characterize(new GreatStellarFlareSourceProfile(
      GreatStellarFlareSourceKind.ORDINARY_STAR,
      'Enana M activa',
      0.3,
      0.02,
      activity,
      GreatStellarFlareEventState.STATISTICAL_ACTIVITY_ONLY,
      null,
      null,
    ));

    expect(activity.hasModeledFlares).toBe(true);
    expect(profile.outcome).toBe(GreatStellarFlareOutcome.STATISTICAL_ACTIVITY_WITHOUT_EVENT);
    expect(profile.nextFlareTimeSeconds).toBeNull();
  });

  it('does not reinterpret compact-remnant bursts as ordinary stellar flares', () => {
    const profile = GreatStellarFlareEventEngine.characterize(new GreatStellarFlareSourceProfile(
      GreatStellarFlareSourceKind.COMPACT_REMNANT_BOUNDARY,
      'Magnetar / estrella de neutrones',
      null,
      null,
      new StellarActivityProfile(false, null, null, null, null, null),
      GreatStellarFlareEventState.ORDINARY_FLARE_MODEL_NOT_APPLICABLE,
      null,
      null,
    ));

    expect(profile.outcome)
      .toBe(GreatStellarFlareOutcome.ORDINARY_STELLAR_FLARE_MODEL_NOT_APPLICABLE);
    expect(profile.stellarLuminosityWatts).toBeNull();
  });
});
