/**
 * 28.2F.7 — Infraestructura común del laboratorio de objetos extremos.
 *
 * Este módulo es deliberadamente independiente de Angular y de los renderers
 * concretos. Su contrato puede reutilizarse después desde el juego sin arrastrar
 * componentes del laboratorio ni acoplar parámetros físicos a exageraciones
 * puramente visuales.
 *
 * IMPORTANTE: esta consolidación no modifica las representaciones aprobadas.
 * Los perfiles marcan contratos, cámara y escalas; cada renderer mantiene su
 * geometría/shaders actuales hasta que sea migrado de forma localizada.
 */

export const EXTREME_LABORATORY_PRESET_LABELS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
] as const;

export type ExtremeLaboratoryPresetLabel =
  typeof EXTREME_LABORATORY_PRESET_LABELS[number];

export type ExtremeLaboratoryRenderSurface =
  | 'LABORATORY'
  | 'GAME';

export type ExtremeLaboratoryDetailStage =
  | 'DETECTED'
  | 'DISCOVERED'
  | 'CATALOGUED'
  | 'CONFIRMED';

export type ExtremeLaboratoryRendererFamily =
  | 'COMPACT_STAR'
  | 'BLACK_HOLE'
  | 'XRAY_BINARY'
  | 'NUCLEAR_SOURCE'
  | 'REMNANT';

export type ExtremeLaboratoryType =
  | 'SMBH'
  | 'AGN'
  | 'QUASAR'
  | 'NEUTRON_STAR'
  | 'PULSAR'
  | 'MILLISECOND_PULSAR'
  | 'MAGNETAR'
  | 'STELLAR_MASS_BLACK_HOLE'
  | 'INTERMEDIATE_MASS_BLACK_HOLE'
  | 'SUPERNOVA_REMNANT'
  | 'PULSAR_WIND_NEBULA'
  | 'X_RAY_BINARY_NS'
  | 'X_RAY_BINARY_BH'
  | 'MICROQUASAR'
  | 'ULX';

