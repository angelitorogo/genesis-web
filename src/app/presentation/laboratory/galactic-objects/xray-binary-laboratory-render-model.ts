import { ExtremeType } from '../../../domain/galactic-object/extreme-object-type';

export type XrayBinaryLaboratoryKind =
  | typeof ExtremeType.X_RAY_BINARY_NS;

export interface XrayBinaryLaboratoryRenderModel {
  readonly type: XrayBinaryLaboratoryKind;
  readonly label: string;
  readonly sampleLabel: string;
  readonly donorLabel: string;
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
  readonly caveat: string;
}

export const XRAY_BINARY_LABORATORY_TYPES: readonly XrayBinaryLaboratoryKind[] = Object.freeze([
  ExtremeType.X_RAY_BINARY_NS,
]);

const LABELS: Readonly<Record<XrayBinaryLaboratoryKind, string>> = Object.freeze({
  [ExtremeType.X_RAY_BINARY_NS]: 'Binaria X con estrella de neutrones',
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

  const donorLabels = [
    'Subgigante azul',
    'Estrella B emisora',
    'Donante tipo F',
    'Subgigante amarilla',
    'Gigante tenue',
    'Donante A caliente',
    'Estrella masiva joven',
    'Donante evolucionada',
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

  return Object.freeze({
    type,
    label: LABELS[type],
    sampleLabel: String.fromCharCode(65 + index),
    donorLabel: donorLabels[index],
    donorMassSolar: round(0.95 + 5.1 * (0.55 * t + 0.45 * wave), 2),
    donorRadiusSolar: round(1.2 + 4.8 * (0.42 * t + 0.58 * wave), 2),
    compactMassSolar: round(1.24 + 0.62 * (0.63 * t + 0.37 * wave), 2),
    orbitalPeriodHours: round(3.1 + 48 * (0.48 * t + 0.52 * wave), 1),
    separationSolarRadii: round(2.4 + 14.8 * (0.45 * t + 0.55 * wave), 2),
    transferRateSolarMassPerYear: roundScientific(10 ** (-10.6 + 1.6 * (0.54 * t + 0.46 * wave))),
    xrayLuminosityErgS: roundScientific(10 ** (36.2 + 2.1 * (0.35 * t + 0.65 * wave))),
    diskTemperatureK: roundScientific(10 ** (6.25 + 0.45 * (0.44 * t + 0.56 * wave))),
    visualOrbitSeconds: round(18 - 6.5 * (0.4 * t + 0.6 * wave), 2),
    diskTiltDegrees: round(-17 + 33 * wave, 1),
    diskRadiusRem: round(3.9 + 1.25 * (0.4 * t + 0.6 * wave), 2),
    donorScale: round(1.22 + 0.44 * (0.32 * t + 0.68 * wave), 2),
    donorOffsetXRem: round(-8.6 + 0.85 * wave, 2),
    compactOffsetXRem: round(3.7 + 0.55 * t, 2),
    streamHeightRem: round(4.1 + 0.75 * wave, 2),
    streamWidthRem: round(0.55 + 0.18 * t, 2),
    coronaScale: round(1.65 + 0.26 * wave, 2),
    xrayOpacity: round(0.26 + 0.18 * wave, 2),
    donorColor,
    donorHaloColor,
    donorRimColor,
    compactSurfaceColor: ['#e7fbff', '#e7fbff', '#f6feff', '#f7feff', '#dcf5ff', '#edfaff', '#ecffff', '#fffdf4'][index],
    compactGlowColor: ['#59d4ff', '#49c3ff', '#73ddff', '#89e4ff', '#53c0ff', '#6ed6ff', '#5debf3', '#bfeeff'][index],
    diskInnerColor: ['#eef7ff', '#f4fbff', '#fdf8ff', '#fff4dc', '#fff0d2', '#f4fdff', '#fbffff', '#fff8e6'][index],
    diskOuterColor: ['rgba(67, 174, 255, 0.72)', 'rgba(86, 181, 255, 0.74)', 'rgba(177, 208, 255, 0.72)', 'rgba(255, 198, 124, 0.72)', 'rgba(255, 182, 108, 0.74)', 'rgba(90, 196, 255, 0.72)', 'rgba(119, 219, 255, 0.76)', 'rgba(255, 217, 140, 0.72)'][index],
    streamColor: ['rgba(142, 224, 255, 0.68)', 'rgba(129, 216, 255, 0.68)', 'rgba(220, 234, 255, 0.66)', 'rgba(255, 218, 152, 0.64)', 'rgba(255, 206, 144, 0.64)', 'rgba(154, 230, 255, 0.66)', 'rgba(192, 245, 255, 0.70)', 'rgba(255, 231, 170, 0.64)'][index],
    xrayColor: ['rgba(88, 217, 255, 0.90)', 'rgba(88, 205, 255, 0.90)', 'rgba(162, 226, 255, 0.90)', 'rgba(182, 233, 255, 0.84)', 'rgba(143, 218, 255, 0.84)', 'rgba(104, 221, 255, 0.90)', 'rgba(132, 242, 255, 0.92)', 'rgba(195, 240, 255, 0.84)'][index],
    caveat: 'Modelo ilustrativo de binaria X con acreción por desbordamiento del lóbulo de Roche. La geometría, el grosor del disco y el brillo X están ralentizados y amplificados para inspección visual.',
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
