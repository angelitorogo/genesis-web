import {
  ExtremeType,
  isGalacticNucleusExtremeType,
  type ExtremeType as ExtremeTypeValue,
} from '../../domain/galactic-object/extreme-object-type';

import {
  blackHoleLaboratoryModel,
  type BlackHoleLaboratoryRenderModel,
} from '../laboratory/galactic-objects/black-hole-laboratory-render-model';

import {
  neutronStarLaboratoryModel,
  type NeutronStarLaboratoryRenderModel,
} from '../laboratory/galactic-objects/neutron-star-laboratory-render-model';

import {
  EXTREME_LABORATORY_PRESET_LABELS,
  type ExtremeLaboratoryDetailStage,
  type ExtremeLaboratoryPresetLabel,
} from '../laboratory/galactic-objects/extreme-laboratory-render-infrastructure';

import {
  compactObjectScientificVisual,
  type CompactObjectScientificVisual,
} from './compact-object-scientific-visual';

import {
  xrayBinaryLaboratoryModel,
  type XrayBinaryLaboratoryRenderModel,
} from '../laboratory/galactic-objects/xray-binary-laboratory-render-model';

/**
 * 28.2G.2 — presentation adapter from one real distributed ExtremeType to the
 * already-approved 28.2F laboratory renderer families.
 *
 * The preset A-H is presentation-only and derives from the stable Archive
 * render seed. It never feeds generation or persistence. Numeric values inside
 * a laboratory preset remain renderer parameters: the scientific card must not
 * publish them as measured properties of the procedural object.
 */
export interface ArchiveExtremeObjectRenderModel {
  readonly type: ExtremeTypeValue;
  readonly presetIndex: number;
  readonly presetLabel: ExtremeLaboratoryPresetLabel;
  readonly detailStage: ExtremeLaboratoryDetailStage;
  readonly detectedCompactVisual: CompactObjectScientificVisual | null;
  readonly neutronStarModel: NeutronStarLaboratoryRenderModel | null;
  readonly blackHoleModel: BlackHoleLaboratoryRenderModel | null;
  readonly xrayBinaryModel: XrayBinaryLaboratoryRenderModel | null;
}

export function archiveExtremeObjectRenderModel(
  type: ExtremeTypeValue,
  stableRenderSeed: string,
  detailStage: ExtremeLaboratoryDetailStage = 'CONFIRMED',
): ArchiveExtremeObjectRenderModel {

  if (isGalacticNucleusExtremeType(type)) {
    throw new RangeError(
      `28.2G.2 distributed Archive renderer does not accept galactic-nucleus type ${type}.`,
    );
  }

  if (stableRenderSeed.length === 0) {
    throw new RangeError(
      '28.2G.2 distributed Archive renderer requires a non-empty stable render seed.',
    );
  }

  const presetIndex = stablePresetIndex(stableRenderSeed, type);
  const presetLabel = EXTREME_LABORATORY_PRESET_LABELS[presetIndex]!;

  switch (type) {
    case ExtremeType.NEUTRON_STAR:
    case ExtremeType.PULSAR:
    case ExtremeType.MILLISECOND_PULSAR:
    case ExtremeType.MAGNETAR: {
      const base =
        neutronStarLaboratoryModel(
          type,
          presetIndex,
        );

      return Object.freeze({
        type,
        presetIndex,
        presetLabel,
        detailStage,
        detectedCompactVisual:
          detailStage === 'DETECTED'
            ? compactObjectScientificVisual(
                compactVisualKindForNeutronStarType(
                  type,
                ),
              )
            : null,
        neutronStarModel:
          detailStage === 'DETECTED'
            ? null
            : neutronStarProgressionModel(
                base,
                detailStage,
              ),
        blackHoleModel: null,
        xrayBinaryModel: null,
      });
    }

    case ExtremeType.STELLAR_MASS_BLACK_HOLE:
    case ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE: {
      const base =
        blackHoleLaboratoryModel(
          type,
          presetIndex,
        );

      return Object.freeze({
        type,
        presetIndex,
        presetLabel,
        detailStage,
        detectedCompactVisual:
          detailStage === 'DETECTED'
            ? compactObjectScientificVisual(
                'BLACK_HOLE',
              )
            : null,
        neutronStarModel: null,
        blackHoleModel:
          detailStage === 'DETECTED'
            ? null
            : blackHoleProgressionModel(
                base,
                detailStage,
              ),
        xrayBinaryModel: null,
      });
    }

    case ExtremeType.X_RAY_BINARY_NS:
    case ExtremeType.X_RAY_BINARY_BH:
    case ExtremeType.MICROQUASAR:
    case ExtremeType.ULX: {
      const base =
        xrayBinaryLaboratoryModel(
          type,
          presetIndex,
        );

      return Object.freeze({
        type,
        presetIndex,
        presetLabel,
        detailStage,
        detectedCompactVisual: null,
        neutronStarModel: null,
        blackHoleModel: null,
        xrayBinaryModel:
          xrayBinaryProgressionModel(
            base,
            detailStage,
          ),
      });
    }

    case ExtremeType.SUPERNOVA_REMNANT:
    case ExtremeType.PULSAR_WIND_NEBULA:
      // Archive already owns the canonical remnant renderer and real SNR model.
      return Object.freeze({
        type,
        presetIndex,
        presetLabel,
        detailStage,
        detectedCompactVisual: null,
        neutronStarModel: null,
        blackHoleModel: null,
        xrayBinaryModel: null,
      });

    case ExtremeType.SMBH:
    case ExtremeType.AGN:
    case ExtremeType.QUASAR:
      throw new RangeError(
        `28.2G.2 distributed Archive renderer does not accept galactic-nucleus type ${type}.`,
      );
  }
}


