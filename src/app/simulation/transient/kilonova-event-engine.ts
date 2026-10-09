import { KilonovaEventProfile, KilonovaRemnantKind } from '../../domain/transient/kilonova-event-profile';
import { type KilonovaObservationSnapshot } from '../../domain/transient/kilonova-observation-snapshot';
import { KilonovaPhase } from '../../domain/transient/kilonova-phase';
import { type KilonovaProgenitorProfile } from '../../domain/transient/kilonova-progenitor';
import { KilonovaType } from '../../domain/transient/kilonova-type';

const C_MS = 299_792_458;
const SOLAR_MASS_KG = 1.98847e30;
const DAY_SECONDS = 86_400;
const AU_M = 149_597_870_700;

/** 29.3 deterministic two-component kilonova envelope. */
export class KilonovaEventEngine {
  private constructor() {}

  static deriveProfile(progenitor: KilonovaProgenitorProfile): KilonovaEventProfile {
    const totalMass = progenitor.primaryMassSolar + progenitor.secondaryMassSolar;
    const q = Math.min(progenitor.primaryMassSolar, progenitor.secondaryMassSolar) /
      Math.max(progenitor.primaryMassSolar, progenitor.secondaryMassSolar);

    let totalEjecta: number;
    let blueFraction: number;
    let blueVelocity: number;
    let redVelocity: number;
    let remnantKind: typeof KilonovaRemnantKind[keyof typeof KilonovaRemnantKind];

    if (progenitor.type === KilonovaType.BINARY_NEUTRON_STAR) {
      totalEjecta = clamp(0.012 + (1 - q) * 0.085 + clamp((2.85 - totalMass) * 0.018, -0.008, 0.018), 0.004, 0.085);
      blueFraction = clamp(0.46 - (1 - q) * 0.28 - Math.max(0, totalMass - 2.75) * 0.25, 0.12, 0.55);
      blueVelocity = clamp(0.22 + (1 - q) * 0.10, 0.20, 0.32);
      redVelocity = clamp(0.13 + (1 - q) * 0.07, 0.11, 0.22);
      remnantKind = totalMass < 2.55
        ? KilonovaRemnantKind.MASSIVE_NEUTRON_STAR
        : totalMass < 2.95
          ? KilonovaRemnantKind.HYPERMASSIVE_NEUTRON_STAR
          : KilonovaRemnantKind.STELLAR_BLACK_HOLE;
    } else {
      const disruption = Math.max(0, (progenitor.tidalDisruptionRatio ?? 1) - 1);
      totalEjecta = clamp(0.008 + 0.080 * disruption + 0.018 * (1 - q), 0.006, 0.12);
      blueFraction = clamp(0.10 + 0.16 * disruption, 0.08, 0.30);
      blueVelocity = clamp(0.20 + 0.08 * disruption, 0.18, 0.30);
      redVelocity = clamp(0.16 + 0.07 * disruption, 0.14, 0.28);
      remnantKind = KilonovaRemnantKind.STELLAR_BLACK_HOLE;
    }

    const blueEjecta = totalEjecta * blueFraction;
    const redEjecta = totalEjecta - blueEjecta;
    const rProcessMass = totalEjecta * (progenitor.type === KilonovaType.BINARY_NEUTRON_STAR ? 0.82 : 0.90);
    const kineticEnergy = kinetic(blueEjecta, blueVelocity) + kinetic(redEjecta, redVelocity);
    const bluePeakTime = clamp(0.65 * (blueEjecta / 0.01) ** 0.35 * (0.25 / blueVelocity) ** 0.65, 0.25, 2.5);
    const redPeakTime = clamp(4.2 * (redEjecta / 0.03) ** 0.38 * (0.16 / redVelocity) ** 0.62, 1.8, 10);
    const bluePeakLuminosity = clamp(5.0e34 * (blueEjecta / 0.01) ** 0.35 * (blueVelocity / 0.25) ** 0.5, 7e33, 1.2e35);
    const redPeakLuminosity = clamp(1.7e34 * (redEjecta / 0.03) ** 0.35 * (redVelocity / 0.16) ** 0.45, 4e33, 6e34);
    const gravitationalRadiationMassFraction = progenitor.type === KilonovaType.BINARY_NEUTRON_STAR ? 0.035 : 0.03;
    const remnantMass = totalMass * (1 - gravitationalRadiationMassFraction) - totalEjecta;

    return new KilonovaEventProfile(
      progenitor.type,
      progenitor,
      totalEjecta,
      blueEjecta,
      redEjecta,
      rProcessMass,
      blueVelocity,
      redVelocity,
      kineticEnergy,
      bluePeakTime,
      redPeakTime,
      bluePeakLuminosity,
      redPeakLuminosity,
      remnantKind,
      remnantMass,
    );
  }

  static sample(profile: KilonovaEventProfile, elapsedDays: number): KilonovaObservationSnapshot {
    if (!Number.isFinite(elapsedDays) || elapsedDays < -7 || elapsedDays > 365) {
      throw new RangeError('elapsedDays must be finite and in [-7, 365].');
    }
    if (elapsedDays < 0) {
      return Object.freeze({ elapsedDays, phase: KilonovaPhase.PRE_MERGER,
        blueLuminosityWatts: 0, redLuminosityWatts: 0, bolometricLuminosityWatts: 0,
        blueEjectaRadiusAu: 0, redEjectaRadiusAu: 0 });
    }
    const blue = componentLuminosity(elapsedDays, profile.bluePeakTimeDays, profile.bluePeakLuminosityWatts, 1.55);
    const red = componentLuminosity(elapsedDays, profile.redPeakTimeDays, profile.redPeakLuminosityWatts, 1.25);
    const phase = elapsedDays <= 0.02 ? KilonovaPhase.MERGER
      : elapsedDays <= profile.bluePeakTimeDays * 2 ? KilonovaPhase.BLUE_COMPONENT
      : elapsedDays <= profile.redPeakTimeDays * 2 ? KilonovaPhase.RED_COMPONENT
      : elapsedDays <= 45 ? KilonovaPhase.NEBULAR
      : KilonovaPhase.FADE;
    return Object.freeze({
      elapsedDays,
      phase,
      blueLuminosityWatts: blue,
      redLuminosityWatts: red,
      bolometricLuminosityWatts: blue + red,
      blueEjectaRadiusAu: profile.characteristicBlueVelocityFractionC * C_MS * elapsedDays * DAY_SECONDS / AU_M,
      redEjectaRadiusAu: profile.characteristicRedVelocityFractionC * C_MS * elapsedDays * DAY_SECONDS / AU_M,
    });
  }
}

function kinetic(massSolar: number, fractionC: number): number {
  return 0.5 * massSolar * SOLAR_MASS_KG * (fractionC * C_MS) ** 2;
}
function componentLuminosity(day: number, peakDay: number, peakLuminosity: number, risePower: number): number {
  if (day <= 0) return peakLuminosity * 0.015;
  const x = Math.max(1e-6, day / peakDay);
  if (x <= 1) return peakLuminosity * x ** risePower;
  return peakLuminosity * Math.exp(-(x - 1) * 0.72) / Math.sqrt(x);
}
function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
