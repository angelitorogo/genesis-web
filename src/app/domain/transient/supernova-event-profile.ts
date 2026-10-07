import { type SupernovaType } from './supernova-type';
import { type SupernovaProgenitorProfile } from './supernova-progenitor';

export const SupernovaCompactRemnantKind = Object.freeze({
  NONE: 'NONE',
  NEUTRON_STAR: 'NEUTRON_STAR',
  STELLAR_BLACK_HOLE: 'STELLAR_BLACK_HOLE',
} as const);

export type SupernovaCompactRemnantKind =
  typeof SupernovaCompactRemnantKind[
    keyof typeof SupernovaCompactRemnantKind
  ];

export class SupernovaEventProfile {
  constructor(
    readonly type: SupernovaType,
    readonly progenitor: SupernovaProgenitorProfile,
    readonly ejectaMassSolar: number,
    readonly nickel56MassSolar: number,
    readonly explosionEnergyJoules: number,
    readonly characteristicEjectaVelocityKmS: number,
    readonly peakBolometricLuminosityWatts: number,
    readonly peakAbsoluteBolometricMagnitude: number,
    readonly peakPhotosphericTemperatureKelvin: number,
    readonly riseTimeDays: number,
    readonly plateauDurationDays: number | null,
    readonly earlyRemnantTransitionDays: number,
    readonly transientCompletionDays: number,
    readonly compactRemnantKind: SupernovaCompactRemnantKind,
    readonly compactRemnantMassSolar: number | null,
  ) {}
}