export interface ExtremeLaboratoryVector3Preset {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface ExtremeLaboratoryCameraPreset {
  readonly fovDegrees: number;
  readonly near: number;
  readonly far: number;
  readonly position: ExtremeLaboratoryVector3Preset;
  readonly target: ExtremeLaboratoryVector3Preset;
}

export interface ExtremeLaboratoryScalePolicy {
  /** Escala aparente base; no representa una equivalencia física entre familias. */
  readonly apparentScale: number;
  /** Margen visual mínimo alrededor del envelope renderizado. */
  readonly framingPadding: number;
  /** Límite inferior para evitar que un objeto compacto desaparezca visualmente. */
  readonly minimumReadableScale: number;
  /** Límite superior para evitar clipping del envelope visual. */
  readonly maximumReadableScale: number;
}

export interface ExtremeLaboratoryControlDescriptor {
  readonly key: string;
  readonly label: string;
  readonly unit: string | null;
  readonly optional: boolean;
}

export interface ExtremeLaboratoryRegistration {
  readonly type: ExtremeLaboratoryType;
  readonly rendererFamily: ExtremeLaboratoryRendererFamily;
  readonly rendererKey: string;
  readonly presets: readonly ExtremeLaboratoryPresetLabel[];
  readonly camera: ExtremeLaboratoryCameraPreset;
  readonly scale: ExtremeLaboratoryScalePolicy;
  readonly physicalControls: readonly ExtremeLaboratoryControlDescriptor[];
  readonly visualControls: readonly ExtremeLaboratoryControlDescriptor[];
  readonly supportsAnimation: boolean;
}

export interface ExtremeLaboratoryPresetSelection {
  readonly type: ExtremeLaboratoryType;
  readonly preset: ExtremeLaboratoryPresetLabel;
  readonly presetIndex: number;
  readonly stableId: string;
}

export interface ExtremeLaboratoryRenderRequest {
  readonly type: ExtremeLaboratoryType;
  readonly preset: ExtremeLaboratoryPresetSelection;
  readonly surface: ExtremeLaboratoryRenderSurface;
  readonly detailStage: ExtremeLaboratoryDetailStage;
  readonly animationEnabled: boolean;
  readonly rendererFamily: ExtremeLaboratoryRendererFamily;
  readonly rendererKey: string;
  readonly camera: ExtremeLaboratoryCameraPreset;
  readonly scale: ExtremeLaboratoryScalePolicy;
}

const COMPACT_STAR_PHYSICAL_CONTROLS = controls([
  ['mass', 'Masa', 'M☉', false],
  ['referenceRadius', 'Radio de referencia', 'km', false],
  ['spinPeriod', 'Periodo de giro', 's', true],
  ['dipolarField', 'Campo dipolar', 'T', true],
  ['magneticInclination', 'Inclinación magnética', 'deg', true],
]);

const BLACK_HOLE_PHYSICAL_CONTROLS = controls([
  ['mass', 'Masa', 'M☉', false],
  ['spin', 'Spin adimensional', null, false],
  ['accretionRate', 'Tasa de acreción', 'M☉/año', true],
  ['inclination', 'Inclinación', 'deg', false],
]);

const XRAY_BINARY_PHYSICAL_CONTROLS = controls([
  ['donorMass', 'Masa donante', 'M☉', false],
  ['donorRadius', 'Radio donante', 'R☉', false],
  ['compactMass', 'Masa compacta', 'M☉', false],
  ['orbitalPeriod', 'Periodo orbital', 'h', false],
  ['separation', 'Separación', 'R☉', false],
  ['transferRate', 'Tasa de transferencia', 'M☉/año', false],
  ['diskTemperature', 'Temperatura del disco', 'K', false],
  ['xrayLuminosity', 'Luminosidad X', 'erg/s', false],
  ['jetPower', 'Potencia de jet', 'erg/s', true],
  ['windVelocity', 'Velocidad de viento', 'c', true],
]);

const NUCLEAR_PHYSICAL_CONTROLS = controls([
  ['smbhMass', 'Masa SMBH', 'M☉', false],
  ['spin', 'Spin adimensional', null, true],
  ['accretionRate', 'Tasa de acreción', 'M☉/año', true],
  ['inclination', 'Inclinación', 'deg', true],
  ['jetPower', 'Potencia de jet', 'erg/s', true],
]);

const REMNANT_PHYSICAL_CONTROLS = controls([
  ['age', 'Edad', 'años', true],
  ['radius', 'Radio', 'pc', true],
  ['expansionVelocity', 'Velocidad de expansión', 'km/s', true],
  ['pulsarPower', 'Potencia del púlsar', 'erg/s', true],
]);

const COMMON_VISUAL_CONTROLS = controls([
  ['apparentScale', 'Escala aparente', null, false],
  ['framingPadding', 'Margen de encuadre', null, false],
  ['detailBoost', 'Exageración de detalle', null, false],
  ['bloom', 'Bloom visual', null, false],
  ['animationSpeed', 'Velocidad visual', null, false],
]);

const CAMERA_BY_FAMILY: Readonly<Record<ExtremeLaboratoryRendererFamily, ExtremeLaboratoryCameraPreset>> =
  Object.freeze({
    COMPACT_STAR: camera(34, 0.1, 120, 0, 0.1, 14.6),
    BLACK_HOLE: camera(34, 0.1, 120, 0, 0.0, 14.6),
    XRAY_BINARY: camera(34, 0.1, 120, 0, 0.1, 14.6),
    NUCLEAR_SOURCE: camera(34, 0.1, 140, 0, 0.0, 15.2),
    REMNANT: camera(38, 0.1, 180, 0, 0.0, 16.8),
  });

const SCALE_BY_FAMILY: Readonly<Record<ExtremeLaboratoryRendererFamily, ExtremeLaboratoryScalePolicy>> =
  Object.freeze({
    COMPACT_STAR: scale(1.0, 0.10, 0.42, 1.55),
    BLACK_HOLE: scale(1.0, 0.12, 0.46, 1.60),
    XRAY_BINARY: scale(1.0, 0.11, 0.44, 1.58),
    NUCLEAR_SOURCE: scale(1.0, 0.14, 0.42, 1.62),
    REMNANT: scale(1.0, 0.16, 0.38, 1.68),
  });

export const EXTREME_LABORATORY_RENDER_REGISTRY: readonly ExtremeLaboratoryRegistration[] =
  Object.freeze([
    registration('NEUTRON_STAR', 'COMPACT_STAR', 'neutron-star'),
    registration('PULSAR', 'COMPACT_STAR', 'neutron-star'),
    registration('MILLISECOND_PULSAR', 'COMPACT_STAR', 'neutron-star'),
    registration('MAGNETAR', 'COMPACT_STAR', 'neutron-star'),
    registration('STELLAR_MASS_BLACK_HOLE', 'BLACK_HOLE', 'black-hole'),
    registration('INTERMEDIATE_MASS_BLACK_HOLE', 'BLACK_HOLE', 'black-hole'),
    registration('SMBH', 'BLACK_HOLE', 'black-hole'),
    registration('AGN', 'NUCLEAR_SOURCE', 'agn-nucleus'),
    registration('QUASAR', 'NUCLEAR_SOURCE', 'quasar-nucleus'),
    registration('X_RAY_BINARY_NS', 'XRAY_BINARY', 'xray-binary'),
    registration('X_RAY_BINARY_BH', 'XRAY_BINARY', 'xray-binary'),
    registration('MICROQUASAR', 'XRAY_BINARY', 'xray-binary'),
    registration('ULX', 'XRAY_BINARY', 'xray-binary'),
    registration('SUPERNOVA_REMNANT', 'REMNANT', 'supernova-remnant'),
    registration('PULSAR_WIND_NEBULA', 'REMNANT', 'supernova-remnant'),
  ]);

const REGISTRATION_BY_TYPE = new Map<ExtremeLaboratoryType, ExtremeLaboratoryRegistration>(
  EXTREME_LABORATORY_RENDER_REGISTRY.map(entry => [entry.type, entry]),
);

export function extremeLaboratoryRegistration(
  type: string,
): ExtremeLaboratoryRegistration {
  const registration = REGISTRATION_BY_TYPE.get(type as ExtremeLaboratoryType);
  if (registration === undefined) {
    throw new RangeError(`Unsupported extreme laboratory type: ${type}.`);
  }
  return registration;
}

export function extremeLaboratoryPresetSelection(
  type: string,
  preset: ExtremeLaboratoryPresetLabel,
): ExtremeLaboratoryPresetSelection {
  const registration = extremeLaboratoryRegistration(type);
  const presetIndex = registration.presets.indexOf(preset);
  if (presetIndex < 0) {
    throw new RangeError(`Unsupported preset ${preset} for ${type}.`);
  }
  return Object.freeze({
    type: registration.type,
    preset,
    presetIndex,
    stableId: `${registration.type}:${preset}`,
  });
}

export function extremeLaboratoryRenderRequest(options: {
  readonly type: string;
  readonly preset: ExtremeLaboratoryPresetLabel;
  readonly surface: ExtremeLaboratoryRenderSurface;
  readonly detailStage?: ExtremeLaboratoryDetailStage;
  readonly animationEnabled?: boolean;
}): ExtremeLaboratoryRenderRequest {
  const registration = extremeLaboratoryRegistration(options.type);
  const detailStage = options.detailStage ?? 'CONFIRMED';
  const requestedAnimation = options.animationEnabled ?? true;
  const animationEnabled =
    registration.supportsAnimation &&
    requestedAnimation &&
    detailStage === 'CONFIRMED';

  return Object.freeze({
    type: registration.type,
    preset: extremeLaboratoryPresetSelection(registration.type, options.preset),
    surface: options.surface,
    detailStage,
    animationEnabled,
    rendererFamily: registration.rendererFamily,
    rendererKey: registration.rendererKey,
    camera: registration.camera,
    scale: registration.scale,
  });
}

export function extremeLaboratoryCameraPreset(
  type: string,
): ExtremeLaboratoryCameraPreset {
  return extremeLaboratoryRegistration(type).camera;
}

export function extremeLaboratoryScalePolicy(
  type: string,
): ExtremeLaboratoryScalePolicy {
  return extremeLaboratoryRegistration(type).scale;
}

export class ExtremeLaboratoryRenderSession {
  private currentType: ExtremeLaboratoryType;
  private currentPreset: ExtremeLaboratoryPresetLabel;
  private currentSurface: ExtremeLaboratoryRenderSurface;
  private currentDetailStage: ExtremeLaboratoryDetailStage;
  private currentAnimationEnabled: boolean;

