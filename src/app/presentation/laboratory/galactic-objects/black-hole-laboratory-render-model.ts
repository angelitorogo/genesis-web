import { ExtremeType } from '../../../domain/galactic-object/extreme-object-type';

export type BlackHoleLaboratoryKind =
  | typeof ExtremeType.STELLAR_MASS_BLACK_HOLE
  | typeof ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE
  | typeof ExtremeType.SMBH;

export interface BlackHoleLaboratoryRenderModel {
  readonly type: BlackHoleLaboratoryKind;
  readonly label: string;
  readonly sampleLabel: string;
  readonly massSolar: number;
  readonly schwarzschildRadiusKm: number;
  readonly spinDimensionless: number;
  readonly inclinationDegrees: number;
  readonly accretionRateEddington: number;
  readonly diskTemperatureK: number;
  readonly diskInnerRadiusRg: number;
  readonly diskOuterRadiusRg: number;
  readonly lensingStrength: number;
  readonly visualSpinSeconds: number;
  readonly diskColorInner: number;
  readonly diskColorMid: number;
  readonly diskColorOuter: number;
  readonly photonRingColor: number;
  readonly diskBrightness: number;
  readonly diskThickness: number;
  readonly turbulenceScale: number;
  readonly turbulenceStrength: number;
  readonly caveat: string;
}

export const BLACK_HOLE_LABORATORY_TYPES: readonly BlackHoleLaboratoryKind[] = Object.freeze([
  ExtremeType.STELLAR_MASS_BLACK_HOLE,
  ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
  ExtremeType.SMBH,
]);

const LABELS: Readonly<Record<BlackHoleLaboratoryKind, string>> = Object.freeze({
  [ExtremeType.STELLAR_MASS_BLACK_HOLE]: 'Agujero negro de masa estelar',
  [ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE]: 'Agujero negro de masa intermedia',
  [ExtremeType.SMBH]: 'Agujero negro supermasivo',
});

export function blackHoleLaboratorySamples(type: BlackHoleLaboratoryKind): readonly BlackHoleLaboratoryRenderModel[] {
  return Object.freeze(Array.from({ length: 8 }, (_, i) => createModel(type, i)));
}

export function blackHoleLaboratoryModel(type: BlackHoleLaboratoryKind, sampleIndex: number): BlackHoleLaboratoryRenderModel {
  if (!(BLACK_HOLE_LABORATORY_TYPES as readonly string[]).includes(type)) {
    throw new RangeError(`Unsupported black-hole laboratory type: ${type}.`);
  }
  if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= 8) {
    throw new RangeError(`Unsupported black-hole laboratory sample index: ${sampleIndex}.`);
  }
  return createModel(type, sampleIndex);
}

