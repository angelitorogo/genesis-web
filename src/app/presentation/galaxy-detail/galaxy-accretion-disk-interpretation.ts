import { type AgnNucleusRenderModel } from '../laboratory/galactic-objects/agn-nucleus-render-model';
import { type QuasarNucleusRenderModel } from '../laboratory/galactic-objects/quasar-nucleus-render-model';

export interface GalaxyAccretionDiskReadoutFact {
  readonly label: string;
  readonly value: string;
}

export interface GalaxyAccretionDiskLegendFact {
  readonly label: string;
  readonly description: string;
}

export interface GalaxyAccretionDiskStrictInterpretation {
  readonly regimeLabel: string;
  readonly summary: string;
  readonly readoutFacts: readonly GalaxyAccretionDiskReadoutFact[];
  readonly legendFacts: readonly GalaxyAccretionDiskLegendFact[];
}

function percentageLabel(value01: number): string {
  return `${Math.round(value01 * 100)} %`;
}

function classifyInclination(value01: number): string {
  if (value01 <= 0.25) return 'Casi frontal';
  if (value01 <= 0.5) return 'Oblicua moderada';
  if (value01 <= 0.75) return 'Oblicua alta';
  return 'Casi de canto';
}

function classifyThickness(value01: number): string {
  if (value01 <= 0.04) return 'Disco fino';
  if (value01 <= 0.075) return 'Disco intermedio';
  return 'Torus / disco grueso';
}

function classifyStrength(value01: number, low: number, high: number, labels: readonly [string, string, string]): string {
  if (value01 < low) return labels[0];
  if (value01 < high) return labels[1];
  return labels[2];
}

export function buildAgnAccretionDiskInterpretation(
  model: AgnNucleusRenderModel,
): GalaxyAccretionDiskStrictInterpretation {
  return Object.freeze({
    regimeLabel: `${model.family.replaceAll('_', ' ')} · ${classifyInclination(model.inclination)}`,
    summary:
      'Lectura visual estricta del modelo AGN: separa región interna caliente, anillo fotónico, disco principal y componente coronal sin presentar la ilustración como observación directa.',
    readoutFacts: Object.freeze([
      { label: 'Inclinación', value: classifyInclination(model.inclination) },
      { label: 'Espesor visual', value: classifyThickness(model.diskThickness) },
      { label: 'Brillo del disco', value: classifyStrength(model.accretionBrightness, 0.45, 0.72, ['Moderado', 'Alto', 'Muy alto']) },
      { label: 'Corona', value: classifyStrength(model.coronaStrength, 0.22, 0.42, ['Débil', 'Visible', 'Prominente']) },
      { label: 'Anillo fotónico', value: classifyStrength(model.photonRingStrength, 0.45, 0.7, ['Suave', 'Marcado', 'Dominante']) },
      { label: 'Asimetría Doppler', value: classifyStrength(model.dopplerAsymmetry, 0.2, 0.4, ['Baja', 'Media', 'Alta']) },
    ]),
    legendFacts: Object.freeze([
      {
        label: 'Región interna caliente',
        description: `Corresponde a la vecindad más energética del disco. Temperatura cromática sesgada ${percentageLabel(model.temperatureBias)} hacia tonos internos.`,
      },
      {
        label: 'Disco principal',
        description: `El cuerpo del disco ocupa del radio interno al externo con brillo integrado ${percentageLabel(model.accretionBrightness)} y turbulencia ${percentageLabel(model.turbulence)}.`,
      },
      {
        label: 'Borde externo',
        description: `El cierre del disco mantiene una textura más fría y clumpy con granularidad ${percentageLabel(model.clumpiness)} y deformación ${percentageLabel(model.warp)}.`,
      },
      {
        label: 'Corona / emisión difusa',
        description: `La emisión alrededor del núcleo aparece con intensidad ${percentageLabel(model.coronaStrength)} y lenteado ${percentageLabel(model.lensingStrength)}.`,
      },
    ]),
  });
}

export function buildQuasarAccretionDiskInterpretation(
  model: QuasarNucleusRenderModel,
): GalaxyAccretionDiskStrictInterpretation {
  const polarFeature = model.jetStrength >= model.windStrength
    ? `Jets relativistas ${classifyStrength(model.jetStrength, 0.35, 0.65, ['moderados', 'intensos', 'dominantes'])}`
    : `Viento polar ${classifyStrength(model.windStrength, 0.35, 0.65, ['moderado', 'intenso', 'dominante'])}`;

  return Object.freeze({
    regimeLabel: `${model.family.replaceAll('_', ' ')} · ${classifyInclination(model.inclination)}`,
    summary:
      'Lectura visual estricta del modelo quásar: enfatiza el disco hiperluminoso y el componente polar dominante, diferenciando emisión coronal, halo de dispersión y estructura radial del disco.',
    readoutFacts: Object.freeze([
      { label: 'Inclinación', value: classifyInclination(model.inclination) },
      { label: 'Espesor visual', value: classifyThickness(model.diskThickness) },
      { label: 'Brillo del disco', value: classifyStrength(model.accretionBrightness, 0.5, 0.78, ['Alto', 'Muy alto', 'Extremo']) },
      { label: 'Corona', value: classifyStrength(model.coronaStrength, 0.28, 0.48, ['Visible', 'Fuerte', 'Hiperluminosa']) },
      { label: 'Componente polar', value: polarFeature },
      { label: 'Halo de dispersión', value: classifyStrength(model.scatteringHaloStrength, 0.22, 0.45, ['Suave', 'Visible', 'Extendido']) },
    ]),
    legendFacts: Object.freeze([
      {
        label: 'Región interna hiperluminosa',
        description: `Corresponde al núcleo térmico más intenso del cuásar, con brillo ${percentageLabel(model.accretionBrightness)} y anillo fotónico ${percentageLabel(model.photonRingStrength)}.`,
      },
      {
        label: 'Disco principal',
        description: `El disco mantiene asimetría Doppler ${percentageLabel(model.dopplerAsymmetry)} y turbulencia ${percentageLabel(model.turbulence)} a lo largo de su extensión visible.`,
      },
      {
        label: 'Componente polar',
        description: `La estructura polar combina jets ${percentageLabel(model.jetStrength)} / vientos ${percentageLabel(model.windStrength)} con apertura ${percentageLabel(model.jetOpening)}.`,
      },
      {
        label: 'Halo / entorno difuso',
        description: `La envolvente externa muestra dispersión ${percentageLabel(model.scatteringHaloStrength)} y opacidad toroidal ${percentageLabel(model.dustTorusOpacity)}.`,
      },
    ]),
  });
}
