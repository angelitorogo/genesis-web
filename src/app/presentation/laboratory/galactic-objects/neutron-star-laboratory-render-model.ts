import { ExtremeType, type ExtremeType as ExtremeTypeValue } from '../../../domain/galactic-object/extreme-object-type';

export type NeutronStarLaboratoryKind =
  | typeof ExtremeType.NEUTRON_STAR
  | typeof ExtremeType.PULSAR
  | typeof ExtremeType.MILLISECOND_PULSAR
  | typeof ExtremeType.MAGNETAR;

export interface NeutronStarLaboratoryRenderModel {
  readonly type: NeutronStarLaboratoryKind;
  readonly label: string;
  readonly sampleLabel: string;
  readonly massSolar: number;
  readonly radiusKm: number;
  readonly spinPeriodSeconds: number | null;
  readonly magneticFieldTesla: number | null;
  readonly magneticInclinationDegrees: number | null;
  readonly beamHalfOpeningAngleDegrees: number | null;
  readonly showBeams: boolean;
  readonly showMagneticField: boolean;
  readonly fieldLineCount: number;
  readonly fieldExtent: number;
  /** Presentation cadence only; deliberately decoupled from physical spin. */
  readonly visualRotationSeconds: number;
  readonly surfaceColor: number;
  readonly deepSurfaceColor: number;
  readonly hotSurfaceColor: number;
  readonly glowColor: number;
  readonly accentColor: number;
  /** Procedural presentation controls. They alter only the laboratory appearance, never physical classification. */
  readonly surfaceNoiseScale: number;
  readonly surfaceDetailScale: number;
  readonly surfaceFineScale: number;
  readonly surfaceHotThreshold: number;
  readonly surfaceHotIntensity: number;
  readonly surfaceContrast: number;
  readonly surfaceBrightness: number;
  readonly surfaceFresnelStrength: number;
  readonly coronaRadius: number;
  readonly coronaOpacity: number;
  readonly wispCount: number;
  readonly wispOpacity: number;
  readonly wispSpread: number;
  readonly activityRate: number;
  readonly caveat: string;
}

export const NEUTRON_STAR_LABORATORY_TYPES: readonly NeutronStarLaboratoryKind[] = Object.freeze([
  ExtremeType.NEUTRON_STAR,
  ExtremeType.PULSAR,
  ExtremeType.MILLISECOND_PULSAR,
  ExtremeType.MAGNETAR,
]);

const LABELS: Readonly<Record<NeutronStarLaboratoryKind, string>> = Object.freeze({
  [ExtremeType.NEUTRON_STAR]: 'Estrella de neutrones',
  [ExtremeType.PULSAR]: 'Púlsar',
  [ExtremeType.MILLISECOND_PULSAR]: 'Púlsar de milisegundos',
  [ExtremeType.MAGNETAR]: 'Magnetar',
});

export function neutronStarLaboratorySamples(
  type: NeutronStarLaboratoryKind,
): readonly NeutronStarLaboratoryRenderModel[] {
  assertKind(type);
  return Object.freeze(Array.from({ length: 8 }, (_, index) => createModel(type, index)));
}

export function neutronStarLaboratoryModel(
  type: NeutronStarLaboratoryKind,
  sampleIndex: number,
): NeutronStarLaboratoryRenderModel {
  assertKind(type);
  if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= 8) {
    throw new RangeError(`Unsupported neutron-star laboratory sample index: ${sampleIndex}.`);
  }
  return createModel(type, sampleIndex);
}

