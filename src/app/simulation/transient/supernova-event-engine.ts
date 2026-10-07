import {
  SupernovaCompactRemnantKind,
  SupernovaEventProfile,
} from '../../domain/transient/supernova-event-profile';
import {
  type SupernovaObservationSnapshot,
} from '../../domain/transient/supernova-observation-snapshot';
import {
  SupernovaPhase,
} from '../../domain/transient/supernova-phase';
import {
  SupernovaProgenitorChannel,
  SupernovaProgenitorCompactRemnantHint,
  type SupernovaProgenitorProfile,
} from '../../domain/transient/supernova-progenitor';
import {
  SupernovaType,
} from '../../domain/transient/supernova-type';

const SOLAR_MASS_KG = 1.98847e30;
const SOLAR_LUMINOSITY_WATTS = 3.828e26;
const AU_KM = 149_597_870.7;
const DAY_SECONDS = 86_400;
const SOLAR_ABSOLUTE_BOLOMETRIC_MAGNITUDE = 4.74;

/**
 * 29.1A — deterministic supernova physics envelope.
 *
 * The engine is deliberately clock-free and PRNG-free. A generated star is
 * already deterministic from its universe seed; once that canonical stellar
 * Ground Truth is translated into SupernovaProgenitorProfile, the same input
 * always produces the same event profile and relative-time light curve.
 *
 * It does not yet schedule an event inside a saved universe. That responsibility
 * belongs to the temporal framework introduced later in phase 29.
 */
export class SupernovaEventEngine {
  private constructor() {}

  static deriveProfile(
    progenitor: SupernovaProgenitorProfile,
  ): SupernovaEventProfile {
    const type = classify(progenitor);

    if (type === SupernovaType.TYPE_IA) {
      const wdMass = progenitor.whiteDwarfMassSolar!;
      const nickel56MassSolar = clamp(
        0.48 + (wdMass - 1.0) * 0.52,
        0.35,
        0.82,
      );
      const explosionEnergyJoules =
        (1.12 + (wdMass - 1.0) * 0.35) * 1e44;
      const ejectaMassSolar = progenitor.preExplosionMassSolar;

      return makeProfile({
        type,
        progenitor,
        ejectaMassSolar,
        nickel56MassSolar,
        explosionEnergyJoules,
        peakLuminosityWatts: nickel56MassSolar * 2.10e36,
        peakTemperatureKelvin: 11_200,
        riseTimeDays: 17.5,
        plateauDurationDays: null,
        earlyRemnantTransitionDays: 360,
        transientCompletionDays: 1_200,
        compactRemnantKind: SupernovaCompactRemnantKind.NONE,
        compactRemnantMassSolar: null,
      });
    }

    const remnantKind =
      progenitor.compactRemnantHint ===
      SupernovaProgenitorCompactRemnantHint.NEUTRON_STAR
        ? SupernovaCompactRemnantKind.NEUTRON_STAR
        : progenitor.compactRemnantHint ===
            SupernovaProgenitorCompactRemnantHint.STELLAR_BLACK_HOLE
          ? SupernovaCompactRemnantKind.STELLAR_BLACK_HOLE
          : progenitor.initialMassSolar >= 25
            ? SupernovaCompactRemnantKind.STELLAR_BLACK_HOLE
            : SupernovaCompactRemnantKind.NEUTRON_STAR;

    const compactRemnantMassSolar =
      remnantKind === SupernovaCompactRemnantKind.NEUTRON_STAR
        ? clamp(
            1.30 + (progenitor.initialMassSolar - 8) * 0.025,
            1.25,
            2.15,
          )
        : clamp(
            4.5 + (progenitor.preExplosionMassSolar - 8) * 0.42,
            4.5,
            Math.max(4.5, progenitor.preExplosionMassSolar * 0.82),
          );

    const ejectaMassSolar = Math.max(
      0.5,
      progenitor.preExplosionMassSolar - compactRemnantMassSolar,
    );

    if (type === SupernovaType.TYPE_II) {
      const energyScale = clamp(
        0.82 + (progenitor.initialMassSolar - 8) * 0.025,
        0.72,
        1.65,
      );
      const nickel56MassSolar = clamp(
        0.035 + (progenitor.initialMassSolar - 8) * 0.0035,
        0.025,
        0.14,
      );

      return makeProfile({
        type,
        progenitor,
        ejectaMassSolar,
        nickel56MassSolar,
        explosionEnergyJoules: energyScale * 1e44,
        peakLuminosityWatts: Math.max(
          1.35e35,
          nickel56MassSolar * 1.65e36,
        ),
        peakTemperatureKelvin: 10_000,
        riseTimeDays: 7.5,
        plateauDurationDays: clamp(
          72 + ejectaMassSolar * 2.6,
          75,
          115,
        ),
        earlyRemnantTransitionDays: 420,
        transientCompletionDays: 1_350,
        compactRemnantKind: remnantKind,
        compactRemnantMassSolar,
      });
    }

    if (type === SupernovaType.TYPE_IB) {
      const nickel56MassSolar = clamp(
        0.09 + progenitor.preExplosionMassSolar * 0.009,
        0.08,
        0.24,
      );

      return makeProfile({
        type,
        progenitor,
        ejectaMassSolar,
        nickel56MassSolar,
        explosionEnergyJoules: clamp(
          0.95 + progenitor.preExplosionMassSolar * 0.035,
          1.0,
          1.55,
        ) * 1e44,
        peakLuminosityWatts: nickel56MassSolar * 1.95e36,
        peakTemperatureKelvin: 10_500,
        riseTimeDays: 17,
        plateauDurationDays: null,
        earlyRemnantTransitionDays: 330,
        transientCompletionDays: 1_150,
        compactRemnantKind: remnantKind,
        compactRemnantMassSolar,
      });
    }

    const nickel56MassSolar = clamp(
      0.12 + progenitor.preExplosionMassSolar * 0.012,
      0.11,
      0.34,
    );

    return makeProfile({
      type,
      progenitor,
      ejectaMassSolar,
      nickel56MassSolar,
      explosionEnergyJoules: clamp(
        1.05 + progenitor.preExplosionMassSolar * 0.05,
        1.1,
        1.8,
      ) * 1e44,
      peakLuminosityWatts: nickel56MassSolar * 2.05e36,
      peakTemperatureKelvin: 11_500,
      riseTimeDays: 14.5,
      plateauDurationDays: null,
      earlyRemnantTransitionDays: 300,
      transientCompletionDays: 1_050,
      compactRemnantKind: remnantKind,
      compactRemnantMassSolar,
    });
  }

