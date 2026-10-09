import { StellarActivityProfile } from '../../domain/stellar/stellar-activity-profile';
import { StellarActivityRegime } from '../../domain/stellar/stellar-activity-regime';
import { GreatStellarFlareOutcome } from '../../domain/transient/great-stellar-flare-event-profile';
import {
  GreatStellarFlareEventState,
  GreatStellarFlareSourceKind,
  GreatStellarFlareSourceProfile,
} from '../../domain/transient/great-stellar-flare-source-profile';
import { GreatStellarFlareEventEngine } from './great-stellar-flare-event-engine';

describe('GreatStellarFlareEventEngine 29.9', () => {
  it('derives source-frame mean power and equivalent duration for an explicit superflare', () => {
    const activity = new StellarActivityProfile(
      true,
      0.86,
      StellarActivityRegime.EXTREME,
      1.4,
      2e25,
      3.496e27,
    );
    const event = GreatStellarFlareEventEngine.characterize(new GreatStellarFlareSourceProfile(
      GreatStellarFlareSourceKind.ORDINARY_STAR,
      'Enana M activa',
      0.30,
      0.020,
      activity,
      GreatStellarFlareEventState.EXPLICIT_LARGE_FLARE,
      1e27,
      3600,
    ));

    expect(event.outcome).toBe(GreatStellarFlareOutcome.EXPLICIT_LARGE_STELLAR_FLARE);
    expect(event.meanFlarePowerWatts).toBeCloseTo(2.777777777777778e23, -8);
    expect(event.equivalentDurationSeconds).toBeCloseTo(130.61650992685475, 8);
    expect(event.energyToTypicalRatio).toBeCloseTo(50, 10);
    expect(event.energyToMaximumFraction).toBeCloseTo(0.2860411899313501, 10);
  });

  it('does not turn point-15.4 flare statistics into a current event or schedule', () => {
    const activity = new StellarActivityProfile(
      true,
      0.78,
      StellarActivityRegime.EXTREME,
      1.2,
      1.5e25,
      2.406e27,
    );
    const event = GreatStellarFlareEventEngine.characterize(new GreatStellarFlareSourceProfile(
      GreatStellarFlareSourceKind.ORDINARY_STAR,
      'Enana M estadística',
      0.35,
      0.025,
      activity,
      GreatStellarFlareEventState.STATISTICAL_ACTIVITY_ONLY,
      null,
      null,
    ));

    expect(event.outcome).toBe(GreatStellarFlareOutcome.STATISTICAL_ACTIVITY_WITHOUT_EVENT);
    expect(event.meanFlarePowerWatts).toBeNull();
    expect(event.nextFlareTimeSeconds).toBeNull();
    expect(event.recurrencePeriodSeconds).toBeNull();
  });

  it('keeps observed flux, CME, particles and planetary dose unresolved from bolometric energy alone', () => {
    const activity = new StellarActivityProfile(
      true,
      0.46,
      StellarActivityRegime.MODERATE,
      0.08,
      1e24,
      1.028e26,
    );
    const event = GreatStellarFlareEventEngine.characterize(new GreatStellarFlareSourceProfile(
      GreatStellarFlareSourceKind.ORDINARY_STAR,
      'Análogo solar joven',
      1,
      1,
      activity,
      GreatStellarFlareEventState.EXPLICIT_LARGE_FLARE,
      4e25,
      1800,
    ));

    expect(event.observedBolometricFluxWattsPerSquareMeter).toBeNull();
    expect(event.observedFluenceJoulesPerSquareMeter).toBeNull();
    expect(event.cmeEnergyJoules).toBeNull();
    expect(event.chargedParticleEnergyJoules).toBeNull();
    expect(event.planetaryIncidentEnergyJoulesPerSquareMeter).toBeNull();
    expect(event.peakFlareLuminosityWatts).toBeNull();
  });
});