function createModel(type: NeutronStarLaboratoryKind, index: number): NeutronStarLaboratoryRenderModel {
  const t = index / 7;
  const wave = (Math.sin((index + 1) * 2.173) + 1) / 2;
  const massSolar = round(1.22 + 0.78 * (0.64 * t + 0.36 * wave), 3);
  const radiusKm = round(13.7 - 2.7 * (0.58 * t + 0.42 * wave), 2);
  const inclination = round(12 + ((index * 17 + 23) % 69), 1);

  const common = {
    type,
    label: LABELS[type],
    sampleLabel: String.fromCharCode(65 + index),
    massSolar,
    radiusKm,
  } as const;

  if (type === ExtremeType.NEUTRON_STAR) {
    const profiles = [
      // A — muy caliente y luminosa: zonas calientes amplias, halo intenso, actividad media.
      { noise: 4.0, detail: 9.3, fine: 22.0, threshold: 0.61, hot: 0.72, contrast: 0.92, brightness: 1.10, fresnel: 0.58, coronaRadius: 1.34, coronaOpacity: 0.33, wisps: 6, wispOpacity: 0.060, wispSpread: 0.86, activity: 0.88 },
      // B — azul profundo: menos blanco, textura fina y halo contenido.
      { noise: 5.4, detail: 13.5, fine: 31.0, threshold: 0.73, hot: 0.42, contrast: 1.18, brightness: 0.84, fresnel: 0.42, coronaRadius: 1.24, coronaOpacity: 0.18, wisps: 3, wispOpacity: 0.032, wispSpread: 0.72, activity: 0.55 },
      // C — granular fina: mucho microdetalle y manchas pequeñas.
      { noise: 5.8, detail: 18.5, fine: 42.0, threshold: 0.70, hot: 0.50, contrast: 1.08, brightness: 0.94, fresnel: 0.47, coronaRadius: 1.27, coronaOpacity: 0.22, wisps: 4, wispOpacity: 0.040, wispSpread: 0.78, activity: 0.68 },
      // D — actividad alta: estructura contrastada y filamentos externos destacados.
      { noise: 3.6, detail: 10.8, fine: 26.0, threshold: 0.66, hot: 0.62, contrast: 1.28, brightness: 0.98, fresnel: 0.55, coronaRadius: 1.39, coronaOpacity: 0.29, wisps: 12, wispOpacity: 0.090, wispSpread: 1.12, activity: 1.35 },
      // E — actividad baja: superficie suave, casi sin filamentos y corona mínima.
      { noise: 3.1, detail: 7.2, fine: 16.0, threshold: 0.77, hot: 0.34, contrast: 0.78, brightness: 0.88, fresnel: 0.34, coronaRadius: 1.19, coronaOpacity: 0.12, wisps: 1, wispOpacity: 0.020, wispSpread: 0.62, activity: 0.38 },
      // F — hielo azulado: brillante pero desaturada, detalle medio y limbo fuerte.
      { noise: 4.7, detail: 12.2, fine: 28.0, threshold: 0.69, hot: 0.48, contrast: 0.88, brightness: 1.04, fresnel: 0.70, coronaRadius: 1.31, coronaOpacity: 0.27, wisps: 5, wispOpacity: 0.045, wispSpread: 0.82, activity: 0.72 },
      // G — cian energético: puntos calientes pequeños e intensos, actividad rápida.
      { noise: 6.1, detail: 15.8, fine: 36.0, threshold: 0.79, hot: 0.82, contrast: 1.22, brightness: 0.96, fresnel: 0.50, coronaRadius: 1.30, coronaOpacity: 0.24, wisps: 9, wispOpacity: 0.070, wispSpread: 0.98, activity: 1.18 },
      // H — más oscura y legible: poco clipping blanco y mayor profundidad azul.
      { noise: 4.4, detail: 11.6, fine: 24.0, threshold: 0.76, hot: 0.36, contrast: 1.34, brightness: 0.76, fresnel: 0.38, coronaRadius: 1.22, coronaOpacity: 0.15, wisps: 2, wispOpacity: 0.028, wispSpread: 0.68, activity: 0.50 },
    ] as const;
    const profile = profiles[index];

    return Object.freeze({
      ...common,
      spinPeriodSeconds: null,
      magneticFieldTesla: null,
      magneticInclinationDegrees: null,
      beamHalfOpeningAngleDegrees: null,
      showBeams: false,
      showMagneticField: false,
      fieldLineCount: 0,
      fieldExtent: 0,
      visualRotationSeconds: 13 - index * 0.45,
      surfaceColor: [0x8ee8ff, 0x3f8fdc, 0x6fe4f2, 0x3ab5ff, 0x6e9fbd, 0xb4e8ff, 0x36e0e8, 0x477caf][index],
      deepSurfaceColor: [0x0a3d70, 0x061b49, 0x0b4553, 0x022a59, 0x163044, 0x315879, 0x064b58, 0x071d3b][index],
      hotSurfaceColor: [0xf7ffff, 0xb8e9ff, 0xf3ffff, 0xdcf9ff, 0xcfe9f5, 0xffffff, 0xdfffff, 0xbbdcf0][index],
      glowColor: [0x43c9ff, 0x1f78cf, 0x45d6e2, 0x159fff, 0x5f91ad, 0x80ccff, 0x20ccd8, 0x2d6fa8][index],
      accentColor: [0xeafaff, 0x8ecfff, 0xdffeff, 0xc8f1ff, 0xbfd8e5, 0xf4fbff, 0xc8ffff, 0x9bc8e7][index],
      surfaceNoiseScale: profile.noise,
      surfaceDetailScale: profile.detail,
      surfaceFineScale: profile.fine,
      surfaceHotThreshold: profile.threshold,
      surfaceHotIntensity: profile.hot,
      surfaceContrast: profile.contrast,
      surfaceBrightness: profile.brightness,
      surfaceFresnelStrength: profile.fresnel,
      coronaRadius: profile.coronaRadius,
      coronaOpacity: profile.coronaOpacity,
      wispCount: profile.wisps,
      wispOpacity: profile.wispOpacity,
      wispSpread: profile.wispSpread,
      activityRate: profile.activity,
      caveat: 'Perfil compacto base: la rotación visual no asigna un periodo físico ni clasifica actividad pulsante.',
    });
  }

  if (type === ExtremeType.PULSAR) {
    const profiles = [
      { noise: 4.2, detail: 10.2, fine: 25.0, threshold: 0.67, hot: 0.64, contrast: 1.05, brightness: 0.98, fresnel: 0.56, coronaRadius: 1.18, coronaOpacity: 0.17, fieldLines: 7, fieldExtent: 2.05, activity: 0.82 },
      { noise: 5.0, detail: 14.4, fine: 34.0, threshold: 0.74, hot: 0.46, contrast: 1.22, brightness: 0.86, fresnel: 0.45, coronaRadius: 1.14, coronaOpacity: 0.12, fieldLines: 6, fieldExtent: 1.88, activity: 0.66 },
      { noise: 5.7, detail: 18.0, fine: 43.0, threshold: 0.71, hot: 0.54, contrast: 1.12, brightness: 0.93, fresnel: 0.50, coronaRadius: 1.16, coronaOpacity: 0.14, fieldLines: 8, fieldExtent: 2.15, activity: 0.95 },
      { noise: 3.8, detail: 11.0, fine: 27.0, threshold: 0.64, hot: 0.72, contrast: 1.28, brightness: 1.02, fresnel: 0.62, coronaRadius: 1.23, coronaOpacity: 0.21, fieldLines: 10, fieldExtent: 2.34, activity: 1.24 },
      { noise: 3.3, detail: 8.0, fine: 18.0, threshold: 0.77, hot: 0.36, contrast: 0.88, brightness: 0.84, fresnel: 0.40, coronaRadius: 1.12, coronaOpacity: 0.10, fieldLines: 5, fieldExtent: 1.78, activity: 0.52 },
      { noise: 4.6, detail: 12.6, fine: 30.0, threshold: 0.69, hot: 0.52, contrast: 0.98, brightness: 1.04, fresnel: 0.68, coronaRadius: 1.20, coronaOpacity: 0.18, fieldLines: 7, fieldExtent: 2.00, activity: 0.78 },
      { noise: 6.0, detail: 16.2, fine: 38.0, threshold: 0.80, hot: 0.78, contrast: 1.24, brightness: 0.95, fresnel: 0.52, coronaRadius: 1.19, coronaOpacity: 0.16, fieldLines: 9, fieldExtent: 2.26, activity: 1.18 },
      { noise: 4.4, detail: 11.8, fine: 24.0, threshold: 0.76, hot: 0.38, contrast: 1.32, brightness: 0.78, fresnel: 0.42, coronaRadius: 1.13, coronaOpacity: 0.11, fieldLines: 6, fieldExtent: 1.92, activity: 0.58 },
    ] as const;
    const profile = profiles[index];
    return Object.freeze({
      ...common,
      spinPeriodSeconds: round(0.055 + 1.75 * (0.24 * t + 0.76 * wave), 4),
      magneticFieldTesla: roundScientific(1e7 * 10 ** (0.15 + 1.25 * t)),
      magneticInclinationDegrees: inclination,
      beamHalfOpeningAngleDegrees: round(6 + 15 * wave, 1),
      showBeams: true,
      showMagneticField: true,
      fieldLineCount: profile.fieldLines,
      fieldExtent: profile.fieldExtent,
      visualRotationSeconds: 7.4 - index * 0.28,
      surfaceColor: [0x8fdcff, 0x4d91d9, 0x67d7ee, 0x56bdff, 0x6d9bb7, 0xb4e6ff, 0x35d8e5, 0x4778a5][index],
      deepSurfaceColor: [0x092b52, 0x051938, 0x073947, 0x062449, 0x142c3d, 0x294f6c, 0x063f4d, 0x07182e][index],
      hotSurfaceColor: [0xf5ffff, 0xb7e5ff, 0xefffff, 0xd7f8ff, 0xc4dce8, 0xffffff, 0xd8ffff, 0xb8d7eb][index],
      glowColor: [0x39bff7, 0x1e6fbd, 0x41cadb, 0x1599ed, 0x547f99, 0x73c4f6, 0x1bbfcb, 0x286393][index],
      accentColor: [0xc8f7ff, 0x86cbff, 0xd8feff, 0xbdeeff, 0xb3d0df, 0xecfbff, 0xbfffff, 0x8ebfe0][index],
      surfaceNoiseScale: profile.noise,
      surfaceDetailScale: profile.detail,
      surfaceFineScale: profile.fine,
      surfaceHotThreshold: profile.threshold,
      surfaceHotIntensity: profile.hot,
      surfaceContrast: profile.contrast,
      surfaceBrightness: profile.brightness,
      surfaceFresnelStrength: profile.fresnel,
      coronaRadius: profile.coronaRadius,
      coronaOpacity: profile.coronaOpacity,
      wispCount: 0,
      wispOpacity: 0,
      wispSpread: 1.0,
      activityRate: profile.activity,
      caveat: 'Los haces muestran la geometría magnética del modelo; la animación está ralentizada y no equivale a una detección ni a la cadencia física real.',
    });
  }

  if (type === ExtremeType.MILLISECOND_PULSAR) {
    const profiles = [
      { noise: 6.0, detail: 19.0, fine: 48.0, threshold: 0.78, hot: 0.74, contrast: 1.10, brightness: 1.03, fresnel: 0.72, coronaRadius: 1.10, coronaOpacity: 0.18, fieldLines: 7, fieldExtent: 1.72, activity: 1.38 },
      { noise: 6.8, detail: 22.0, fine: 56.0, threshold: 0.82, hot: 0.58, contrast: 1.28, brightness: 0.92, fresnel: 0.66, coronaRadius: 1.06, coronaOpacity: 0.13, fieldLines: 6, fieldExtent: 1.61, activity: 1.22 },
      { noise: 5.8, detail: 25.0, fine: 62.0, threshold: 0.80, hot: 0.68, contrast: 1.18, brightness: 0.98, fresnel: 0.70, coronaRadius: 1.08, coronaOpacity: 0.16, fieldLines: 8, fieldExtent: 1.76, activity: 1.46 },
      { noise: 5.2, detail: 17.0, fine: 44.0, threshold: 0.72, hot: 0.86, contrast: 1.22, brightness: 1.06, fresnel: 0.78, coronaRadius: 1.14, coronaOpacity: 0.22, fieldLines: 9, fieldExtent: 1.86, activity: 1.72 },
      { noise: 4.8, detail: 15.0, fine: 36.0, threshold: 0.84, hot: 0.46, contrast: 0.96, brightness: 0.90, fresnel: 0.58, coronaRadius: 1.04, coronaOpacity: 0.10, fieldLines: 5, fieldExtent: 1.55, activity: 0.98 },
      { noise: 6.2, detail: 20.0, fine: 52.0, threshold: 0.77, hot: 0.62, contrast: 1.02, brightness: 1.08, fresnel: 0.82, coronaRadius: 1.12, coronaOpacity: 0.20, fieldLines: 7, fieldExtent: 1.80, activity: 1.34 },
      { noise: 7.2, detail: 27.0, fine: 68.0, threshold: 0.85, hot: 0.88, contrast: 1.30, brightness: 0.97, fresnel: 0.74, coronaRadius: 1.11, coronaOpacity: 0.18, fieldLines: 8, fieldExtent: 1.89, activity: 1.84 },
      { noise: 5.6, detail: 18.0, fine: 40.0, threshold: 0.83, hot: 0.42, contrast: 1.36, brightness: 0.84, fresnel: 0.62, coronaRadius: 1.03, coronaOpacity: 0.11, fieldLines: 6, fieldExtent: 1.59, activity: 1.06 },
    ] as const;
    const profile = profiles[index];
    return Object.freeze({
      ...common,
      spinPeriodSeconds: round(0.0025 + 0.0205 * (0.18 * t + 0.82 * wave), 5),
      magneticFieldTesla: roundScientific(1e4 * 10 ** (0.12 + 0.83 * t)),
      magneticInclinationDegrees: inclination,
      beamHalfOpeningAngleDegrees: round(5.5 + 8.5 * wave, 1),
      showBeams: true,
      showMagneticField: true,
      fieldLineCount: profile.fieldLines,
      fieldExtent: profile.fieldExtent,
      visualRotationSeconds: 2.9 - index * 0.08,
      surfaceColor: [0xc7f6ff, 0x7bc8ff, 0xa5f7ff, 0x8ce5ff, 0xa7d3e5, 0xe0fbff, 0x66fff6, 0x8ab5e2][index],
      deepSurfaceColor: [0x14425f, 0x0a2354, 0x0c4152, 0x10315f, 0x254152, 0x416787, 0x0a4b5c, 0x13294a][index],
      hotSurfaceColor: [0xffffff, 0xdff3ff, 0xf7ffff, 0xe9ffff, 0xd8edf8, 0xffffff, 0xecffff, 0xd0e8f4][index],
      glowColor: [0x79ebff, 0x4aa9ff, 0x6de4f1, 0x56d3ff, 0x7db1c5, 0xa1e8ff, 0x48f0ea, 0x6497d1][index],
      accentColor: [0xffffff, 0xeefdff, 0xffffff, 0xf4ffff, 0xe8f8ff, 0xffffff, 0xf0ffff, 0xe7f2ff][index],
      surfaceNoiseScale: profile.noise,
      surfaceDetailScale: profile.detail,
      surfaceFineScale: profile.fine,
      surfaceHotThreshold: profile.threshold,
      surfaceHotIntensity: profile.hot,
      surfaceContrast: profile.contrast,
      surfaceBrightness: profile.brightness,
      surfaceFresnelStrength: profile.fresnel,
      coronaRadius: profile.coronaRadius,
      coronaOpacity: profile.coronaOpacity,
      wispCount: 0,
      wispOpacity: 0,
      wispSpread: 1.0,
      activityRate: profile.activity,
      caveat: 'La animación está fuertemente ralentizada: un periodo de milisegundos no se reproduce a escala temporal real y el haz se muestra con escala visual exagerada.',
    });
  }

  const profiles = [
    { noise: 4.4, detail: 13.0, fine: 32.0, threshold: 0.66, hot: 0.64, contrast: 1.04, brightness: 1.00, fresnel: 0.68, coronaRadius: 1.24, coronaOpacity: 0.18, fieldLines: 12, fieldExtent: 2.56, wisps: 5, wispOpacity: 0.050, wispSpread: 1.02, activity: 1.05 },
    { noise: 5.1, detail: 16.0, fine: 38.0, threshold: 0.72, hot: 0.52, contrast: 1.18, brightness: 0.92, fresnel: 0.60, coronaRadius: 1.18, coronaOpacity: 0.14, fieldLines: 10, fieldExtent: 2.44, wisps: 4, wispOpacity: 0.042, wispSpread: 0.94, activity: 0.92 },
    { noise: 5.7, detail: 20.0, fine: 46.0, threshold: 0.70, hot: 0.58, contrast: 1.10, brightness: 0.98, fresnel: 0.72, coronaRadius: 1.21, coronaOpacity: 0.16, fieldLines: 14, fieldExtent: 2.62, wisps: 6, wispOpacity: 0.050, wispSpread: 1.00, activity: 1.12 },
    { noise: 3.8, detail: 12.0, fine: 28.0, threshold: 0.63, hot: 0.82, contrast: 1.26, brightness: 1.06, fresnel: 0.84, coronaRadius: 1.28, coronaOpacity: 0.24, fieldLines: 16, fieldExtent: 2.78, wisps: 10, wispOpacity: 0.078, wispSpread: 1.16, activity: 1.48 },
    { noise: 3.5, detail: 9.0, fine: 20.0, threshold: 0.78, hot: 0.42, contrast: 0.90, brightness: 0.88, fresnel: 0.52, coronaRadius: 1.14, coronaOpacity: 0.10, fieldLines: 9, fieldExtent: 2.34, wisps: 2, wispOpacity: 0.028, wispSpread: 0.88, activity: 0.72 },
    { noise: 4.8, detail: 14.5, fine: 34.0, threshold: 0.68, hot: 0.50, contrast: 0.96, brightness: 1.04, fresnel: 0.88, coronaRadius: 1.26, coronaOpacity: 0.22, fieldLines: 11, fieldExtent: 2.58, wisps: 7, wispOpacity: 0.056, wispSpread: 1.06, activity: 1.08 },
    { noise: 6.2, detail: 22.0, fine: 54.0, threshold: 0.79, hot: 0.86, contrast: 1.28, brightness: 0.97, fresnel: 0.76, coronaRadius: 1.23, coronaOpacity: 0.20, fieldLines: 15, fieldExtent: 2.70, wisps: 9, wispOpacity: 0.070, wispSpread: 1.10, activity: 1.62 },
    { noise: 4.2, detail: 11.2, fine: 26.0, threshold: 0.76, hot: 0.38, contrast: 1.34, brightness: 0.82, fresnel: 0.56, coronaRadius: 1.15, coronaOpacity: 0.11, fieldLines: 10, fieldExtent: 2.40, wisps: 3, wispOpacity: 0.032, wispSpread: 0.92, activity: 0.84 },
  ] as const;
  const profile = profiles[index];
  return Object.freeze({
    ...common,
    spinPeriodSeconds: round(2.0 + 9.5 * (0.32 * t + 0.68 * wave), 3),
    magneticFieldTesla: roundScientific(3e9 * 10 ** (0.1 + 1.35 * t)),
    magneticInclinationDegrees: inclination,
    beamHalfOpeningAngleDegrees: null,
    showBeams: false,
    showMagneticField: true,
    fieldLineCount: profile.fieldLines,
    fieldExtent: profile.fieldExtent,
    visualRotationSeconds: 9.2 - index * 0.24,
    surfaceColor: [0xbbc9ff, 0x8f9ee7, 0x9fd7ff, 0xaea0ff, 0x8aa0c8, 0xd9d4ff, 0x77c6ff, 0x8190cf][index],
    deepSurfaceColor: [0x2c3666, 0x241f56, 0x20466d, 0x321f6b, 0x2b3553, 0x544f7a, 0x194d77, 0x1d234a][index],
    hotSurfaceColor: [0xf8f3ff, 0xf0deff, 0xedfbff, 0xffecff, 0xdde6f7, 0xffffff, 0xe8fbff, 0xd8dff4][index],
    glowColor: [0x917dff, 0x745cff, 0x5fb4ff, 0xa06dff, 0x6d83b8, 0xc0a8ff, 0x4ea4ff, 0x6c72bb][index],
    accentColor: [0xe8dcff, 0xddc7ff, 0xd9f0ff, 0xf0d7ff, 0xd1d8ef, 0xf8f0ff, 0xdaf0ff, 0xd3d8f7][index],
    surfaceNoiseScale: profile.noise,
    surfaceDetailScale: profile.detail,
    surfaceFineScale: profile.fine,
    surfaceHotThreshold: profile.threshold,
    surfaceHotIntensity: profile.hot,
    surfaceContrast: profile.contrast,
    surfaceBrightness: profile.brightness,
    surfaceFresnelStrength: profile.fresnel,
    coronaRadius: profile.coronaRadius,
    coronaOpacity: profile.coronaOpacity,
    wispCount: profile.wisps,
    wispOpacity: profile.wispOpacity,
    wispSpread: profile.wispSpread,
    activityRate: profile.activity,
    caveat: 'Las líneas representan topología dipolar esquemática y actividad extrema del modelo; no simulan magnetohidrodinámica completa, reconexión detallada ni estallidos magnetar reales.',
  });
}

function assertKind(type: ExtremeTypeValue): asserts type is NeutronStarLaboratoryKind {
  if (!(NEUTRON_STAR_LABORATORY_TYPES as readonly string[]).includes(type)) {
    throw new RangeError(`Unsupported neutron-star laboratory type: ${type}.`);
  }
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function roundScientific(value: number): number {
  return Number(value.toPrecision(4));
}