  constructor(options: {
    readonly type: string;
    readonly preset?: ExtremeLaboratoryPresetLabel;
    readonly surface?: ExtremeLaboratoryRenderSurface;
    readonly detailStage?: ExtremeLaboratoryDetailStage;
    readonly animationEnabled?: boolean;
  }) {
    const registration = extremeLaboratoryRegistration(options.type);
    this.currentType = registration.type;
    this.currentPreset = options.preset ?? 'A';
    this.currentSurface = options.surface ?? 'LABORATORY';
    this.currentDetailStage = options.detailStage ?? 'CONFIRMED';
    this.currentAnimationEnabled = options.animationEnabled ?? true;
  }

  selectType(type: string): ExtremeLaboratoryRenderRequest {
    this.currentType = extremeLaboratoryRegistration(type).type;
    return this.request();
  }

  selectPreset(preset: ExtremeLaboratoryPresetLabel): ExtremeLaboratoryRenderRequest {
    extremeLaboratoryPresetSelection(this.currentType, preset);
    this.currentPreset = preset;
    return this.request();
  }

  setSurface(surface: ExtremeLaboratoryRenderSurface): ExtremeLaboratoryRenderRequest {
    this.currentSurface = surface;
    return this.request();
  }

  setDetailStage(stage: ExtremeLaboratoryDetailStage): ExtremeLaboratoryRenderRequest {
    this.currentDetailStage = stage;
    return this.request();
  }