function compactVisualKindForNeutronStarType(
  type:
    | typeof ExtremeType.NEUTRON_STAR
    | typeof ExtremeType.PULSAR
    | typeof ExtremeType.MILLISECOND_PULSAR
    | typeof ExtremeType.MAGNETAR,
): 'NEUTRON_STAR' | 'PULSAR' | 'MILLISECOND_PULSAR' | 'MAGNETAR' {

  switch (type) {
    case ExtremeType.NEUTRON_STAR:
      return 'NEUTRON_STAR';

    case ExtremeType.PULSAR:
      return 'PULSAR';

    case ExtremeType.MILLISECOND_PULSAR:
      return 'MILLISECOND_PULSAR';

    case ExtremeType.MAGNETAR:
      return 'MAGNETAR';
  }
}

/**
 * 28.2G.3a — exact game reuse of the already-approved 28.2F discovery
 * progression. These transforms deliberately mirror the laboratory values;
 * they only reduce presentation detail and never become measured physics.
 */
function neutronStarProgressionModel(
  base:
    NeutronStarLaboratoryRenderModel,

  detailStage:
    ExtremeLaboratoryDetailStage,
): NeutronStarLaboratoryRenderModel {

  if (
    detailStage === 'CONFIRMED'
  ) {
    return base;
  }

  if (
    detailStage === 'CATALOGUED'
  ) {
    return Object.freeze({
      ...base,
      caveat:
        'Vista CATALOGUED: morfología compacta completamente caracterizada y estática; la animación final se reserva para CONFIRMED.',
    });
  }

  if (
    detailStage === 'DISCOVERED'
  ) {
    return Object.freeze({
      ...base,
      surfaceDetailScale:
        base.surfaceDetailScale * 0.58,
      surfaceFineScale:
        base.surfaceFineScale * 0.42,
      surfaceHotIntensity:
        base.surfaceHotIntensity * 0.62,
      surfaceContrast:
        base.surfaceContrast * 0.84,
      surfaceBrightness:
        base.surfaceBrightness * 0.86,
      surfaceFresnelStrength:
        base.surfaceFresnelStrength * 0.68,
      coronaOpacity:
        base.coronaOpacity * 0.38,
      wispCount:
        Math.min(
          base.wispCount,
          2,
        ),
      wispOpacity:
        base.wispOpacity * 0.28,
      activityRate:
        base.activityRate * 0.58,
      caveat:
        'Vista DISCOVERED: representación estática con superficie compacta, corona y actividad deliberadamente simplificadas.',
    });
  }

  return base;
}

