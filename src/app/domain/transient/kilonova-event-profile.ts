import { type KilonovaProgenitorProfile } from './kilonova-progenitor';
import { type KilonovaType } from './kilonova-type';

export const KilonovaRemnantKind = Object.freeze({
  MASSIVE_NEUTRON_STAR: 'MASSIVE_NEUTRON_STAR',
  HYPERMASSIVE_NEUTRON_STAR: 'HYPERMASSIVE_NEUTRON_STAR',
  STELLAR_BLACK_HOLE: 'STELLAR_BLACK_HOLE',
} as const);
export type KilonovaRemnantKind = typeof KilonovaRemnantKind[keyof typeof KilonovaRemnantKind];

export class KilonovaEventProfile {
  constructor(
    readonly type: KilonovaType,
    readonly progenitor: KilonovaProgenitorProfile,
    readonly totalEjectaMassSolar: number,
    readonly blueEjectaMassSolar: number,
    readonly redEjectaMassSolar: number,
    readonly rProcessMassSolar: number,
    readonly characteristicBlueVelocityFractionC: number,
    readonly characteristicRedVelocityFractionC: number,
    readonly kineticEnergyJoules: number,
    readonly bluePeakTimeDays: number,
    readonly redPeakTimeDays: number,
    readonly bluePeakLuminosityWatts: number,
    readonly redPeakLuminosityWatts: number,
    readonly remnantKind: KilonovaRemnantKind,
    readonly remnantMassSolar: number,
  ) {
    for (const [name, value] of Object.entries({
      totalEjectaMassSolar, blueEjectaMassSolar, redEjectaMassSolar, rProcessMassSolar,
      characteristicBlueVelocityFractionC, characteristicRedVelocityFractionC,
      kineticEnergyJoules, bluePeakTimeDays, redPeakTimeDays,
      bluePeakLuminosityWatts, redPeakLuminosityWatts, remnantMassSolar,
    })) {
      if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be finite and > 0.`);
    }
    const sum = blueEjectaMassSolar + redEjectaMassSolar;
    if (Math.abs(sum - totalEjectaMassSolar) > Math.max(1e-12, totalEjectaMassSolar * 1e-8)) {
      throw new RangeError('Kilonova blue+red ejecta must equal total ejecta.');
    }
    if (rProcessMassSolar > totalEjectaMassSolar) {
      throw new RangeError('r-process mass cannot exceed total ejecta.');
    }
    if (characteristicBlueVelocityFractionC >= 1 || characteristicRedVelocityFractionC >= 1) {
      throw new RangeError('Kilonova ejecta velocities must remain subluminal.');
    }
    const progenitorMassSolar = progenitor.primaryMassSolar + progenitor.secondaryMassSolar;
    if (totalEjectaMassSolar >= progenitorMassSolar || remnantMassSolar >= progenitorMassSolar ||
        remnantMassSolar + totalEjectaMassSolar >= progenitorMassSolar) {
      throw new RangeError('Kilonova mass budget must leave positive mass-energy outside ejecta/remnant bookkeeping.');
    }
    if (bluePeakTimeDays >= redPeakTimeDays) {
      throw new RangeError('Blue kilonova component must peak before the red component.');
    }
  }
}