  setAnimationEnabled(enabled: boolean): ExtremeLaboratoryRenderRequest {
    this.currentAnimationEnabled = enabled;
    return this.request();
  }

  request(): ExtremeLaboratoryRenderRequest {
    return extremeLaboratoryRenderRequest({
      type: this.currentType,
      preset: this.currentPreset,
      surface: this.currentSurface,
      detailStage: this.currentDetailStage,
      animationEnabled: this.currentAnimationEnabled,
    });
  }
}

function registration(
  type: ExtremeLaboratoryType,
  rendererFamily: ExtremeLaboratoryRendererFamily,
  rendererKey: string,
): ExtremeLaboratoryRegistration {
  return Object.freeze({
    type,
    rendererFamily,
    rendererKey,
    presets: EXTREME_LABORATORY_PRESET_LABELS,
    camera: CAMERA_BY_FAMILY[rendererFamily],
    scale: SCALE_BY_FAMILY[rendererFamily],
    physicalControls: physicalControlsFor(rendererFamily),
    visualControls: COMMON_VISUAL_CONTROLS,
    supportsAnimation: true,
  });
}

function physicalControlsFor(
  family: ExtremeLaboratoryRendererFamily,
): readonly ExtremeLaboratoryControlDescriptor[] {
  switch (family) {
    case 'COMPACT_STAR':
      return COMPACT_STAR_PHYSICAL_CONTROLS;
    case 'BLACK_HOLE':
      return BLACK_HOLE_PHYSICAL_CONTROLS;
    case 'XRAY_BINARY':
      return XRAY_BINARY_PHYSICAL_CONTROLS;
    case 'NUCLEAR_SOURCE':
      return NUCLEAR_PHYSICAL_CONTROLS;
    case 'REMNANT':
      return REMNANT_PHYSICAL_CONTROLS;
  }
}

function controls(
  entries: readonly (readonly [string, string, string | null, boolean])[],
): readonly ExtremeLaboratoryControlDescriptor[] {
  return Object.freeze(
    entries.map(([key, label, unit, optional]) =>
      Object.freeze({ key, label, unit, optional }),
    ),
  );
}

function camera(
  fovDegrees: number,
  near: number,
  far: number,
  x: number,
  y: number,
  z: number,
): ExtremeLaboratoryCameraPreset {
  return Object.freeze({
    fovDegrees,
    near,
    far,
    position: Object.freeze({ x, y, z }),
    target: Object.freeze({ x: 0, y: 0, z: 0 }),
  });
}

function scale(
  apparentScale: number,
  framingPadding: number,
  minimumReadableScale: number,
  maximumReadableScale: number,
): ExtremeLaboratoryScalePolicy {
  return Object.freeze({
    apparentScale,
    framingPadding,
    minimumReadableScale,
    maximumReadableScale,
  });
}
