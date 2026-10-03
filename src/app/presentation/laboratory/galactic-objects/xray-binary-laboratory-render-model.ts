import { ExtremeType } from '../../../domain/galactic-object/extreme-object-type';

export type XrayBinaryLaboratoryKind =
  | typeof ExtremeType.X_RAY_BINARY_NS
  | typeof ExtremeType.X_RAY_BINARY_BH
  | typeof ExtremeType.MICROQUASAR
  | typeof ExtremeType.ULX;

export interface XrayBinaryLaboratoryRenderModel {
  readonly type: XrayBinaryLaboratoryKind;
  readonly label: string;
  readonly sampleLabel: string;
  readonly donorLabel: string;
  readonly compactObjectLabel: string;
  readonly compactMassLabel: string;
  readonly donorMassSolar: number;
  readonly donorRadiusSolar: number;
  readonly compactMassSolar: number;
  readonly orbitalPeriodHours: number;
  readonly separationSolarRadii: number;
  readonly transferRateSolarMassPerYear: number;
  readonly xrayLuminosityErgS: number;
  readonly diskTemperatureK: number;
  readonly visualOrbitSeconds: number;
  readonly diskTiltDegrees: number;
  readonly diskRadiusRem: number;
  readonly donorScale: number;
  readonly donorOffsetXRem: number;
  readonly compactOffsetXRem: number;
  readonly streamHeightRem: number;
  readonly streamWidthRem: number;
  readonly coronaScale: number;
  readonly xrayOpacity: number;
  readonly donorColor: string;
  readonly donorHaloColor: string;
  readonly donorRimColor: string;
  readonly compactSurfaceColor: string;
  readonly compactGlowColor: string;
  readonly diskInnerColor: string;
  readonly diskOuterColor: string;
  readonly streamColor: string;
  readonly xrayColor: string;
  readonly jetPowerErgS: number | null;
  readonly jetOpeningDegrees: number | null;
  readonly superEddingtonFactor: number | null;
  readonly windVelocityFractionC: number | null;
  readonly caveat: string;
}

export const XRAY_BINARY_LABORATORY_TYPES: readonly XrayBinaryLaboratoryKind[] = Object.freeze([
  ExtremeType.X_RAY_BINARY_NS,
  ExtremeType.X_RAY_BINARY_BH,
  ExtremeType.MICROQUASAR,
  ExtremeType.ULX,
]);

const LABELS: Readonly<Record<XrayBinaryLaboratoryKind, string>> = Object.freeze({
  [ExtremeType.X_RAY_BINARY_NS]: 'Binaria X con estrella de neutrones',
  [ExtremeType.X_RAY_BINARY_BH]: 'Binaria X con agujero negro',
  [ExtremeType.MICROQUASAR]: 'Microquásar',
  [ExtremeType.ULX]: 'Fuente ultraluminosa de rayos X (ULX)',
});

export function xrayBinaryLaboratorySamples(
  type: XrayBinaryLaboratoryKind,
): readonly XrayBinaryLaboratoryRenderModel[] {
  assertKind(type);
  return Object.freeze(Array.from({ length: 8 }, (_, index) => createModel(type, index)));
}

export function xrayBinaryLaboratoryModel(
  type: XrayBinaryLaboratoryKind,
  sampleIndex: number,
): XrayBinaryLaboratoryRenderModel {
  assertKind(type);
  if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= 8) {
    throw new RangeError(`Unsupported X-ray binary laboratory sample index: ${sampleIndex}.`);
  }
  return createModel(type, sampleIndex);
}