  static sample(
    profile: SupernovaEventProfile,
    elapsedDays: number,
  ): SupernovaObservationSnapshot {
    if (!Number.isFinite(elapsedDays) || elapsedDays < -60 || elapsedDays > 5_000) {
      throw new RangeError('elapsedDays must be finite and in [-60, 5000].');
    }

    const phase = phaseAt(profile, elapsedDays);
    const normalizedBrightness = brightnessAt(profile, elapsedDays);
    const bolometricLuminosityWatts = Math.max(
      profile.peakBolometricLuminosityWatts * normalizedBrightness,
      profile.peakBolometricLuminosityWatts * 1e-8,
    );
    const photosphericTemperatureKelvin =
      elapsedDays < 0
        ? 4_500
        : Math.max(
            2_400,
            profile.peakPhotosphericTemperatureKelvin *
              Math.pow(Math.max(normalizedBrightness, 1e-5), 0.16),
          );
    const ejectaRadiusAu =
      elapsedDays <= 0
        ? 0
        : profile.characteristicEjectaVelocityKmS *
          elapsedDays *
          DAY_SECONDS /
          AU_KM;

    return {
      elapsedDays,
      phase,
      bolometricLuminosityWatts,
      absoluteBolometricMagnitude:
        absoluteBolometricMagnitude(bolometricLuminosityWatts),
      photosphericTemperatureKelvin,
      ejectaRadiusAu,
      normalizedBrightness,
    };
  }
}

function classify(
  progenitor: SupernovaProgenitorProfile,
): SupernovaType {
  if (
    progenitor.channel ===
    SupernovaProgenitorChannel.THERMONUCLEAR_WHITE_DWARF
  ) {
    return SupernovaType.TYPE_IA;
  }

  if (progenitor.hydrogenEnvelopeFraction >= 0.10) {
    return SupernovaType.TYPE_II;
  }

  if (progenitor.heliumEnvelopeFraction >= 0.10) {
    return SupernovaType.TYPE_IB;
  }

  return SupernovaType.TYPE_IC;
}

