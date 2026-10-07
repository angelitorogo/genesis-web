import {
  SupernovaCompactRemnantKind,
  type SupernovaEventProfile,
} from '../../../../domain/transient/supernova-event-profile';
import {
  SupernovaType,
} from '../../../../domain/transient/supernova-type';

export interface YoungSupernovaRenderModel {
  readonly typeIndex: number;
  readonly age01: number;
  readonly photosphere01: number;
  readonly remnantReveal01: number;
  readonly radius: number;
  readonly aspect: number;
  readonly shellThickness: number;
  readonly breakup: number;
  readonly filamentStrength: number;
  readonly clumpiness: number;
  readonly asymmetry: number;
  readonly interiorStrength: number;
  readonly reverseShockStrength: number;
  readonly directionalStrength: number;
  readonly compactSourceStrength: number;
  readonly compactKind: number;
  readonly seedX: number;
  readonly seedY: number;
  readonly hotColor: string;
  readonly coolColor: string;
  readonly interiorColor: string;
  readonly haloColor: string;
  readonly backgroundColor: string;
}

export class YoungSupernovaRenderModelBuilder {
  private constructor() {}

  static build(
    profile: SupernovaEventProfile,
    elapsedDays: number,
  ): YoungSupernovaRenderModel {
    const day = Math.max(0, elapsedDays);
    const age01 = clamp01(day / Math.max(profile.transientCompletionDays, 1));
    const remnantReveal01 = clamp01(
      (day - Math.max(8, profile.riseTimeDays * 0.7)) /
      Math.max(60, profile.earlyRemnantTransitionDays + 120),
    );
    const peakWidth = profile.type === SupernovaType.TYPE_II ? 82 : 54;
    const peakDistance = (elapsedDays - profile.riseTimeDays) / peakWidth;
    const photosphere01 = clamp01(Math.exp(-(peakDistance * peakDistance)));

    const type = typeProfile(profile.type);
    const expansion = clamp01(Math.log10(day + 1) / Math.log10(1201));
    const speedFactor = clamp(profile.characteristicEjectaVelocityKmS / 6500, 0.84, 1.12);
    const radius = (0.075 + expansion * 0.315) * speedFactor;
    const compactKind =
      profile.compactRemnantKind === SupernovaCompactRemnantKind.NEUTRON_STAR
        ? 1
        : profile.compactRemnantKind === SupernovaCompactRemnantKind.STELLAR_BLACK_HOLE
          ? 2
          : 0;

    return Object.freeze({
      typeIndex: type.typeIndex,
      age01,
      photosphere01,
      remnantReveal01,
      radius,
      aspect: type.aspect,
      shellThickness: type.shellThickness * mix(1.18, 0.82, remnantReveal01),
      breakup: type.breakup * mix(0.45, 1, remnantReveal01),
      filamentStrength: type.filamentStrength * mix(0.28, 1, remnantReveal01),
      clumpiness: type.clumpiness * mix(0.35, 1, remnantReveal01),
      asymmetry: type.asymmetry * mix(0.42, 1, remnantReveal01),
      interiorStrength: type.interiorStrength * mix(0.42, 1, remnantReveal01),
      reverseShockStrength: type.reverseShockStrength * remnantReveal01,
      directionalStrength: type.directionalStrength * mix(0.35, 1, remnantReveal01),
      compactSourceStrength:
        compactKind === 1
          ? clamp01((remnantReveal01 - 0.34) / 0.66) * type.compactSourceStrength
          : 0,
      compactKind,
      seedX: type.seedX,
      seedY: type.seedY,
      hotColor: type.hotColor,
      coolColor: type.coolColor,
      interiorColor: type.interiorColor,
      haloColor: type.haloColor,
      backgroundColor: '#02040A',
    });
  }
}

interface TypeVisualProfile {
  readonly typeIndex: number;
  readonly aspect: number;
  readonly shellThickness: number;
  readonly breakup: number;
  readonly filamentStrength: number;
  readonly clumpiness: number;
  readonly asymmetry: number;
  readonly interiorStrength: number;
  readonly reverseShockStrength: number;
  readonly directionalStrength: number;
  readonly compactSourceStrength: number;
  readonly seedX: number;
  readonly seedY: number;
  readonly hotColor: string;
  readonly coolColor: string;
  readonly interiorColor: string;
  readonly haloColor: string;
}

function typeProfile(type: SupernovaEventProfile['type']): TypeVisualProfile {
  if (type === SupernovaType.TYPE_IA) {
    return Object.freeze({
      typeIndex: 0,
      aspect: 1.00,
      shellThickness: 0.042,
      breakup: 0.16,
      filamentStrength: 0.88,
      clumpiness: 0.42,
      asymmetry: 0.08,
      interiorStrength: 0.22,
      reverseShockStrength: 0.26,
      directionalStrength: 0.04,
      compactSourceStrength: 0,
      seedX: 0.173,
      seedY: 0.619,
      hotColor: '#FFD9B0',
      coolColor: '#E884D7',
      interiorColor: '#A48A82',
      haloColor: '#A76E91',
    });
  }

  if (type === SupernovaType.TYPE_II) {
    return Object.freeze({
      typeIndex: 1,
      aspect: 0.98,
      shellThickness: 0.058,
      breakup: 0.42,
      filamentStrength: 0.74,
      clumpiness: 0.82,
      asymmetry: 0.27,
      interiorStrength: 0.74,
      reverseShockStrength: 0.62,
      directionalStrength: 0.18,
      compactSourceStrength: 0.18,
      seedX: 0.411,
      seedY: 0.237,
      hotColor: '#F7AAC6',
      coolColor: '#70CDEA',
      interiorColor: '#6FA7C8',
      haloColor: '#647AC8',
    });
  }

  if (type === SupernovaType.TYPE_IB) {
    return Object.freeze({
      typeIndex: 2,
      aspect: 1.04,
      shellThickness: 0.048,
      breakup: 0.34,
      filamentStrength: 0.82,
      clumpiness: 0.62,
      asymmetry: 0.31,
      interiorStrength: 0.56,
      reverseShockStrength: 0.52,
      directionalStrength: 0.24,
      compactSourceStrength: 0.42,
      seedX: 0.731,
      seedY: 0.349,
      hotColor: '#F4CAD3',
      coolColor: '#9FCDEA',
      interiorColor: '#88A9C5',
      haloColor: '#807CB0',
    });
  }

  return Object.freeze({
    typeIndex: 3,
    aspect: 1.12,
    shellThickness: 0.040,
    breakup: 0.38,
    filamentStrength: 0.84,
    clumpiness: 0.46,
    asymmetry: 0.44,
    interiorStrength: 0.34,
    reverseShockStrength: 0.34,
    directionalStrength: 0.52,
    compactSourceStrength: 0,
    seedX: 0.587,
    seedY: 0.863,
    hotColor: '#F1F1B5',
    coolColor: '#80C9A0',
    interiorColor: '#76957B',
    haloColor: '#4E876B',
  });
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