function createModel(
  type: XrayBinaryLaboratoryKind,
  index: number,
): XrayBinaryLaboratoryRenderModel {
  const t = index / 7;
  const wave = (Math.sin((index + 1) * 1.913) + 1) / 2;
  const kindBlend = 0.54 * t + 0.46 * wave;

  const donorLabelsNs = [
    'Subgigante azul',
    'Estrella B emisora',
    'Donante tipo F',
    'Subgigante amarilla',
    'Gigante tenue',
    'Donante A caliente',
    'Estrella masiva joven',
    'Donante evolucionada',
  ] as const;

  const donorLabelsBh = [
    'Subgigante azul',
    'Estrella Be caliente',
    'Gigante amarilla',
    'Subgigante F',
    'Gigante roja tenue',
    'Donante A luminosa',
    'Estrella masiva joven',
    'Supergigante azul',
  ] as const;

  const donorColor = [
    '#9ed9ff', '#7dc6ff', '#f4f3ff', '#ffe8b3', '#ffd79a', '#b8e3ff', '#cfe8ff', '#fff2cf',
  ][index];
  const donorHaloColor = [
    'rgba(90, 180, 255, 0.30)', 'rgba(72, 164, 255, 0.28)', 'rgba(215, 226, 255, 0.28)', 'rgba(255, 215, 118, 0.24)',
    'rgba(255, 195, 112, 0.24)', 'rgba(120, 210, 255, 0.28)', 'rgba(162, 208, 255, 0.28)', 'rgba(255, 232, 164, 0.24)',
  ][index];
  const donorRimColor = [
    '#e8f7ff', '#e0f4ff', '#ffffff', '#fff9dd', '#fff0d0', '#ecfbff', '#f0f8ff', '#fffbe6',
  ][index];

  const isMicroquasar = type === ExtremeType.MICROQUASAR;
  const isUlx = type === ExtremeType.ULX;
  const isBlackHoleBinary = type === ExtremeType.X_RAY_BINARY_BH || isMicroquasar || isUlx;

  return Object.freeze({
    type,
    label: LABELS[type],
    sampleLabel: String.fromCharCode(65 + index),
    donorLabel: (isBlackHoleBinary ? donorLabelsBh : donorLabelsNs)[index],
    compactObjectLabel: isUlx ? 'objeto compacto ULX' : (isBlackHoleBinary ? 'agujero negro estelar' : 'estrella de neutrones'),
    compactMassLabel: isUlx ? 'Masa compacto' : (isBlackHoleBinary ? 'Masa BH' : 'Masa NS'),
    donorMassSolar: round((isUlx ? 3.1 : isMicroquasar ? 2.10 : isBlackHoleBinary ? 1.65 : 0.95) + (isUlx ? 16.8 : isMicroquasar ? 13.8 : isBlackHoleBinary ? 12.4 : 5.1) * kindBlend, 2),
    donorRadiusSolar: round((isUlx ? 2.8 : isMicroquasar ? 2.0 : isBlackHoleBinary ? 1.8 : 1.2) + (isUlx ? 15.2 : isMicroquasar ? 13.0 : isBlackHoleBinary ? 12.2 : 4.8) * (0.42 * t + 0.58 * wave), 2),
    compactMassSolar: round((isUlx ? 4.8 : isMicroquasar ? 5.2 : isBlackHoleBinary ? 4.6 : 1.24) + (isUlx ? 18.5 : isMicroquasar ? 14.8 : isBlackHoleBinary ? 13.8 : 0.62) * (0.63 * t + 0.37 * wave), 2),
    orbitalPeriodHours: round((isBlackHoleBinary ? 5.6 : 3.1) + (isBlackHoleBinary ? 92 : 48) * (0.48 * t + 0.52 * wave), 1),
    separationSolarRadii: round((isBlackHoleBinary ? 4.8 : 2.4) + (isBlackHoleBinary ? 24.5 : 14.8) * (0.45 * t + 0.55 * wave), 2),
    transferRateSolarMassPerYear: roundScientific(10 ** ((isUlx ? -8.85 : isMicroquasar ? -9.55 : isBlackHoleBinary ? -9.95 : -10.6) + (isUlx ? 2.25 : isMicroquasar ? 2.05 : isBlackHoleBinary ? 1.9 : 1.6) * kindBlend)),
    xrayLuminosityErgS: roundScientific(10 ** ((isUlx ? 39.05 : isMicroquasar ? 37.2 : isBlackHoleBinary ? 36.9 : 36.2) + (isUlx ? 1.35 : isMicroquasar ? 2.2 : isBlackHoleBinary ? 2.4 : 2.1) * (0.35 * t + 0.65 * wave))),
    diskTemperatureK: roundScientific(10 ** ((isBlackHoleBinary ? 6.15 : 6.25) + (isBlackHoleBinary ? 0.52 : 0.45) * (0.44 * t + 0.56 * wave))),
    visualOrbitSeconds: round((isBlackHoleBinary ? 19.5 : 18) - (isBlackHoleBinary ? 7.2 : 6.5) * (0.4 * t + 0.6 * wave), 2),
    diskTiltDegrees: round(-17 + 33 * wave, 1),
    diskRadiusRem: round((isBlackHoleBinary ? 4.15 : 3.9) + (isBlackHoleBinary ? 1.40 : 1.25) * (0.4 * t + 0.6 * wave), 2),
    donorScale: round((isUlx ? 1.34 : isMicroquasar ? 1.20 : isBlackHoleBinary ? 1.28 : 1.22) + (isUlx ? 0.78 : isMicroquasar ? 0.72 : isBlackHoleBinary ? 0.58 : 0.44) * (0.32 * t + 0.68 * wave), 2),
    donorOffsetXRem: round(-8.6 + 0.85 * wave, 2),
    compactOffsetXRem: round(3.7 + 0.55 * t, 2),
    streamHeightRem: round((isBlackHoleBinary ? 4.5 : 4.1) + (isBlackHoleBinary ? 0.95 : 0.75) * wave, 2),
    streamWidthRem: round((isBlackHoleBinary ? 0.62 : 0.55) + (isBlackHoleBinary ? 0.20 : 0.18) * t, 2),
    coronaScale: round((isBlackHoleBinary ? 1.78 : 1.65) + (isBlackHoleBinary ? 0.34 : 0.26) * wave, 2),
    xrayOpacity: round((isBlackHoleBinary ? 0.30 : 0.26) + (isBlackHoleBinary ? 0.19 : 0.18) * wave, 2),
    donorColor,
    donorHaloColor,
    donorRimColor,
    compactSurfaceColor: isBlackHoleBinary
      ? ['#16161a', '#121219', '#101016', '#171515', '#191414', '#13161a', '#121a1a', '#171712'][index]
      : ['#e7fbff', '#e7fbff', '#f6feff', '#f7feff', '#dcf5ff', '#edfaff', '#ecffff', '#fffdf4'][index],
    compactGlowColor: isBlackHoleBinary
      ? ['#e9f8ff', '#d7f1ff', '#f6f0ff', '#fff1d8', '#ffe8cf', '#ebfbff', '#efffff', '#fff6e1'][index]
      : ['#59d4ff', '#49c3ff', '#73ddff', '#89e4ff', '#53c0ff', '#6ed6ff', '#5debf3', '#bfeeff'][index],
    diskInnerColor: ['#eef7ff', '#f4fbff', '#fdf8ff', '#fff4dc', '#fff0d2', '#f4fdff', '#fbffff', '#fff8e6'][index],
    diskOuterColor: ['rgba(67, 174, 255, 0.72)', 'rgba(86, 181, 255, 0.74)', 'rgba(177, 208, 255, 0.72)', 'rgba(255, 198, 124, 0.72)', 'rgba(255, 182, 108, 0.74)', 'rgba(90, 196, 255, 0.72)', 'rgba(119, 219, 255, 0.76)', 'rgba(255, 217, 140, 0.72)'][index],
    streamColor: ['rgba(142, 224, 255, 0.68)', 'rgba(129, 216, 255, 0.68)', 'rgba(220, 234, 255, 0.66)', 'rgba(255, 218, 152, 0.64)', 'rgba(255, 206, 144, 0.64)', 'rgba(154, 230, 255, 0.66)', 'rgba(192, 245, 255, 0.70)', 'rgba(255, 231, 170, 0.64)'][index],
    xrayColor: ['rgba(88, 217, 255, 0.90)', 'rgba(88, 205, 255, 0.90)', 'rgba(162, 226, 255, 0.90)', 'rgba(182, 233, 255, 0.84)', 'rgba(143, 218, 255, 0.84)', 'rgba(104, 221, 255, 0.90)', 'rgba(132, 242, 255, 0.92)', 'rgba(195, 240, 255, 0.84)'][index],
    jetPowerErgS: isMicroquasar ? roundScientific(10 ** (36.2 + 2.1 * (0.40 * t + 0.60 * wave))) : null,
    jetOpeningDegrees: isMicroquasar ? round(2.4 + 5.2 * (0.35 * t + 0.65 * wave), 1) : null,
    superEddingtonFactor: isUlx ? round(2.4 + 16.8 * (0.35 * t + 0.65 * wave), 1) : null,
    windVelocityFractionC: isUlx ? round(0.08 + 0.22 * (0.42 * t + 0.58 * wave), 2) : null,
    caveat: isUlx
      ? 'Modelo ilustrativo de ULX: un sistema de acreción supercrítica con una fuente compacta, disco grueso hiperluminoso y vientos radiativos de gran apertura. Una ULX real puede albergar una estrella de neutrones o un agujero negro; aquí el objeto compacto se normaliza para fijar la morfología de laboratorio.'
      : isMicroquasar
        ? 'Modelo ilustrativo de microquásar: una binaria X con objeto compacto, disco de acreción y jets relativistas bipolares. La longitud y apertura aparente de los jets se comprimen para lectura de laboratorio y no representan una escala espacial real.'
        : isBlackHoleBinary
          ? 'Modelo ilustrativo de binaria X con agujero negro estelar y acreción por desbordamiento del lóbulo de Roche. La geometría del flujo, el tamaño aparente del agujero negro, el grosor del disco y el brillo X se amplifican para inspección visual.'
          : 'Modelo ilustrativo de binaria X con acreción por desbordamiento del lóbulo de Roche. La geometría, el grosor del disco y el brillo X están ralentizados y amplificados para inspección visual.',
  });
}

function assertKind(type: XrayBinaryLaboratoryKind): void {
  if (!XRAY_BINARY_LABORATORY_TYPES.includes(type)) {
    throw new RangeError(`Unsupported X-ray binary laboratory type: ${type}.`);
  }
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function roundScientific(value: number): number {
  return Number(value.toPrecision(3));
}