function makeProfile(input: {
  readonly type: SupernovaType;
  readonly progenitor: SupernovaProgenitorProfile;
  readonly ejectaMassSolar: number;
  readonly nickel56MassSolar: number;
  readonly explosionEnergyJoules: number;
  readonly peakLuminosityWatts: number;
  readonly peakTemperatureKelvin: number;
  readonly riseTimeDays: number;
  readonly plateauDurationDays: number | null;
  readonly earlyRemnantTransitionDays: number;
  readonly transientCompletionDays: number;
  readonly compactRemnantKind: SupernovaCompactRemnantKind;
  readonly compactRemnantMassSolar: number | null;
}): SupernovaEventProfile {
  const characteristicEjectaVelocityKmS = Math.sqrt(
    2 * input.explosionEnergyJoules /
    (input.ejectaMassSolar * SOLAR_MASS_KG),
  ) / 1_000;

  return new SupernovaEventProfile(
    input.type,
    input.progenitor,
    roundScientific(input.ejectaMassSolar),
    roundScientific(input.nickel56MassSolar),
    roundScientific(input.explosionEnergyJoules),
    roundScientific(characteristicEjectaVelocityKmS),
    roundScientific(input.peakLuminosityWatts),
    roundScientific(absoluteBolometricMagnitude(input.peakLuminosityWatts)),
    input.peakTemperatureKelvin,
    input.riseTimeDays,
    input.plateauDurationDays,
    input.earlyRemnantTransitionDays,
    input.transientCompletionDays,
    input.compactRemnantKind,
    input.compactRemnantMassSolar === null
      ? null
      : roundScientific(input.compactRemnantMassSolar),
  );
}

function phaseAt(
  profile: SupernovaEventProfile,
  elapsedDays: number,
): SupernovaPhase {
  if (elapsedDays < 0) {
    return SupernovaPhase.PRECURSOR;
  }

  if (elapsedDays < 0.35) {
    return SupernovaPhase.EXPLOSION;
  }

  if (elapsedDays < profile.riseTimeDays - 1) {
    return SupernovaPhase.RISE;
  }

  if (elapsedDays <= profile.riseTimeDays + 2) {
    return SupernovaPhase.PEAK;
  }

  if (
    profile.plateauDurationDays !== null &&
    elapsedDays <= profile.riseTimeDays + profile.plateauDurationDays
  ) {
    return SupernovaPhase.PLATEAU;
  }

  if (elapsedDays < profile.earlyRemnantTransitionDays) {
    return SupernovaPhase.DECLINE;
  }

  if (elapsedDays < profile.transientCompletionDays) {
    return SupernovaPhase.EARLY_REMNANT;
  }

  return SupernovaPhase.COMPLETE;
}

function brightnessAt(
  profile: SupernovaEventProfile,
  elapsedDays: number,
): number {
  if (elapsedDays < 0) {
    return 1e-6;
  }

  if (elapsedDays < 0.35) {
    return 0.015 + (elapsedDays / 0.35) * 0.035;
  }

  if (elapsedDays < profile.riseTimeDays) {
    const progress = elapsedDays / profile.riseTimeDays;
    return clamp(0.05 + 0.95 * progress * progress, 0.05, 1);
  }

  if (
    profile.plateauDurationDays !== null &&
    elapsedDays <= profile.riseTimeDays + profile.plateauDurationDays
  ) {
    const plateauProgress =
      (elapsedDays - profile.riseTimeDays) /
      profile.plateauDurationDays;
    return 1 - 0.42 * plateauProgress;
  }

  const declineStart =
    profile.plateauDurationDays === null
      ? profile.riseTimeDays
      : profile.riseTimeDays + profile.plateauDurationDays;
  const declineElapsed = Math.max(0, elapsedDays - declineStart);
  const tauDays =
    profile.type === SupernovaType.TYPE_IA
      ? 58
      : profile.type === SupernovaType.TYPE_II
        ? 82
        : profile.type === SupernovaType.TYPE_IB
          ? 52
          : 46;
  const startFactor =
    profile.plateauDurationDays === null
      ? 1
      : 0.58;

  return Math.max(
    1e-8,
    startFactor * Math.exp(-declineElapsed / tauDays),
  );
}

function absoluteBolometricMagnitude(
  luminosityWatts: number,
): number {
  return SOLAR_ABSOLUTE_BOLOMETRIC_MAGNITUDE -
    2.5 * Math.log10(luminosityWatts / SOLAR_LUMINOSITY_WATTS);
}

function roundScientific(value: number): number {
  return Number(value.toPrecision(12));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