function createModel(type: BlackHoleLaboratoryKind, index: number): BlackHoleLaboratoryRenderModel {
  const t = index / 7;
  const wave = (Math.sin((index + 1) * 1.913) + 1) / 2;
  const spin = round(0.08 + 0.88 * (0.62 * t + 0.38 * wave), 3);
  const inclination = round(18 + ((index * 13 + 17) % 63), 1);
  const accretion = round(0.025 + 0.62 * (0.35 * t + 0.65 * wave), 3);
  const baseMass = type === ExtremeType.STELLAR_MASS_BLACK_HOLE
    ? 5.5 + 24 * (0.58 * t + 0.42 * wave)
    : type === ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE
      ? 1.2e3 * 10 ** (1.75 * (0.58 * t + 0.42 * wave))
      : 1.2e6 * 10 ** (2.85 * (0.58 * t + 0.42 * wave));
  const massSolar = roundScientific(baseMass);
  const schwarzschildRadiusKm = massSolar * 2.95325;
  const tempScale = type === ExtremeType.STELLAR_MASS_BLACK_HOLE ? 1.0 : type === ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE ? 0.18 : 0.025;
  const diskTemperatureK = roundScientific((4.8e6 * tempScale) * (0.55 + 0.9 * accretion));

  const palettes = type === ExtremeType.STELLAR_MASS_BLACK_HOLE
    ? [
        [0xffffff, 0xffc56b, 0xc64a1c, 0xfff0c8], [0xeaf7ff, 0xffa65b, 0xa73b20, 0xffdfae],
        [0xffffff, 0xffdc8a, 0xdb5b20, 0xfff7d6], [0xdff6ff, 0xffb54a, 0xff6b24, 0xffffff],
        [0xf4fbff, 0xe8a766, 0x8f3c2c, 0xffe1b2], [0xffffff, 0xffd17a, 0xbc4c24, 0xfff8e5],
        [0xeefaff, 0xff9e3d, 0xe8521d, 0xffffff], [0xe9f5ff, 0xe2a16c, 0x7d382d, 0xffd7aa],
      ]
    : type === ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE
      ? [
          [0xffffff, 0xf5d3a0, 0xa75b35, 0xfff6df], [0xe7f4ff, 0xd8b686, 0x80513b, 0xf8ead6],
          [0xffffff, 0xf3c27d, 0xb15c2f, 0xfff3cf], [0xeef7ff, 0xe8c089, 0x8d4a31, 0xffffff],
          [0xe6f3ff, 0xc9ac8e, 0x6f4c42, 0xeadccd], [0xffffff, 0xf4d59f, 0x9d5433, 0xfff7e4],
          [0xf6fbff, 0xe7b66d, 0xb5612f, 0xffffff], [0xdcecff, 0xbfa07f, 0x62443c, 0xe6d4c4],
        ]
      : [
          [0xffffff, 0xf0c996, 0x9b5d3a, 0xfff5df], [0xe9f5ff, 0xcab28f, 0x765346, 0xf5e8d7],
          [0xffffff, 0xe8bd7d, 0xa05d36, 0xfff1d0], [0xf4f9ff, 0xe2bb84, 0x884c34, 0xffffff],
          [0xdfeeff, 0xbca991, 0x66504b, 0xe7d9cc], [0xffffff, 0xf0d09d, 0x91593a, 0xfff7e8],
          [0xf7fbff, 0xdeb06e, 0xa35d31, 0xffffff], [0xd8e8ff, 0xb29c84, 0x5e4944, 0xe2d1c4],
        ];
  const [inner, mid, outer, ring] = palettes[index];

  return Object.freeze({
    type,
    label: LABELS[type],
    sampleLabel: String.fromCharCode(65 + index),
    massSolar,
    schwarzschildRadiusKm,
    spinDimensionless: spin,
    inclinationDegrees: inclination,
    accretionRateEddington: accretion,
    diskTemperatureK,
    diskInnerRadiusRg: round(2.0 + (1 - spin) * 4.0, 2),
    diskOuterRadiusRg: round(22 + 18 * (0.35 + wave * 0.65), 1),
    lensingStrength: round(0.78 + 0.42 * (0.45 * t + 0.55 * wave), 3),
    visualSpinSeconds: round(13 - spin * 7.2, 2),
    diskColorInner: inner,
    diskColorMid: mid,
    diskColorOuter: outer,
    photonRingColor: ring,
    diskBrightness: round(0.72 + 0.55 * accretion, 3),
    diskThickness: round(0.028 + 0.055 * (0.25 + wave * 0.75), 3),
    turbulenceScale: round(5.5 + index * 0.85 + wave * 2.1, 2),
    turbulenceStrength: round(0.12 + 0.22 * (0.3 * t + 0.7 * wave), 3),
    caveat: 'La lente, el disco y el spin son una visualización relativista aproximada para laboratorio; no sustituyen ray tracing GR ni representan una escala angular observacional real.',
  });
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
function roundScientific(value: number): number { return Number(value.toPrecision(4)); }
