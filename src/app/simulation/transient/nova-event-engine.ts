import { NovaEventProfile } from '../../domain/transient/nova-event-profile';
import { type NovaObservationSnapshot } from '../../domain/transient/nova-observation-snapshot';
import { NovaPhase } from '../../domain/transient/nova-phase';
import { type NovaProgenitorProfile } from '../../domain/transient/nova-progenitor';
import { NovaType } from '../../domain/transient/nova-type';

const SOLAR_LUMINOSITY_WATTS = 3.828e26;
const SOLAR_MASS_KG = 1.98847e30;
const DAY_SECONDS = 86_400;
const AU_KM = 149_597_870.7;
const SOLAR_ABSOLUTE_BOLOMETRIC_MAGNITUDE = 4.74;

/** 29.2 deterministic thermonuclear surface-eruption envelope. */
export class NovaEventEngine {
  private constructor() {}

  static deriveProfile(progenitor: NovaProgenitorProfile): NovaEventProfile {
    const recurrenceIntervalYears = progenitor.recurrenceIntervalYears;
    const type = recurrenceIntervalYears <= 100 && progenitor.whiteDwarfMassSolar >= 1.05
      ? NovaType.RECURRENT
      : NovaType.CLASSICAL;

    const massFactor = clamp((progenitor.whiteDwarfMassSolar - 0.45) / 0.93, 0, 1);
    const rateFactor = clamp(
      (Math.log10(progenitor.effectiveAccretionRateSolarPerYear) + 12) / 5.7,
      0,
      1,
    );
    const ejectaFraction = type === NovaType.RECURRENT
      ? clamp(0.62 - 0.26 * massFactor + 0.05 * (1 - rateFactor), 0.26, 0.66)
      : clamp(0.88 - 0.18 * massFactor, 0.62, 0.93);
    const ejectaMassSolar = progenitor.ignitionEnvelopeMassSolar * ejectaFraction;
    const retainedEnvelopeMassSolar = progenitor.ignitionEnvelopeMassSolar - ejectaMassSolar;
    const characteristicEjectaVelocityKmS = clamp(
      550 + 3200 * massFactor + (type === NovaType.RECURRENT ? 900 : 0),
      500,
      5200,
    );
    const kineticEnergyJoules =
      0.5 * ejectaMassSolar * SOLAR_MASS_KG * (characteristicEjectaVelocityKmS * 1000) ** 2;
    const peakBolometricLuminosityWatts = clamp(
      (2.5e31 + 8.5e31 * massFactor) * (type === NovaType.RECURRENT ? 1.12 : 1),
      2e31,
      1.4e32,
    );
    const peakAbsoluteBolometricMagnitude = bolometricMagnitude(peakBolometricLuminosityWatts);
    const riseTimeDays = type === NovaType.RECURRENT
      ? clamp(0.6 + (1 - massFactor) * 2.2, 0.5, 3.2)
      : clamp(1.2 + (1 - massFactor) * 5.8, 1.0, 7.5);
    const declineTwoMagnitudeDays = type === NovaType.RECURRENT
      ? clamp(4 + (1 - massFactor) * 16, 3, 22)
      : clamp(10 + (1 - massFactor) * 55, 8, 70);
    const nebularTransitionDays = declineTwoMagnitudeDays * (type === NovaType.RECURRENT ? 2.7 : 3.4);
    const returnToQuiescenceDays = nebularTransitionDays * (type === NovaType.RECURRENT ? 4.2 : 5.0);
    const peakPhotosphericTemperatureKelvin = clamp(
      8_000 + massFactor * 4_500,
      7_500,
      13_500,
    );

    return new NovaEventProfile(
      type,
      progenitor,
      ejectaMassSolar,
      retainedEnvelopeMassSolar,
      kineticEnergyJoules,
      characteristicEjectaVelocityKmS,
      peakBolometricLuminosityWatts,
      peakAbsoluteBolometricMagnitude,
      peakPhotosphericTemperatureKelvin,
      riseTimeDays,
      declineTwoMagnitudeDays,
      nebularTransitionDays,
      returnToQuiescenceDays,
      recurrenceIntervalYears,
    );
  }