function blackHoleProgressionModel(
  base:
    BlackHoleLaboratoryRenderModel,

  detailStage:
    ExtremeLaboratoryDetailStage,
): BlackHoleLaboratoryRenderModel {

  if (
    detailStage === 'CONFIRMED'
  ) {
    return base;
  }

  if (
    detailStage === 'CATALOGUED'
  ) {
    return Object.freeze({
      ...base,
      caveat:
        'Vista CATALOGUED: geometría relativista completa del laboratorio, detenida para inspección científica estática.',
    });
  }

  if (
    detailStage === 'DISCOVERED'
  ) {
    return Object.freeze({
      ...base,
      diskBrightness:
        base.diskBrightness * 0.76,
      lensingStrength:
        base.lensingStrength * 0.74,
      turbulenceScale:
        base.turbulenceScale * 0.72,
      turbulenceStrength:
        base.turbulenceStrength * 0.42,
      diskThickness:
        base.diskThickness * 0.90,
      caveat:
        'Vista DISCOVERED: firma de agujero negro ya reconocible, pero con acreción, turbulencia y lente deliberadamente simplificadas.',
    });
  }

  return base;
}

function xrayBinaryProgressionModel(
  base:
    XrayBinaryLaboratoryRenderModel,

  detailStage:
    ExtremeLaboratoryDetailStage,
): XrayBinaryLaboratoryRenderModel {

  if (
    detailStage === 'CONFIRMED'
  ) {
    return base;
  }

  if (
    detailStage === 'CATALOGUED'
  ) {
    return Object.freeze({
      ...base,
      caveat:
        'Vista CATALOGUED: sistema compacto completamente caracterizado y estático; la animación final se reserva para CONFIRMED.',
    });
  }

  if (
    detailStage === 'DISCOVERED'
  ) {
    return Object.freeze({
      ...base,
      donorScale:
        base.donorScale * 0.96,
      diskRadiusRem:
        base.diskRadiusRem * 0.94,
      streamHeightRem:
        base.streamHeightRem * 0.92,
      streamWidthRem:
        base.streamWidthRem * 0.88,
      coronaScale:
        base.coronaScale * 0.84,
      xrayOpacity:
        base.xrayOpacity * 0.74,
      jetPowerErgS:
        base.jetPowerErgS === null
          ? null
          : Number(
              (
                base.jetPowerErgS *
                0.58
              ).toPrecision(3),
            ),
      jetOpeningDegrees:
        base.jetOpeningDegrees === null
          ? null
          : Math.round(
              (
                base.jetOpeningDegrees *
                1.12
              ) *
              10,
            ) / 10,
      superEddingtonFactor:
        base.superEddingtonFactor === null
          ? null
          : Math.round(
              (
                base.superEddingtonFactor *
                0.64
              ) *
              10,
            ) / 10,
      windVelocityFractionC:
        base.windVelocityFractionC === null
          ? null
          : Math.round(
              (
                base.windVelocityFractionC *
                0.82
              ) *
              100,
            ) / 100,
      caveat:
        'Vista DISCOVERED: morfología compacta reconocible y estática, con transferencia de masa, acreción y emisión deliberadamente simplificadas.',
    });
  }

  return Object.freeze({
    ...base,
    donorScale:
      base.donorScale * 0.92,
    diskRadiusRem:
      base.diskRadiusRem * 0.86,
    streamHeightRem:
      base.streamHeightRem * 0.84,
    streamWidthRem:
      base.streamWidthRem * 0.74,
    coronaScale:
      base.coronaScale * 0.70,
    xrayOpacity:
      base.xrayOpacity * 0.52,
    jetPowerErgS:
      base.jetPowerErgS === null
        ? null
        : Number(
            (
              base.jetPowerErgS *
              0.34
            ).toPrecision(3),
          ),
    jetOpeningDegrees:
      base.jetOpeningDegrees === null
        ? null
        : Math.round(
            (
              base.jetOpeningDegrees *
              1.28
            ) *
            10,
          ) / 10,
    superEddingtonFactor:
      base.superEddingtonFactor === null
        ? null
        : Math.round(
            (
              base.superEddingtonFactor *
              0.44
            ) *
            10,
          ) / 10,
    windVelocityFractionC:
      base.windVelocityFractionC === null
        ? null
        : Math.round(
            (
              base.windVelocityFractionC *
              0.66
            ) *
            100,
          ) / 100,
    caveat:
      'Vista DETECTED: esquema compacto estático de alto nivel para identificar donante, objeto compacto, transferencia de masa y firma energética dominante.',
  });
}

function stablePresetIndex(
  seed: string,
  type: ExtremeTypeValue,
): number {

  const value = `${seed}/${type}/28.2G.2/A-H`;
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) % EXTREME_LABORATORY_PRESET_LABELS.length;
}
