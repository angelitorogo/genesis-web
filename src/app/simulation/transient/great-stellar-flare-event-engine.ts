import {
  GreatStellarFlareEventProfile,
  GreatStellarFlareOutcome,
} from '../../domain/transient/great-stellar-flare-event-profile';
import {
  GreatStellarFlareEventState,
  type GreatStellarFlareSourceProfile,
} from '../../domain/transient/great-stellar-flare-source-profile';

const SOLAR_LUMINOSITY_WATTS = 3.828e26;

/**
 * 29.9 intrinsic large-stellar-flare projection.
 *
 * Point 15.4 provides statistical magnetic activity. 29.9 does not sample a
 * next event from flareRatePerDay. An individual flare exists here only when
 * its source-frame energy and duration are explicitly supplied.
 */
export class GreatStellarFlareEventEngine {
  private constructor() {}

  static characterize(source: GreatStellarFlareSourceProfile): GreatStellarFlareEventProfile {
    if (
      source.eventState ===
      GreatStellarFlareEventState.ORDINARY_FLARE_MODEL_NOT_APPLICABLE
    ) {
      return new GreatStellarFlareEventProfile(
        source,
        GreatStellarFlareOutcome.ORDINARY_STELLAR_FLARE_MODEL_NOT_APPLICABLE,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      );
    }

    const stellarLuminosityWatts =
      source.stellarLuminositySolar! * SOLAR_LUMINOSITY_WATTS;

    if (
      source.eventState ===
      GreatStellarFlareEventState.STATISTICAL_ACTIVITY_ONLY
    ) {
      return new GreatStellarFlareEventProfile(
        source,
        GreatStellarFlareOutcome.STATISTICAL_ACTIVITY_WITHOUT_EVENT,
        stellarLuminosityWatts,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      );
    }

    const energy = source.flareEnergyJoules!;
    const duration = source.sourceFrameDurationSeconds!;
    const typical = source.activityProfile.typicalFlareEnergyJoules!;
    const maximum = source.activityProfile.maximumFlareEnergyJoules!;
    const meanPower = energy / duration;

    return new GreatStellarFlareEventProfile(
      source,
      GreatStellarFlareOutcome.EXPLICIT_LARGE_STELLAR_FLARE,
      stellarLuminosityWatts,
      meanPower,
      energy / stellarLuminosityWatts,
      energy / typical,
      energy / maximum,
      meanPower / stellarLuminosityWatts,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    );
  }
}