  static sample(profile: NovaEventProfile, elapsedDays: number): NovaObservationSnapshot {
    if (!Number.isFinite(elapsedDays) || elapsedDays < -30 || elapsedDays > 5_000) {
      throw new RangeError('elapsedDays must be finite and in [-30, 5000].');
    }

    const phase = phaseAt(profile, elapsedDays);
    const normalizedBrightness = brightnessAt(profile, elapsedDays);
    const floor = 2.5e-5;
    const bolometricLuminosityWatts = profile.peakBolometricLuminosityWatts * Math.max(floor, normalizedBrightness);
    const photosphericTemperatureKelvin = temperatureAt(profile, elapsedDays, normalizedBrightness);
    const expansionDays = Math.max(0, elapsedDays);
    const ejectaRadiusAu =
      profile.characteristicEjectaVelocityKmS * DAY_SECONDS * expansionDays / AU_KM;

    return Object.freeze({
      elapsedDays,
      phase,
      normalizedBrightness,
      bolometricLuminosityWatts,
      absoluteBolometricMagnitude: bolometricMagnitude(bolometricLuminosityWatts),
      photosphericTemperatureKelvin,
      ejectaRadiusAu,
    });
  }
}

function phaseAt(profile: NovaEventProfile, day: number): NovaPhase {
  if (day < -1) return NovaPhase.QUIESCENT;
  if (day < 0) return NovaPhase.PRECURSOR;
  if (day === 0) return NovaPhase.ERUPTION;
  if (day < profile.riseTimeDays) return NovaPhase.RISE;
  if (day < profile.riseTimeDays + 1.5) return NovaPhase.PEAK;
  if (day < profile.nebularTransitionDays) return NovaPhase.DECLINE;
  if (day < profile.returnToQuiescenceDays) return NovaPhase.NEBULAR;
  return NovaPhase.RETURN_TO_QUIESCENCE;
}

function brightnessAt(profile: NovaEventProfile, day: number): number {
  if (day < -1) return 2.5e-5;
  if (day < 0) return lerp(2.5e-5, 0.004, day + 1);
  if (day <= profile.riseTimeDays) {
    return lerp(0.04, 1, Math.pow(day / profile.riseTimeDays, 0.58));
  }

  const declineDay = day - profile.riseTimeDays;
  const fluxAtTwoMagnitudes = Math.pow(10, -0.8);
  if (declineDay <= profile.declineTwoMagnitudeDays) {
    return Math.pow(fluxAtTwoMagnitudes, declineDay / profile.declineTwoMagnitudeDays);
  }

  const tail = declineDay - profile.declineTwoMagnitudeDays;
  const tau = Math.max(12, profile.nebularTransitionDays * 0.65);
  return Math.max(2.5e-5, fluxAtTwoMagnitudes * Math.exp(-tail / tau));
}

function temperatureAt(profile: NovaEventProfile, day: number, brightness: number): number {
  if (day < 0) return 9_000;
  const hotNebular = clamp(
    profile.peakPhotosphericTemperatureKelvin * (1 + Math.log10(day + 1) * 0.34),
    profile.peakPhotosphericTemperatureKelvin,
    45_000,
  );
  return clamp(
    hotNebular * (0.82 + 0.18 * Math.sqrt(Math.max(brightness, 0))),
    7_500,
    45_000,
  );
}

function bolometricMagnitude(luminosityWatts: number): number {
  return SOLAR_ABSOLUTE_BOLOMETRIC_MAGNITUDE -
    2.5 * Math.log10(Math.max(luminosityWatts, 1) / SOLAR_LUMINOSITY_WATTS);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}
